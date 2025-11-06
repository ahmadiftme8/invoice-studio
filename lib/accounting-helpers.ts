'use client';

import { deriveTotalPerItem, totals } from "./calc";
import { ClientRecord, InvoiceRecord, WorkRecord } from "./accounting-store";
import { InvoiceData, InvoiceItem, InvoiceSummarySettings } from "./schema";

export type InvoicePreviewDraft = {
  meta?: Partial<InvoiceData["meta"]>;
  seller?: Partial<InvoiceData["seller"]>;
  customer?: Partial<InvoiceData["customer"]>;
  bank?: Partial<InvoiceData["bank"]>;
  notes?: InvoiceData["notes"];
  items?: Partial<InvoiceItem>[];
  summary?: Partial<InvoiceSummarySettings>;
};

export type WorkLookup = Record<string, WorkRecord>;

export function createWorkLookup(works: WorkRecord[]): WorkLookup {
  return works.reduce<WorkLookup>((accumulator, work) => {
    accumulator[work.id] = work;
    return accumulator;
  }, {});
}

export function calculateInvoiceTotals(invoice: InvoiceRecord, works: WorkLookup) {
  const result = totals({
    items: invoice.items.map((item) => {
      const work = works[item.workId];
      return {
        item: {
          qty: item.qty,
          drafts: item.drafts,
          edits: item.edits,
        },
        work: work
          ? {
              basePrice: work.basePrice,
              draftPrice: work.draftPrice,
              editPrice: work.editPrice,
            }
          : { basePrice: 0, draftPrice: 0, editPrice: 0 },
      };
    }),
    taxRate: invoice.taxRate,
    discountRial: invoice.discountRial,
  });

  return result;
}

export function calculateRevenue(invoices: InvoiceRecord[], works: WorkRecord[]): number {
  const lookup = createWorkLookup(works);
  return invoices.reduce((sum, invoice) => sum + calculateInvoiceTotals(invoice, lookup).payable, 0);
}

function resolveItemName(work: WorkRecord | undefined, customDesc?: string) {
  if (customDesc?.trim()) {
    return customDesc.trim();
  }

  if (work?.title?.trim()) {
    return work.title.trim();
  }

  return "خدمت طراحی";
}

export function buildInvoicePreviewDraft(
  invoice: InvoiceRecord,
  client: ClientRecord | undefined,
  works: WorkRecord[],
): InvoicePreviewDraft {
  const lookup = createWorkLookup(works);

  const items: Partial<InvoiceItem>[] = invoice.items.map((item, index) => {
    const work = lookup[item.workId];
    const baseUnit = work
      ? deriveTotalPerItem(
          {
            drafts: item.drafts,
            edits: item.edits,
          },
          {
            basePrice: work.basePrice,
            draftPrice: work.draftPrice,
            editPrice: work.editPrice,
          },
        )
      : 0;

    const quantity = Number.isFinite(item.qty) ? item.qty : 1;
    const unitPrice = Math.round(baseUnit);
    const lineTotal = Math.round(unitPrice * (quantity || 1));

    return {
      id: `line-${index + 1}`,
      name: resolveItemName(work, item.customDesc),
      code: work ? work.id : undefined,
      unit: "خدمت",
      quantity,
      drafts: item.drafts,
      edits: item.edits,
      unitPrice,
      lineTotal,
    };
  });

  const invoiceTitle = invoice.type === "final" ? "فاکتور فروش" : "پیش فاکتور";
  

  return {
    meta: {
      title: invoiceTitle,
      number: invoice.number,
      issueDate: invoice.dateJalali,
    },
    customer: client
      ? {
          name: client.name,
          phone: client.phone,
          representative: client.instagram ? `@${client.instagram.replace(/^@/, "")}` : undefined,
        }
      : undefined,
    items,
    summary: {
      taxRate: invoice.taxRate,
      discount: invoice.discountRial,
    },
    notes: invoice.type === "pre" ? "این پیش فاکتور باز ویرایش است." : undefined,
    seller: undefined,
    bank: undefined,
  };
}
