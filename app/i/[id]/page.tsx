'use client';

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Preview } from "@/components/invoice/Preview";
import { buildInvoicePreviewDraft } from "@/lib/accounting-helpers";
import { useAccountingStore } from "@/lib/accounting-store";

type RouteParams = {
  id?: string | string[];
};

function resolveId(params: RouteParams): string | undefined {
  if (!params?.id) {
    return undefined;
  }

  if (Array.isArray(params.id)) {
    return params.id[0];
  }

  return params.id;
}

export default function SharedInvoicePage() {
  const params = useParams<RouteParams>();
  const invoiceId = resolveId(params);

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

  if (!invoiceId || !previewDraft) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {settings.language === "en" ? "Invoice unavailable" : "فاکتور در دسترس نیست"}
        </h1>
        <p className="text-sm text-zinc-500">
          {settings.language === "en"
            ? "Ask the sender to share the link again or refresh your browser."
            : "از ارسال‌کننده بخواهید لینک را مجدداً ارسال کند یا صفحه را به‌روزرسانی کنید."}
        </p>
        <Link
          href="/"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
        >
          {settings.language === "en" ? "Return to dashboard" : "بازگشت به داشبورد"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-zinc-100 px-4 py-10">
      <Preview initialInvoice={previewDraft} />
    </div>
  );
}
