'use client';

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useTranslations } from "next-intl";
import { Preview } from "@/components/invoice/Preview";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { buildInvoicePreviewDraft } from "@/lib/accounting-helpers";
import { useAccountingStore } from "@/lib/accounting-store";

type RouteParams = {
  id?: string | string[];
};

function resolveParamId(params: RouteParams): string | undefined {
  if (!params?.id) {
    return undefined;
  }

  if (Array.isArray(params.id)) {
    return params.id[0];
  }

  return params.id;
}

export default function InvoiceDetailsPage() {
  const params = useParams<RouteParams>();
  const invoiceId = resolveParamId(params);
  const router = useRouter();

  const t = useTranslations("invoices.editor");
  const list = useTranslations("invoices.list");
  const actions = useTranslations("common.actions");
  const status = useTranslations("common.status");

  const invoices = useAccountingStore((state) => state.invoices);
  const clients = useAccountingStore((state) => state.clients);
  const works = useAccountingStore((state) => state.works);
  const settings = useAccountingStore((state) => state.settings);

  const invoiceRecord = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceId),
    [invoices, invoiceId],
  );

  const client = useMemo(
    () => clients.find((candidate) => candidate.id === invoiceRecord?.clientId),
    [clients, invoiceRecord],
  );

  const previewDraft = useMemo(() => {
    if (!invoiceRecord) {
      return undefined;
    }

    return buildInvoicePreviewDraft(invoiceRecord, client, works);
  }, [invoiceRecord, client, works]);

  const previewRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: invoiceRecord ? invoiceRecord.number : "invoice-preview",
  });

  if (!invoiceId || !invoiceRecord) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {settings.language === "en" ? "Invoice not found" : "فاکتور پیدا نشد"}
        </h1>
        <p className="text-sm text-zinc-600">
          {settings.language === "en"
            ? "The invoice you are looking for does not exist. Create a new invoice instead."
            : "فاکتور موردنظر موجود نیست. می‌توانید فاکتور جدیدی بسازید."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/invoices/new"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {t("newTitle")}
          </Link>
          <Link
            href="/invoices"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            {list("title")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col gap-2 text-right">
          <h1 className="text-3xl font-semibold text-zinc-900">{invoiceRecord.number}</h1>
          <p className="text-sm text-zinc-500">
            {client ? client.name : list("subtitle")} ·{" "}
            {invoiceRecord.type === "final" ? status("final") : status("draft")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/invoices"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            {list("title")}
          </Link>
          <Link
            href={`/i/${invoiceRecord.id}`}
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            {settings.language === "en" ? "Public link" : "لینک عمومی"}
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <InvoiceEditor
          mode="edit"
          invoiceId={invoiceRecord.id}
          onConvert={(newInvoice) => router.push(`/invoices/${newInvoice.id}`)}
        />

        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">{list("title")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                {actions("export")}
              </button>
              <Link
                href={`/i/${invoiceRecord.id}`}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {settings.language === "en" ? "Preview link" : "پیش‌نمایش"}
              </Link>
            </div>
          </div>

          <div ref={previewRef} className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            {previewDraft ? (
              <Preview initialInvoice={previewDraft} />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-zinc-500">
                {settings.language === "en" ? "Preview will appear after saving." : "پس از ذخیره، پیش‌نمایش نمایش داده می‌شود."}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
