'use client';

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import dayjs from "dayjs";
import jalaliday from "jalaliday";

dayjs.extend(jalaliday);

export type InvoiceType = "pre" | "final";

export interface ClientRecord {
  id: string;
  name: string;
  phone?: string;
  instagram?: string;
  createdAt: string;
}

export interface WorkRecord {
  id: string;
  title: string;
  basePrice: number;
  draftPrice: number;
  editPrice: number;
  createdAt: string;
}

export interface InvoiceItemRecord {
  id: string;
  workId: string;
  qty: number;
  drafts: number;
  edits: number;
  customDesc?: string;
}

export interface InvoiceRecord {
  id: string;
  type: InvoiceType;
  number: string;
  dateJalali: string;
  clientId: string;
  items: InvoiceItemRecord[];
  taxRate: number;
  discountRial: number;
  currency: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsRecord {
  defaultTaxRate: number;
  defaultCurrency: string;
  theme: string;
  language: string;
  preCounter: number;
  finalCounter: number;
}

type NewClientInput = Omit<ClientRecord, "id" | "createdAt"> & { id?: string };
type NewWorkInput = Omit<WorkRecord, "id" | "createdAt"> & { id?: string };
export type NewInvoiceItemInput = {
  id?: string;
  workId: string;
  qty: number;
  drafts?: number;
  edits?: number;
  customDesc?: string;
};
type NewInvoiceInput = {
  id?: string;
  type: InvoiceType;
  dateJalali?: string;
  clientId: string;
  items: NewInvoiceItemInput[];
  taxRate?: number;
  discountRial?: number;
  currency?: string;
  theme?: string;
};
type InvoiceUpdateInput = Partial<
  Omit<InvoiceRecord, "id" | "createdAt" | "items" | "number">
> & {
  items?: NewInvoiceItemInput[];
  number?: never;
};
type ClientUpdateInput = Partial<Omit<ClientRecord, "id" | "createdAt">>;
type WorkUpdateInput = Partial<Omit<WorkRecord, "id" | "createdAt">>;
type DuplicateInvoiceOptions = Partial<
  Omit<NewInvoiceInput, "id" | "items" | "clientId" | "type">
> & {
  clientId?: string;
  items?: NewInvoiceItemInput[];
  type?: InvoiceType;
  dateJalali?: string;
};

interface AccountingStoreState {
  clients: ClientRecord[];
  works: WorkRecord[];
  invoices: InvoiceRecord[];
  settings: SettingsRecord;
  addClient: (data: NewClientInput) => ClientRecord;
  updateClient: (id: string, changes: ClientUpdateInput) => ClientRecord | undefined;
  deleteClient: (id: string) => void;
  addWork: (data: NewWorkInput) => WorkRecord;
  updateWork: (id: string, changes: WorkUpdateInput) => WorkRecord | undefined;
  deleteWork: (id: string) => void;
  addInvoice: (data: NewInvoiceInput) => InvoiceRecord;
  updateInvoice: (id: string, changes: InvoiceUpdateInput) => InvoiceRecord | undefined;
  duplicateInvoice: (
    id: string,
    overrides?: DuplicateInvoiceOptions,
  ) => InvoiceRecord | undefined;
  convertInvoiceToFinal: (id: string) => InvoiceRecord | undefined;
  deleteInvoice: (id: string) => void;
  updateSettings: (changes: Partial<SettingsRecord>) => void;
}

const DEFAULT_SETTINGS: SettingsRecord = {
  defaultTaxRate: 0.09,
  defaultCurrency: "IRR",
  theme: "light",
  language: "fa",
  preCounter: 0,
  finalCounter: 0,
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

function isoNow(): string {
  return new Date().toISOString();
}

function padSerial(serial: number): string {
  return serial.toString().padStart(4, "0");
}

function nextInvoiceNumber(
  type: InvoiceType,
  settings: SettingsRecord,
): { number: string; settings: SettingsRecord } {
  const jalaliYear = dayjs().calendar("jalali").format("YYYY");

  if (type === "pre") {
    const next = settings.preCounter + 1;
    return {
      number: `PF-${jalaliYear}-${padSerial(next)}`,
      settings: { ...settings, preCounter: next },
    };
  }

  const next = settings.finalCounter + 1;
  return {
    number: `INV-${jalaliYear}-${padSerial(next)}`,
    settings: { ...settings, finalCounter: next },
  };
}

function normalizeInvoiceItems(items: NewInvoiceItemInput[]): InvoiceItemRecord[] {
  return items.map((item, index) => ({
    id: item.id ?? createId(`invoice-item-${index + 1}`),
    workId: item.workId,
    qty: item.qty,
    drafts: item.drafts ?? 0,
    edits: item.edits ?? 0,
    customDesc: item.customDesc,
  }));
}

function cloneInvoiceItems(items: InvoiceItemRecord[]): NewInvoiceItemInput[] {
  return items.map((item) => ({
    workId: item.workId,
    qty: item.qty,
    drafts: item.drafts,
    edits: item.edits,
    customDesc: item.customDesc,
  }));
}

function buildInvoiceRecord(
  data: NewInvoiceInput,
  settings: SettingsRecord,
): { record: InvoiceRecord; settings: SettingsRecord } {
  const now = isoNow();
  const normalizedItems = normalizeInvoiceItems(data.items);
  const { number, settings: nextSettings } = nextInvoiceNumber(data.type, settings);

  const record: InvoiceRecord = {
    id: data.id ?? createId("invoice"),
    type: data.type,
    number,
    dateJalali: data.dateJalali ?? jalaliToday(),
    clientId: data.clientId,
    items: normalizedItems,
    taxRate: data.taxRate ?? settings.defaultTaxRate,
    discountRial: data.discountRial ?? 0,
    currency: data.currency ?? settings.defaultCurrency,
    theme: data.theme ?? settings.theme,
    createdAt: now,
    updatedAt: now,
  };

  return {
    record,
    settings: nextSettings,
  };
}

export const useAccountingStore = create<AccountingStoreState>()(
  persist(
    (set, get) => ({
      clients: [],
      works: [],
      invoices: [],
      settings: DEFAULT_SETTINGS,

      addClient: (data) => {
        const record: ClientRecord = {
          id: data.id ?? createId("client"),
          name: data.name,
          phone: data.phone,
          instagram: data.instagram,
          createdAt: isoNow(),
        };

        set((state) => ({ clients: [...state.clients, record] }));
        return record;
      },

      updateClient: (id, changes) => {
        let updated: ClientRecord | undefined;

        set((state) => ({
          clients: state.clients.map((client) => {
            if (client.id !== id) {
              return client;
            }

            updated = { ...client, ...changes };
            return updated;
          }),
        }));

        return updated;
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
        }));
      },

      addWork: (data) => {
        const record: WorkRecord = {
          id: data.id ?? createId("work"),
          title: data.title,
          basePrice: data.basePrice,
          draftPrice: data.draftPrice,
          editPrice: data.editPrice,
          createdAt: isoNow(),
        };

        set((state) => ({ works: [...state.works, record] }));
        return record;
      },

      updateWork: (id, changes) => {
        let updated: WorkRecord | undefined;

        set((state) => ({
          works: state.works.map((work) => {
            if (work.id !== id) {
              return work;
            }

            updated = { ...work, ...changes };
            return updated;
          }),
        }));

        return updated;
      },

      deleteWork: (id) => {
        set((state) => ({
          works: state.works.filter((work) => work.id !== id),
        }));
      },

      addInvoice: (data) => {
        let created: InvoiceRecord | undefined;

        set((state) => {
          const { record, settings } = buildInvoiceRecord(data, state.settings);
          created = record;

          return {
            invoices: [...state.invoices, record],
            settings,
          };
        });

        return created;
      },

      updateInvoice: (id, changes) => {
        const state = get();
        let updatedInvoice: InvoiceRecord | undefined;

        set((current) => {
          let newSettings = current.settings;

          const invoices = current.invoices.map((invoice) => {
            if (invoice.id !== id) {
              return invoice;
            }

            let nextNumber = invoice.number;
            let nextType = invoice.type;

            if (changes.type && changes.type !== invoice.type) {
              const result = nextInvoiceNumber(changes.type, newSettings);
              nextNumber = result.number;
              newSettings = result.settings;
              nextType = changes.type;
            }

            const updated: InvoiceRecord = {
              ...invoice,
              ...changes,
              type: nextType,
              number: nextNumber,
              items: changes.items ? normalizeInvoiceItems(changes.items) : invoice.items,
              updatedAt: isoNow(),
            };

            updatedInvoice = updated;
            return updated;
          });

          return {
            invoices,
            settings: newSettings,
          };
        });

        return updatedInvoice ?? state.invoices.find((invoice) => invoice.id === id);
      },

      duplicateInvoice: (id, overrides) => {
        const source = get().invoices.find((invoice) => invoice.id === id);

        if (!source) {
          return undefined;
        }

        const items = overrides?.items ?? cloneInvoiceItems(source.items);

        let duplicated: InvoiceRecord | undefined;

        set((state) => {
          const { record, settings } = buildInvoiceRecord(
            {
              type: overrides?.type ?? source.type,
              clientId: overrides?.clientId ?? source.clientId,
              items,
              dateJalali: overrides?.dateJalali,
              taxRate: overrides?.taxRate ?? source.taxRate,
              discountRial: overrides?.discountRial ?? source.discountRial,
              currency: overrides?.currency ?? source.currency,
              theme: overrides?.theme ?? source.theme,
            },
            state.settings,
          );

          duplicated = record;

          return {
            invoices: [...state.invoices, record],
            settings,
          };
        });

        return duplicated;
      },

      convertInvoiceToFinal: (id) => {
        const duplicate = get().duplicateInvoice;
        return duplicate(id, {
          type: "final",
          dateJalali: jalaliToday(),
        });
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        }));
      },

      updateSettings: (changes) => {
        set((state) => ({
          settings: { ...state.settings, ...changes },
        }));
      },
    }),
    {
      name: "invoice-studio-accounting",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        clients: state.clients,
        works: state.works,
        invoices: state.invoices,
        settings: state.settings,
      }),
    },
  ),
);
