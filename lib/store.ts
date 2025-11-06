'use client';

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import dayjs from "dayjs";
import jalaliday from "jalaliday";
import {
  Discount,
  Invoice,
  InvoiceSchema,
  InvoicesSchema,
  LineItem,
  Service,
  ServiceSchema,
  ServicesSchema,
  StoreSettings,
  StoreSettingsSchema,
  lineItemValidatorForService,
} from "./schema";

dayjs.extend(jalaliday);

type NewServiceInput = Omit<Service, "id"> & { id?: string };
type ServiceUpdateInput = Partial<Omit<Service, "id">>;

type NewLineItemInput = Omit<LineItem, "id" | "pricingModel"> & {
  id?: string;
  pricingModel?: LineItem["pricingModel"];
};

type InvoiceCreationInput = {
  id?: string;
  type: Invoice["type"];
  dateJalali?: string;
  client: Invoice["client"];
  items: NewLineItemInput[];
  taxPercent?: number;
  discount?: Discount;
  surcharges?: Invoice["surcharges"];
  currency?: Invoice["currency"];
};

type InvoiceUpdateInput = {
  type?: Invoice["type"];
  dateJalali?: string;
  client?: Partial<Invoice["client"]>;
  items?: NewLineItemInput[];
  taxPercent?: number;
  discount?: Discount | null;
  surcharges?: Invoice["surcharges"] | null;
  currency?: Invoice["currency"];
};

type InvoiceStoreState = {
  services: Service[];
  invoices: Invoice[];
  settings: StoreSettings;
  addService: (input: NewServiceInput) => Service;
  updateService: (id: Service["id"], changes: ServiceUpdateInput) => Service | undefined;
  deleteService: (id: Service["id"]) => void;
  addInvoice: (input: InvoiceCreationInput) => Invoice;
  updateInvoice: (id: Invoice["id"], changes: InvoiceUpdateInput) => Invoice | undefined;
  deleteInvoice: (id: Invoice["id"]) => void;
  resetStore: () => void;
};

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function jalaliToday(): string {
  return dayjs().calendar("jalali").format("YYYY/MM/DD");
}

function jalaliYear(): string {
  return dayjs().calendar("jalali").format("YYYY");
}

function padSerial(value: number): string {
  return value.toString().padStart(4, "0");
}

function nextInvoiceNumber(
  type: Invoice["type"],
  settings: StoreSettings,
): { number: string; settings: StoreSettings } {
  const year = jalaliYear();

  if (type === "pre") {
    const next = settings.numberingCounters.pre + 1;
    return {
      number: `PF-${year}-${padSerial(next)}`,
      settings: {
        ...settings,
        numberingCounters: {
          ...settings.numberingCounters,
          pre: next,
        },
      },
    };
  }

  const next = settings.numberingCounters.final + 1;
  return {
    number: `INV-${year}-${padSerial(next)}`,
    settings: {
      ...settings,
      numberingCounters: {
        ...settings.numberingCounters,
        final: next,
      },
    },
  };
}

function isoNow(): string {
  return new Date().toISOString();
}

function normalizeService(input: NewServiceInput): Service {
  const candidate = {
    ...input,
    id: input.id ?? createId("service"),
  };

  return ServiceSchema.parse(candidate);
}

function validateLineItem(
  item: NewLineItemInput,
  services: Service[],
  index: number,
): LineItem {
  const service = services.find((entry) => entry.id === item.serviceId);

  if (!service) {
    throw new Error(`Service ${item.serviceId} not found for line item at index ${index}`);
  }

  const lineCandidate: LineItem = {
    ...item,
    id: item.id ?? createId(`line-${index + 1}`),
    pricingModel: service.pricingModel,
  };

  return lineItemValidatorForService(service).parse(lineCandidate);
}

function normalizeInvoice(
  input: InvoiceCreationInput,
  services: Service[],
  settings: StoreSettings,
): { record: Invoice; settings: StoreSettings } {
  const now = isoNow();
  const { number, settings: nextSettings } = nextInvoiceNumber(input.type, settings);
  const items = input.items.map((item, index) => validateLineItem(item, services, index));

  const invoice = InvoiceSchema.parse({
    id: input.id ?? createId("invoice"),
    type: input.type,
    number,
    dateJalali: input.dateJalali ?? jalaliToday(),
    client: input.client,
    items,
    taxPercent: input.taxPercent ?? settings.defaultTaxPercent,
    discount: input.discount,
    surcharges: input.surcharges ?? undefined,
    currency: input.currency ?? settings.defaultCurrency,
    createdAt: now,
    updatedAt: now,
  });

  return { record: invoice, settings: nextSettings };
}

function buildUpdatedInvoice(
  existing: Invoice,
  changes: InvoiceUpdateInput,
  services: Service[],
  settings: StoreSettings,
): { record: Invoice; settings: StoreSettings } {
  let nextSettings = settings;
  let nextType = existing.type;
  let nextNumber = existing.number;

  if (changes.type && changes.type !== existing.type) {
    const result = nextInvoiceNumber(changes.type, settings);
    nextType = changes.type;
    nextNumber = result.number;
    nextSettings = result.settings;
  }

  const items = changes.items
    ? changes.items.map((item, index) => validateLineItem(item, services, index))
    : existing.items;

  const discount =
    changes.discount === undefined
      ? existing.discount
      : changes.discount === null
        ? undefined
        : changes.discount;

  const surcharges =
    changes.surcharges === undefined
      ? existing.surcharges
      : changes.surcharges === null
        ? undefined
        : changes.surcharges;

  const invoice = InvoiceSchema.parse({
    ...existing,
    ...changes,
    type: nextType,
    number: nextNumber,
    client: changes.client ? { ...existing.client, ...changes.client } : existing.client,
    items,
    taxPercent: changes.taxPercent ?? existing.taxPercent,
    discount,
    surcharges,
    currency: changes.currency ?? existing.currency,
    dateJalali: changes.dateJalali ?? existing.dateJalali,
    updatedAt: isoNow(),
  });

  return { record: invoice, settings: nextSettings };
}

const DEFAULT_SETTINGS: StoreSettings = StoreSettingsSchema.parse({
  defaultTaxPercent: 9,
  defaultCurrency: "rial",
  numberingCounters: {
    pre: 0,
    final: 0,
  },
});

const SERVICE_SEED = ServicesSchema.parse([
  {
    id: "svc-logo",
    title: "Logo Design",
    pricingModel: "fixed",
    basePriceRial: 12000000,
    draftPriceRial: 1500000,
    editPriceRial: 900000,
    unitLabel: "project",
    description: "Primary logo design package",
  },
  {
    id: "svc-brand-book",
    title: "Brand Book",
    pricingModel: "per_page",
    basePriceRial: 800000,
    unitLabel: "page",
    description: "Brand identity guidelines per page",
  },
  {
    id: "svc-ui-design",
    title: "UI Design",
    pricingModel: "hourly",
    basePriceRial: 0,
    hourlyRateRial: 950000,
    unitLabel: "hour",
    description: "Product UI/UX design services",
  },
  {
    id: "svc-landing-screen",
    title: "Landing Screen",
    pricingModel: "per_item",
    basePriceRial: 3500000,
    unitLabel: "screen",
    description: "Landing screen design and delivery",
  },
  {
    id: "svc-restaurant-menu",
    title: "Restaurant Menu",
    pricingModel: "per_page",
    basePriceRial: 650000,
    unitLabel: "page",
    description: "Menu layout and typography",
  },
  {
    id: "svc-packaging",
    title: "Packaging",
    pricingModel: "tiered",
    basePriceRial: 0,
    unitLabel: "item",
    description: "Packaging design by quantity",
    tiers: [
      { from: 1, to: 10, unitPriceRial: 4500000 },
      { from: 11, to: 50, unitPriceRial: 3800000 },
      { from: 51, unitPriceRial: 3200000 },
    ],
  },
]);

function cloneService(service: Service): Service {
  if (service.pricingModel === "tiered") {
    return {
      ...service,
      tiers: service.tiers!.map((tier) => ({ ...tier })),
    };
  }

  const { tiers, ...rest } = service as Service & { tiers?: Service["tiers"] };
  return { ...rest };
}

function cloneServices(services: Service[]): Service[] {
  return services.map(cloneService);
}

function cloneSettings(settings: StoreSettings): StoreSettings {
  return {
    ...settings,
    numberingCounters: { ...settings.numberingCounters },
  };
}

function cloneInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    client: { ...invoice.client },
    items: invoice.items.map((item) => ({ ...item })),
    discount: invoice.discount ? { ...invoice.discount } : undefined,
    surcharges: invoice.surcharges ? { ...invoice.surcharges } : undefined,
  };
}

function cloneInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.map(cloneInvoice);
}

export const useInvoiceStore = create<InvoiceStoreState>()(
  persist(
    (set, _get) => ({
      services: cloneServices(SERVICE_SEED),
      invoices: [],
      settings: cloneSettings(DEFAULT_SETTINGS),
      addService: (input) => {
        const service = normalizeService(input);
        set((state) => ({
          services: [...state.services, service],
        }));
        return service;
      },
      updateService: (id, changes) => {
        let updated: Service | undefined;
        set((state) => {
          const services = state.services.map((service) => {
            if (service.id !== id) {
              return service;
            }

            const merged = ServiceSchema.parse({ ...service, ...changes, id });
            updated = merged;
            return merged;
          });

          return { services };
        });

        return updated;
      },
      deleteService: (id) => {
        set((state) => ({
          services: state.services.filter((service) => service.id !== id),
        }));
      },
      addInvoice: (input) => {
        let created: Invoice | undefined;
        set((state) => {
          const { record, settings } = normalizeInvoice(input, state.services, state.settings);
          created = record;
          return {
            invoices: [...state.invoices, record],
            settings,
          };
        });

        if (!created) {
          throw new Error("Failed to create invoice");
        }

        return created;
      },
      updateInvoice: (id, changes) => {
        let updated: Invoice | undefined;
        set((state) => {
          const target = state.invoices.find((invoice) => invoice.id === id);

          if (!target) {
            return {};
          }

          const { record, settings } = buildUpdatedInvoice(
            target,
            changes,
            state.services,
            state.settings,
          );

          const invoices = state.invoices.map((invoice) =>
            invoice.id === id ? record : invoice,
          );

          updated = record;

          return {
            invoices,
            settings,
          };
        });

        return updated;
      },
      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        }));
      },
      resetStore: () => {
        set({
          services: cloneServices(SERVICE_SEED),
          invoices: [],
          settings: cloneSettings(DEFAULT_SETTINGS),
        });
      },
    }),
    {
      name: "invoice-studio-state",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        services: state.services,
        invoices: state.invoices,
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        if (!persisted) {
          return current;
        }

        const servicesResult = ServicesSchema.safeParse(persisted.services);
        const invoicesResult = InvoicesSchema.safeParse(persisted.invoices);
        const settingsResult = StoreSettingsSchema.safeParse(persisted.settings);

          const services = servicesResult.success
            ? cloneServices(servicesResult.data)
            : current.services;
          const invoices = invoicesResult.success
            ? cloneInvoices(invoicesResult.data)
            : current.invoices;
          const settings = settingsResult.success
            ? cloneSettings(settingsResult.data)
            : current.settings;

          return {
            ...current,
            services,
            invoices,
            settings,
          };
      },
    },
  ),
);
