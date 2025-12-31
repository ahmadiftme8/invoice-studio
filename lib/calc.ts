import {
  Invoice,
  InvoiceData,
  InvoiceItem,
  InvoiceSummarySettings,
  InvoiceTotals,
  LineItem,
  Service,
} from "./schema";

type TieredService = Extract<Service, { pricingModel: "tiered" }>;
type TieredLineItem = Extract<LineItem, { pricingModel: "tiered" }>;

function coerceNonNegative(value: number | undefined | null): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function findApplicableTier(service: TieredService, lineItem: TieredLineItem) {
  const quantity = lineItem.qty;
  const tier = service.tiers.find(
    (candidate) =>
      quantity >= candidate.from &&
      (candidate.to === undefined || quantity <= candidate.to),
  );

  if (!tier) {
    throw new Error(
      `No tier configured for quantity ${quantity} in service ${service.id}`,
    );
  }

  return tier;
}

export function computeUnitPriceRial(service: Service, lineItem: LineItem): number {
  if (lineItem.unitPriceOverrideRial !== undefined) {
    return lineItem.unitPriceOverrideRial;
  }

  if (service.pricingModel !== lineItem.pricingModel) {
    throw new Error(
      `Pricing model mismatch for service ${service.id}: service is ${service.pricingModel}, line item is ${lineItem.pricingModel}`,
    );
  }

  switch (lineItem.pricingModel) {
    case "fixed":
      return service.basePriceRial;
    case "per_page":
      return service.basePriceRial;
    case "per_item":
      return service.basePriceRial;
    case "hourly":
      if (service.pricingModel !== "hourly") {
        throw new Error(`Expected hourly service, received ${service.pricingModel}`);
      }
      return service.hourlyRateRial ?? service.basePriceRial;
    case "tiered": {
      if (service.pricingModel !== "tiered") {
        throw new Error(`Expected tiered service, received ${service.pricingModel}`);
      }
      const tier = findApplicableTier(
        service as TieredService,
        lineItem as TieredLineItem,
      );
      return tier.unitPriceRial;
    }
    default:
      return service.basePriceRial;
  }
}

export function computeLineItemTotalRial(service: Service, lineItem: LineItem): number {
  const draftsTotal =
    coerceNonNegative(lineItem.drafts) * coerceNonNegative(service.draftPriceRial);
  const editsTotal =
    coerceNonNegative(lineItem.edits) * coerceNonNegative(service.editPriceRial);
  const unitPrice = computeUnitPriceRial(service, lineItem);

  let base = 0;

  switch (lineItem.pricingModel) {
    case "fixed":
      base = unitPrice;
      break;
    case "hourly":
      base = unitPrice * coerceNonNegative(lineItem.hours);
      break;
    case "per_page":
      base = unitPrice * coerceNonNegative(lineItem.pages);
      break;
    case "per_item":
      base = unitPrice * coerceNonNegative(lineItem.items);
      break;
    case "tiered":
      base = unitPrice * lineItem.qty;
      break;
  }

  return base + draftsTotal + editsTotal;
}

function computeSurchargesRial(
  subtotal: number,
  surcharges: Invoice["surcharges"],
): number {
  if (!surcharges) {
    return 0;
  }

  const rushPercent = surcharges.rushPercent;
  const rush =
    rushPercent !== undefined
      ? Math.round(subtotal * (coerceNonNegative(rushPercent) / 100))
      : 0;
  const shipping = coerceNonNegative(surcharges.shippingRial);
  const other = coerceNonNegative(surcharges.otherRial);

  return rush + shipping + other;
}

export function computeInvoiceTotals(
  invoice: Invoice,
  services: Service[],
): {
  subtotal: number;
  tax: number;
  discount: number;
  surcharges: number;
  payable: number;
} {
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  const subtotal = invoice.items.reduce((sum, lineItem) => {
    const service = serviceMap.get(lineItem.serviceId);
    if (!service) {
      throw new Error(`Service ${lineItem.serviceId} not found for line item ${lineItem.id}`);
    }

    return sum + computeLineItemTotalRial(service, lineItem);
  }, 0);

  const tax = Math.round(subtotal * (coerceNonNegative(invoice.taxPercent) / 100));
  const rawDiscount =
    invoice.discount?.type === "percent"
      ? Math.round(subtotal * (coerceNonNegative(invoice.discount.value) / 100))
      : invoice.discount?.type === "fixed"
        ? invoice.discount.value
        : 0;
  const discount = coerceNonNegative(rawDiscount);
  const surcharges = computeSurchargesRial(subtotal, invoice.surcharges);
  const payable = Math.max(0, subtotal + tax + surcharges - discount);

  return {
    subtotal,
    tax,
    discount,
    surcharges,
    payable,
  };
}

function cleanNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(cleanNumber(quantity) * cleanNumber(unitPrice));
}

function calculateTotals(
  items: InvoiceItem[],
  summary: InvoiceSummarySettings,
): InvoiceTotals {
  const subtotal = items.reduce((acc, item) => acc + cleanNumber(item.lineTotal), 0);
  const tax = Math.round(subtotal * cleanNumber(summary.taxRate));
  const discount = Math.round(cleanNumber(summary.discount));
  const payable = subtotal + tax - discount;

  return {
    subtotal,
    tax,
    discount,
    payable,
  };
}

export function recalcInvoice(invoice: InvoiceData): InvoiceData {
  const items = invoice.items.map((item, index) => {
    const quantity = cleanNumber(item.quantity);
    const drafts = Math.max(0, Math.round(cleanNumber(item.drafts ?? 0)));
    const edits = Math.max(0, Math.round(cleanNumber(item.edits ?? 0)));
    const unitPrice = cleanNumber(item.unitPrice);
    const lineTotal = calculateLineTotal(quantity, unitPrice);

    return {
      ...item,
      quantity,
      drafts,
      edits,
      unitPrice,
      lineTotal,
      id: item.id || `item-${index + 1}`,
    };
  });

  const totals = calculateTotals(items, invoice.summary);

  return {
    ...invoice,
    items,
    totals,
  };
}

type InvoiceWorkPricing = {
  basePrice: number;
  draftPrice: number;
  editPrice: number;
};

type InvoiceItemBreakdown = {
  qty?: number;
  drafts?: number;
  edits?: number;
};

type InvoiceLineWithWork =
  | ({
      item: InvoiceItemBreakdown;
      work: InvoiceWorkPricing;
    } & Record<string, unknown>)
  | (InvoiceItemBreakdown & { work: InvoiceWorkPricing });

type InvoiceForTotals = {
  items?: InvoiceLineWithWork[];
  taxRate?: number;
  discount?: number;
  discountRial?: number;
};

function toNonNegative(value: number | undefined | null, fallback = 0): number {
  const numeric =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof fallback === "number" && Number.isFinite(fallback)
        ? fallback
        : 0;
  return numeric < 0 ? 0 : numeric;
}

function extractItem(line: InvoiceLineWithWork): InvoiceItemBreakdown {
  if ("item" in line && line.item && typeof line.item === "object") {
    return line.item as InvoiceItemBreakdown;
  }

  return line as InvoiceItemBreakdown;
}

export function deriveTotalPerItem(
  item: InvoiceItemBreakdown,
  work: InvoiceWorkPricing,
): number {
  const basePrice = toNonNegative(work?.basePrice);
  const drafts = toNonNegative(item?.drafts);
  const edits = toNonNegative(item?.edits);
  const draftPrice = toNonNegative(work?.draftPrice);
  const editPrice = toNonNegative(work?.editPrice);

  return basePrice + drafts * draftPrice + edits * editPrice;
}

export function totals(invoice: InvoiceForTotals): { subtotal: number; tax: number; payable: number } {
  const lines = Array.isArray(invoice.items) ? invoice.items : [];

  const subtotal = lines.reduce((accumulator, line) => {
    if (!line || typeof line !== "object" || !("work" in line) || !line.work) {
      return accumulator;
    }

    const item = extractItem(line);
    const perUnit = deriveTotalPerItem(item, line.work);
    const quantity =
      item.qty === undefined || item.qty === null ? 1 : toNonNegative(item.qty, 0);

    return accumulator + perUnit * quantity;
  }, 0);

  const roundedSubtotal = Math.round(subtotal);
  const taxRate = toNonNegative(invoice.taxRate);
  const tax = Math.round(roundedSubtotal * taxRate);
  const discountSource =
    invoice.discountRial ?? (invoice as { discount?: number }).discount ?? 0;
  const discount = Math.round(toNonNegative(discountSource));
  const payable = roundedSubtotal + tax - discount;

  return {
    subtotal: roundedSubtotal,
    tax,
    payable,
  };
}
