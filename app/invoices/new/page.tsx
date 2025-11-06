'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";

export default function NewInvoicePage() {
  const t = useTranslations("invoices.editor");
  const list = useTranslations("invoices.list");
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col gap-2 text-right">
          <h1 className="text-3xl font-semibold text-zinc-900">{t("newTitle")}</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            {t("client")} · {t("addWork")} · {t("totals")}
          </p>
        </div>
        <Link
          href="/invoices"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
        >
          {list("title")}
        </Link>
      </header>

      <InvoiceEditor
        mode="create"
        onSaved={(invoice) => {
          router.push(`/invoices/${invoice.id}`);
        }}
      />
    </div>
  );
}
