import { describe, expect, it } from "vitest";

import {
  computeInvoiceTotals,
  computeLineItemTotalRial,
  computeUnitPriceRial,
} from "../lib/calc";
import { Invoice, LineItem, Service } from "../lib/schema";

describe("computeUnitPriceRial", () => {
  it("uses the unit price override when provided", () => {
    const service: Service = {
      id: "svc-fixed",
      title: "Fixed Service",
      basePriceRial: 1_000,
      pricingModel: "fixed",
    };

    const lineItem: LineItem = {
      id: "line-fixed",
      serviceId: service.id,
      pricingModel: "fixed",
      qty: 1,
      unitPriceOverrideRial: 750,
    };

    expect(computeUnitPriceRial(service, lineItem)).toBe(750);
  });

  it("returns the configured rate for hourly services", () => {
    const service: Service = {
      id: "svc-hourly",
      title: "Hourly Service",
      basePriceRial: 0,
      hourlyRateRial: 200_000,
      pricingModel: "hourly",
    };

    const lineItem: LineItem = {
      id: "line-hourly",
      serviceId: service.id,
      pricingModel: "hourly",
      qty: 1,
      hours: 3,
    };

    expect(computeUnitPriceRial(service, lineItem)).toBe(200_000);
  });

  it("selects the correct tier based on quantity", () => {
    const service: Service = {
      id: "svc-tiered",
      title: "Tiered Service",
      basePriceRial: 0,
      pricingModel: "tiered",
      tiers: [
        { from: 1, to: 10, unitPriceRial: 120_000 },
        { from: 11, unitPriceRial: 95_000 },
      ],
    };

    const lineItem: LineItem = {
      id: "line-tiered",
      serviceId: service.id,
      pricingModel: "tiered",
      qty: 12,
    };

    expect(computeUnitPriceRial(service, lineItem)).toBe(95_000);
  });
});

describe("computeLineItemTotalRial", () => {
  it("computes totals for fixed pricing including drafts and edits", () => {
    const service: Service = {
      id: "svc-fixed",
      title: "Fixed Service",
      basePriceRial: 1_000_000,
      draftPriceRial: 50_000,
      editPriceRial: 25_000,
      pricingModel: "fixed",
    };

    const lineItem: LineItem = {
      id: "line-fixed",
      serviceId: service.id,
      pricingModel: "fixed",
      qty: 1,
      drafts: 2,
      edits: 1,
    };

    const expected = 1_000_000 + 2 * 50_000 + 1 * 25_000;
    expect(computeLineItemTotalRial(service, lineItem)).toBe(expected);
  });

  it("multiplies hours for hourly pricing", () => {
    const service: Service = {
      id: "svc-hourly",
      title: "Hourly Service",
      basePriceRial: 0,
      hourlyRateRial: 150_000,
      pricingModel: "hourly",
    };

    const lineItem: LineItem = {
      id: "line-hourly",
      serviceId: service.id,
      pricingModel: "hourly",
      qty: 1,
      hours: 4.5,
      drafts: 1,
    };

    const expected = 4.5 * 150_000 + 0; // draft price defaults to zero
    expect(computeLineItemTotalRial(service, lineItem)).toBe(expected);
  });

  it("uses pages for per-page pricing", () => {
    const service: Service = {
      id: "svc-per-page",
      title: "Per Page Service",
      basePriceRial: 80_000,
      pricingModel: "per_page",
    };

    const lineItem: LineItem = {
      id: "line-per-page",
      serviceId: service.id,
      pricingModel: "per_page",
      qty: 1,
      pages: 6,
    };

    expect(computeLineItemTotalRial(service, lineItem)).toBe(6 * 80_000);
  });

  it("uses item count for per-item pricing", () => {
    const service: Service = {
      id: "svc-per-item",
      title: "Per Item Service",
      basePriceRial: 35_000,
      pricingModel: "per_item",
    };

    const lineItem: LineItem = {
      id: "line-per-item",
      serviceId: service.id,
      pricingModel: "per_item",
      qty: 1,
      items: 10,
      unitPriceOverrideRial: 32_000,
    };

    expect(computeLineItemTotalRial(service, lineItem)).toBe(10 * 32_000);
  });

  it("applies tiered pricing with add-ons", () => {
    const service: Service = {
      id: "svc-tiered",
      title: "Tiered Service",
      basePriceRial: 0,
      draftPriceRial: 10_000,
      editPriceRial: 5_000,
      pricingModel: "tiered",
      tiers: [
        { from: 1, to: 9, unitPriceRial: 120_000 },
        { from: 10, unitPriceRial: 95_000 },
      ],
    };

    const lineItem: LineItem = {
      id: "line-tiered",
      serviceId: service.id,
      pricingModel: "tiered",
      qty: 12,
      drafts: 2,
      edits: 1,
    };

    const expected = 12 * 95_000 + 2 * 10_000 + 1 * 5_000;
    expect(computeLineItemTotalRial(service, lineItem)).toBe(expected);
  });
});

describe("computeInvoiceTotals", () => {
  const services: Service[] = [
    {
      id: "svc-fixed",
      title: "Fixed Service",
      basePriceRial: 1_000_000,
      draftPriceRial: 50_000,
      editPriceRial: 25_000,
      pricingModel: "fixed",
    },
    {
      id: "svc-hourly",
      title: "Hourly Service",
      basePriceRial: 0,
      hourlyRateRial: 200_000,
      draftPriceRial: 40_000,
      editPriceRial: 30_000,
      pricingModel: "hourly",
    },
    {
      id: "svc-tiered",
      title: "Tiered Service",
      basePriceRial: 0,
      draftPriceRial: 10_000,
      editPriceRial: 5_000,
      pricingModel: "tiered",
      tiers: [
        { from: 1, to: 10, unitPriceRial: 120_000 },
        { from: 11, unitPriceRial: 95_000 },
      ],
    },
  ];

  const baseInvoice: Invoice = {
    id: "inv-001",
    type: "pre",
    number: "INV-001",
    dateJalali: "1403-01-01",
    client: {
      id: "client-1",
      name: "Acme",
    },
    items: [
      {
        id: "line-fixed",
        serviceId: "svc-fixed",
        pricingModel: "fixed",
        qty: 1,
        drafts: 1,
        edits: 2,
      },
      {
        id: "line-hourly",
        serviceId: "svc-hourly",
        pricingModel: "hourly",
        qty: 1,
        hours: 4.5,
        drafts: 1,
        edits: 1,
      },
      {
        id: "line-tiered",
        serviceId: "svc-tiered",
        pricingModel: "tiered",
        qty: 12,
        drafts: 2,
        edits: 1,
      },
    ],
    taxPercent: 9,
    discount: { type: "percent", value: 10 },
    surcharges: {
      rushPercent: 12.5,
      shippingRial: 500_000,
      otherRial: 250_000,
    },
    currency: "rial",
    createdAt: "now",
    updatedAt: "now",
  };

  it("calculates subtotal, tax, discount, surcharges, and payable", () => {
    const totals = computeInvoiceTotals(baseInvoice, services);

    expect(totals.subtotal).toBe(3_235_000);
    expect(totals.tax).toBe(291_150);
    expect(totals.discount).toBe(323_500);
    expect(totals.surcharges).toBe(1_154_375);
    expect(totals.payable).toBe(4_357_025);
  });

  it("never returns a negative payable even with large discounts", () => {
    const heavilyDiscounted: Invoice = {
      ...baseInvoice,
      discount: { type: "fixed", value: 10_000_000 },
      surcharges: undefined,
      taxPercent: 0,
    };

    const totals = computeInvoiceTotals(heavilyDiscounted, services);

    expect(totals.subtotal).toBe(3_235_000);
    expect(totals.discount).toBe(10_000_000);
    expect(totals.payable).toBe(0);
  });
});
