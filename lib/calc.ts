import { InvoiceData, InvoiceItem, InvoiceSummarySettings, InvoiceTotals } from "./schema";

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
