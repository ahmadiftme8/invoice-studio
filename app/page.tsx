'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAccountingStore } from "@/lib/accounting-store";
import { calculateInvoiceTotals, calculateRevenue, createWorkLookup } from "@/lib/accounting-helpers";
import { LanguageToggle } from "@/components/accounting/LanguageToggle";
import { ThemeToggle } from "@/components/accounting/ThemeToggle";
import { ClientQuickForm } from "@/components/accounting/ClientQuickForm";

function formatDate(value: string, locale: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("/");
  if (locale === "en") {
    return `${day ?? ""}/${month ?? ""}/${year ?? ""}`;
  }

  return value;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const listTranslations = useTranslations("invoices.list");
  const columns = useTranslations("invoices.list.columns");
  const status = useTranslations("common.status");

  const clients = useAccountingStore((state) => state.clients);
  const works = useAccountingStore((state) => state.works);
  const invoices = useAccountingStore((state) => state.invoices);
  const settings = useAccountingStore((state) => state.settings);

  const [showClientForm, setShowClientForm] = useState(false);

  const language = settings.language ?? "fa";
  const currency = settings.defaultCurrency ?? "IRR";
  const locale = language === "en" ? "en-US" : "fa-IR";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const revenue = useMemo(() => calculateRevenue(invoices, works), [invoices, works]);
  const summaryCards = [
    {
      label: t("cards.invoices"),
      value: numberFormatter.format(invoices.length),
    },
    {
      label: t("cards.clients"),
      value: numberFormatter.format(clients.length),
    },
    {
      label: t("cards.works"),
      value: numberFormatter.format(works.length),
    },
    {
      label: t("cards.revenue"),
      value: `${numberFormatter.format(revenue)} ${currency}`,
    },
  ];

  const workLookup = useMemo(() => createWorkLookup(works), [works]);
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((invoice) => {
        const client = clients.find((item) => item.id === invoice.clientId);
        const totals = calculateInvoiceTotals(invoice, workLookup);
        return {
          id: invoice.id,
          number: invoice.number,
          clientName: client?.name ?? "-",
          payable: totals.payable,
          type: invoice.type,
          date: invoice.dateJalali,
        };
      });
  }, [clients, invoices, workLookup]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-right">
            <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
            <p className="max-w-xl text-sm text-zinc-600">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-zinc-200 bg-white/80 p-5 text-right shadow-inner shadow-black/5"
            >
              <span className="text-xs font-medium text-zinc-500">{card.label}</span>
              <p className="mt-2 text-xl font-semibold text-zinc-900">{card.value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">{t("quickActions.title")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/invoices/new"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                {t("quickActions.newInvoice")}
              </Link>
              <Link
                href="/works"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {t("quickActions.addWork")}
              </Link>
              <button
                type="button"
                onClick={() => setShowClientForm((prev) => !prev)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {t("quickActions.addClient")}
              </button>
            </div>
          </div>

          {showClientForm ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5">
              <ClientQuickForm onCreated={() => setShowClientForm(false)} onClose={() => setShowClientForm(false)} />
            </div>
          ) : null}

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-sm text-zinc-600">
              {language === "en"
                ? "Keep your client list and work catalog updated to speed up invoicing."
                : "با ثبت مشتریان و خدمات، صدور فاکتورهای جدید سریع‌تر انجام می‌شود."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">{listTranslations("title")}</h2>
            <Link
              href="/invoices"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {columns("actions")}
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentInvoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                {listTranslations("empty")}
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 transition hover:border-zinc-400 hover:bg-white"
                >
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>{columns("number")}</span>
                    <span className="font-medium text-zinc-900">{invoice.number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>{columns("client")}</span>
                    <span className="font-medium text-zinc-900">{invoice.clientName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>{columns("total")}</span>
                    <span className="font-medium text-emerald-600">
                      {numberFormatter.format(invoice.payable)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{invoice.type === "final" ? status("final") : status("draft")}</span>
                    <span>{formatDate(invoice.date, language)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
