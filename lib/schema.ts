import { z } from "zod";

export const PricingModelSchema = z.enum([
  "fixed",
  "hourly",
  "per_page",
  "per_item",
  "tiered",
]);
export type PricingModel = z.infer<typeof PricingModelSchema>;

export const TierSchema = z
  .object({
    from: z.number().nonnegative(),
    to: z.number().positive().optional(),
    unitPriceRial: z.number().nonnegative(),
  })
  .superRefine((tier, ctx) => {
    if (tier.to !== undefined && tier.to <= tier.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`to` must be greater than `from` when provided",
        path: ["to"],
      });
    }
  });
export type Tier = z.infer<typeof TierSchema>;

const commonServiceFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().trim().min(1).optional(),
  basePriceRial: z.number().nonnegative(),
  draftPriceRial: z.number().nonnegative().optional(),
  editPriceRial: z.number().nonnegative().optional(),
  hourlyRateRial: z.number().nonnegative().optional(),
  unitLabel: z.string().trim().min(1).optional(),
} as const;

const TieredServiceSchema = z.object({
  ...commonServiceFields,
  pricingModel: z.literal("tiered"),
  tiers: z.array(TierSchema).min(1),
});

const NonTieredServiceSchema = z
  .object({
    ...commonServiceFields,
    pricingModel: z.enum(["fixed", "hourly", "per_page", "per_item"]),
    tiers: z.array(TierSchema).optional(),
  })
  .superRefine((service, ctx) => {
    if (service.tiers && service.tiers.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tiers are only allowed for tiered pricing",
        path: ["tiers"],
      });
    }
  });

export const ServiceSchema = z.union([TieredServiceSchema, NonTieredServiceSchema]);
export type Service = z.infer<typeof ServiceSchema>;
export type ServiceId = Service["id"];

const LineItemBaseSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  titleOverride: z.string().trim().min(1).optional(),
  qty: z.number().positive(),
  drafts: z.number().int().nonnegative().optional(),
  edits: z.number().int().nonnegative().optional(),
  unitPriceOverrideRial: z.number().nonnegative().optional(),
  notes: z.string().trim().min(1).optional(),
});

export const HourlyLineItemSchema = LineItemBaseSchema.extend({
  pricingModel: z.literal("hourly"),
  hours: z.number().positive(),
  pages: z.never().optional(),
  items: z.never().optional(),
});

export const PerPageLineItemSchema = LineItemBaseSchema.extend({
  pricingModel: z.literal("per_page"),
  pages: z.number().positive(),
  hours: z.never().optional(),
  items: z.never().optional(),
});

export const PerItemLineItemSchema = LineItemBaseSchema.extend({
  pricingModel: z.literal("per_item"),
  items: z.number().positive(),
  hours: z.never().optional(),
  pages: z.never().optional(),
});

export const TieredLineItemSchema = LineItemBaseSchema.extend({
  pricingModel: z.literal("tiered"),
  hours: z.never().optional(),
  pages: z.never().optional(),
  items: z.never().optional(),
}).superRefine((line, ctx) => {
  if (!Number.isFinite(line.qty) || line.qty <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quantity is required for tiered pricing",
      path: ["qty"],
    });
  }
});

export const FixedLineItemSchema = LineItemBaseSchema.extend({
  pricingModel: z.literal("fixed"),
  hours: z.never().optional(),
  pages: z.never().optional(),
  items: z.never().optional(),
});

export const LineItemSchema = z.discriminatedUnion("pricingModel", [
  FixedLineItemSchema,
  HourlyLineItemSchema,
  PerPageLineItemSchema,
  PerItemLineItemSchema,
  TieredLineItemSchema,
]);
export type LineItem = z.infer<typeof LineItemSchema>;

export const DiscountSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percent"),
    value: z.number().min(0).max(100),
  }),
  z.object({
    type: z.literal("fixed"),
    value: z.number().nonnegative(),
  }),
]);
export type Discount = z.infer<typeof DiscountSchema>;

export const SurchargesSchema = z
  .object({
    rushPercent: z.number().min(0).max(100).optional(),
    shippingRial: z.number().nonnegative().optional(),
    otherRial: z.number().nonnegative().optional(),
  })
  .refine(
    (value) => {
      const keys = Object.keys(value) as Array<keyof typeof value>;
      return keys.some((key) => value[key] !== undefined);
    },
    {
      message: "At least one surcharge must be provided",
    },
  );
export type Surcharges = z.infer<typeof SurchargesSchema>;

export const ClientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().trim().min(1).optional(),
  instagram: z.string().trim().min(1).optional(),
});
export type Client = z.infer<typeof ClientSchema>;

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["pre", "final"]),
  number: z.string().min(1),
  dateJalali: z.string().min(1),
  client: ClientSchema,
  items: z.array(LineItemSchema).min(1),
  taxPercent: z.number().min(0),
  discount: DiscountSchema.optional(),
  surcharges: SurchargesSchema.optional(),
  currency: z.enum(["rial", "toman"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const ServicesSchema = z.array(ServiceSchema);
export const InvoicesSchema = z.array(InvoiceSchema);

export function lineItemValidatorForService(service: Service) {
  return LineItemSchema.superRefine((item, ctx) => {
    if (item.serviceId !== service.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Service mismatch for line item",
        path: ["serviceId"],
      });
    }

    if (item.pricingModel !== service.pricingModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pricing model mismatch between service and line item",
        path: ["pricingModel"],
      });
      return;
    }

    if (item.pricingModel === "tiered") {
      const tiers = service.tiers ?? [];
      const applicable = tiers.find(
        (tier) =>
          item.qty >= tier.from && (tier.to === undefined || item.qty <= tier.to),
      );

      if (!applicable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantity does not fit any configured tier",
          path: ["qty"],
        });
      }
    }
  });
}

export const StoreSettingsSchema = z.object({
  defaultTaxPercent: z.number().min(0),
  defaultCurrency: z.enum(["rial", "toman"]),
  numberingCounters: z.object({
    pre: z.number().int().nonnegative(),
    final: z.number().int().nonnegative(),
  }),
});

export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

/**
 * @deprecated Legacy invoice interfaces retained for transition to the new domain model.
 */
export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  payable: number;
}

/**
 * @deprecated Legacy invoice interfaces retained for transition to the new domain model.
 */
export interface InvoiceSummarySettings {
  taxRate: number;
  discount: number;
}

/**
 * @deprecated Legacy invoice interfaces retained for transition to the new domain model.
 */
export interface InvoiceItem {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  quantity: number;
  drafts: number;
  edits: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * @deprecated Legacy invoice interfaces retained for transition to the new domain model.
 */
export interface InvoiceData {
  meta: {
    title: string;
    subtitle?: string;
    number: string;
    issueDate: string;
    dueDate?: string;
    project?: string;
    reference?: string;
  };
  seller: {
    name: string;
    representative?: string;
    taxCode?: string;
    registerCode?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  customer: {
    name: string;
    representative?: string;
    taxCode?: string;
    registerCode?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceItem[];
  summary: InvoiceSummarySettings;
  bank: {
    cardNumber: string;
    iban: string;
    phone: string;
    social: string;
  };
  notes?: string;
  totals: InvoiceTotals;
}
