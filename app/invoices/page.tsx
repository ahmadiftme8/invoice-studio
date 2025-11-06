'use client';

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAccountingStore } from "@/lib/accounting-store";
import { calculateInvoiceTotals, createWorkLookup } from "@/lib/accounting-helpers";

export default function InvoicesPage() {
  const t = useTranslations("invoices.list");
  const columns = useTranslations("invoices.list.columns");
  const status = useTranslations("common.status");
  const editor = useTranslations("invoices.editor");

  const invoices = useAccountingStore((state) => state.invoices);
  const clients = useAccountingStore((state) => state.clients);
  const works = useAccountingStore((state) => state.works);
  const settings = useAccountingStore((state) => state.settings);

  const locale = settings.language === "en" ? "en-US" : "fa-IR";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const workLookup = useMemo(() => createWorkLookup(works), [works]);

  const enrichedInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((invoice) => {
          const client = clients.find((item) => item.id === invoice.clientId);
          const totals = calculateInvoiceTotals(invoice, workLookup);
          return {
            ...invoice,
            payable: totals.payable,
            clientName: client?.name ?? "-",
          };
        }),
    [clients, invoices, workLookup],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-right">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
            <p className="max-w-2xl text-sm text-zinc-600">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/invoices/new"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {editor("newTitle")}
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              {settings.language === "en" ? "Dashboard" : "داشبورد"}
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">{columns("number")}</h2>
          <span className="text-xs font-medium text-zinc-400">
            {numberFormatter.format(invoices.length)} {settings.language === "en" ? "records" : "فاکتور"}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-right text-sm">
            <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-3 py-2">{columns("number")}</th>
                <th className="px-3 py-2">{columns("client")}</th>
                <th className="px-3 py-2">{columns("total")}</th>
                <th className="px-3 py-2">{columns("type")}</th>
                <th className="px-3 py-2">{columns("date")}</th>
                <th className="px-3 py-2">{columns("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {enrichedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                enrichedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-3 text-sm font-medium text-zinc-900">{invoice.number}</td>
                    <td className="px-3 py-3 text-sm text-zinc-700">{invoice.clientName}</td>
                    <td className="px-3 py-3 text-sm text-emerald-600">
                      {numberFormatter.format(invoice.payable)} {invoice.currency}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">
                      {invoice.type === "final" ? status("final") : status("draft")}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{invoice.dateJalali}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
                        >
                          {settings.language === "en" ? "Details" : "جزئیات"}
                        </Link>
                        <Link
                          href={`/i/${invoice.id}`}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
                        >
                          {settings.language === "en" ? "Share link" : "اشتراک"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
