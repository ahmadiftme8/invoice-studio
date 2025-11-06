"use client";

import { useEffect, useMemo } from "react";
import "@/styles/invoice.css";
import { Header } from "./Header";
import { ItemsTable } from "./ItemsTable";
import { Summary } from "./Summary";
import { Footer } from "./Footer";
import type { InvoicePreviewDraft } from "@/lib/accounting-helpers";
import { recalcInvoice } from "@/lib/calc";
import { InvoiceData } from "@/lib/schema";
import { englishToPersian, persianDigitsToEnglish } from "./utils";

type PreviewProps = {
  initialInvoice?: InvoicePreviewDraft;
};

const EMPTY_INVOICE: InvoiceData = {
  meta: {
    title: "",
    subtitle: "",
    number: "",
    issueDate: "",
    dueDate: "",
    project: "",
    reference: "",
  },
  seller: {
    name: "",
    representative: "",
    taxCode: "",
    registerCode: "",
    address: "",
    email: "",
    phone: "",
  },
  customer: {
    name: "",
    representative: "",
    taxCode: "",
    registerCode: "",
    address: "",
    email: "",
    phone: "",
  },
  items: [],
  summary: {
    taxRate: 0,
    discount: 0,
  },
  bank: {
    cardNumber: "",
    iban: "",
    phone: "",
    social: "",
  },
  notes: "",
  totals: {
    subtotal: 0,
    tax: 0,
    discount: 0,
    payable: 0,
  },
};

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function buildInvoice(draft?: InvoicePreviewDraft): InvoiceData {
  const items =
    draft?.items?.map((item, index) => {
      const quantity = toNumber(item?.quantity, 1);
      const unitPrice = toNumber(item?.unitPrice, 0);
      const lineTotal = toNumber(item?.lineTotal, Math.round(quantity * unitPrice));
      const drafts = toNumber(item?.drafts, 0);
      const edits = toNumber(item?.edits, 0);
      const id = toString(item?.id, `item-${index + 1}`);
      const name = toString(item?.name, `Item ${index + 1}`);
      const code = toString(item?.code, "");
      const unit = toString(item?.unit, "");
      const notes = toString(item?.notes, "");

      return {
        id,
        name,
        quantity,
        drafts,
        edits,
        unitPrice,
        lineTotal,
        ...(code ? { code } : {}),
        ...(unit ? { unit } : {}),
        ...(notes ? { notes } : {}),
      };
    }) ?? [];

  const invoice: InvoiceData = {
    meta: {
      title: toString(draft?.meta?.title, EMPTY_INVOICE.meta.title),
      subtitle: toString(draft?.meta?.subtitle, EMPTY_INVOICE.meta.subtitle),
      number: toString(draft?.meta?.number, EMPTY_INVOICE.meta.number),
      issueDate: toString(draft?.meta?.issueDate, EMPTY_INVOICE.meta.issueDate),
      dueDate: toString(draft?.meta?.dueDate, EMPTY_INVOICE.meta.dueDate),
      project: toString(draft?.meta?.project, EMPTY_INVOICE.meta.project),
      reference: toString(draft?.meta?.reference, EMPTY_INVOICE.meta.reference),
    },
    seller: {
      name: toString(draft?.seller?.name, EMPTY_INVOICE.seller.name),
      representative: toString(
        draft?.seller?.representative,
        EMPTY_INVOICE.seller.representative,
      ),
      taxCode: toString(draft?.seller?.taxCode, EMPTY_INVOICE.seller.taxCode),
      registerCode: toString(
        draft?.seller?.registerCode,
        EMPTY_INVOICE.seller.registerCode,
      ),
      address: toString(draft?.seller?.address, EMPTY_INVOICE.seller.address),
      email: toString(draft?.seller?.email, EMPTY_INVOICE.seller.email),
      phone: toString(draft?.seller?.phone, EMPTY_INVOICE.seller.phone),
    },
    customer: {
      name: toString(draft?.customer?.name, EMPTY_INVOICE.customer.name),
      representative: toString(
        draft?.customer?.representative,
        EMPTY_INVOICE.customer.representative,
      ),
      taxCode: toString(draft?.customer?.taxCode, EMPTY_INVOICE.customer.taxCode),
      registerCode: toString(
        draft?.customer?.registerCode,
        EMPTY_INVOICE.customer.registerCode,
      ),
      address: toString(draft?.customer?.address, EMPTY_INVOICE.customer.address),
      email: toString(draft?.customer?.email, EMPTY_INVOICE.customer.email),
      phone: toString(draft?.customer?.phone, EMPTY_INVOICE.customer.phone),
    },
    items,
    summary: {
      taxRate: toNumber(draft?.summary?.taxRate, EMPTY_INVOICE.summary.taxRate),
      discount: toNumber(draft?.summary?.discount, EMPTY_INVOICE.summary.discount),
    },
    bank: {
      cardNumber: toString(draft?.bank?.cardNumber, EMPTY_INVOICE.bank.cardNumber),
      iban: toString(draft?.bank?.iban, EMPTY_INVOICE.bank.iban),
      phone: toString(draft?.bank?.phone, EMPTY_INVOICE.bank.phone),
      social: toString(draft?.bank?.social, EMPTY_INVOICE.bank.social),
    },
    notes: toString(draft?.notes, EMPTY_INVOICE.notes),
    totals: { ...EMPTY_INVOICE.totals },
  };

  return recalcInvoice(invoice);
}

export function Preview({ initialInvoice }: PreviewProps) {
  const invoice = useMemo(() => buildInvoice(initialInvoice), [initialInvoice]);
  const totals = invoice.totals;

  useEffect(() => {
    function setPersianDate() {
      const now = new Date();
      const persianDate = now.toLocaleDateString("fa-IR");
      const dateElement = document.getElementById("invoice-date");
      const numberElement = document.getElementById("invoice-number");

      if (dateElement) {
        dateElement.textContent = persianDate;
      }

      if (numberElement) {
        const invoiceNumber = persianDate.replace(/\//g, "");
        numberElement.textContent = `${invoiceNumber}-1`;
      }
    }

    function recalc() {
      let subtotal = 0;
      const rows = document.querySelectorAll<HTMLTableRowElement>(
        ".invoice-container tbody tr",
      );

      rows.forEach((row, index) => {
        const qtyCell = row.cells[2];
        const unitCell = row.cells[5];
        const totalCell = row.cells[6];

        if (!qtyCell || !unitCell || !totalCell) {
          return;
        }

        const qtyText = qtyCell.innerText.trim();
        const unitText = unitCell.innerText.trim();
        const qty = parseFloat(
          persianDigitsToEnglish(qtyText.replace(/,/g, "")) || "0",
        );
        const unit = parseFloat(
          persianDigitsToEnglish(unitText.replace(/,/g, "")) || "0",
        );
        const total = qty * unit;

        row.cells[0].innerText = englishToPersian((index + 1).toString());
        totalCell.innerText = englishToPersian(total.toLocaleString("fa-IR"));
        subtotal += total;
      });

      const subtotalEl = document.querySelector<HTMLSpanElement>(
        ".summary-row.total span:last-child",
      );
      const summaryRows = Array.from(
        document.querySelectorAll<HTMLDivElement>(".summary-row"),
      );
      const taxEl = summaryRows[1]?.querySelector<HTMLSpanElement>("span:last-child") ?? null;
      const discountEl =
        summaryRows[2]?.querySelector<HTMLSpanElement>("span:last-child") ?? null;
      const payableEl = document.querySelector<HTMLSpanElement>(
        ".summary-row.payable span:last-child",
      );

      const tax = Math.round(subtotal * toNumber(invoice.summary.taxRate, 0));
      const discount = Math.round(toNumber(invoice.summary.discount, 0));
      const grandTotal = subtotal + tax - discount;

      if (subtotalEl) {
        subtotalEl.innerHTML = `${englishToPersian(
          subtotal.toLocaleString("fa-IR"),
        )} ریال`;
      }

      if (taxEl) {
        taxEl.innerHTML = `${englishToPersian(tax.toLocaleString("fa-IR"))} ریال`;
      }

      if (discountEl) {
        discountEl.innerHTML = `${englishToPersian(
          discount.toLocaleString("fa-IR"),
        )} ریال`;
      }

      if (payableEl) {
        payableEl.innerHTML = `${englishToPersian(
          grandTotal.toLocaleString("fa-IR"),
        )} ریال`;
      }
    }

    setPersianDate();
    recalc();

    const editableCells = Array.from(
      document.querySelectorAll<HTMLTableCellElement>(
        ".invoice-container tbody td:nth-child(3), .invoice-container tbody td:nth-child(6)",
      ),
    );

    editableCells.forEach((cell) => {
      cell.setAttribute("contenteditable", "true");
      cell.addEventListener("input", recalc);
    });

    return () => {
      editableCells.forEach((cell) => {
        cell.removeEventListener("input", recalc);
      });
    };
  }, [invoice.items, invoice.summary]);

  return (
    <section className="page" lang="fa" dir="rtl">
      <div className="invoice-container">
        <Header invoice={invoice} />
        <ItemsTable items={invoice.items} editable />
        <div className="bottom-section">
          <div
            className="signiture-section"
            style={{ position: "absolute", right: "600px", top: "700px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img style={{ width: "200px" }} src="/images/signature.png" alt="signature" />
          </div>
          <Summary totals={totals} />
        </div>
        <Footer invoice={invoice} />
      </div>
    </section>
  );
}
