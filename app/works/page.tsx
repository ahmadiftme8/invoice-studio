'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { WorkRecord, useAccountingStore } from "@/lib/accounting-store";
import { WorkForm } from "@/components/works/WorkForm";

function formatDateTime(value: string, locale: string) {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(time);
}

export default function WorksPage() {
  const t = useTranslations("works");
  const actions = useTranslations("common.actions");
  const confirmations = useTranslations("common.confirmations");

  const works = useAccountingStore((state) => state.works);
  const deleteWork = useAccountingStore((state) => state.deleteWork);
  const language = useAccountingStore((state) => state.settings.language ?? "fa");

  const locale = language === "en" ? "en-US" : "fa-IR";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const [editing, setEditing] = useState<WorkRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sortedWorks = useMemo(
    () =>
      [...works].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [works],
  );

  const handleDelete = (work: WorkRecord) => {
    const confirmed = window.confirm(confirmations("deleteWork"));
    if (!confirmed) {
      return;
    }

    deleteWork(work.id);
    setMessage(t("messages.deleted"));
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-right">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
            <p className="max-w-2xl text-sm text-zinc-600">{t("subtitle")}</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            {language === "en" ? "Back to dashboard" : "بازگشت به داشبورد"}
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            {editing ? t("form.submitUpdate") : t("form.submitNew")}
          </h2>
          <WorkForm
            mode={editing ? "edit" : "create"}
            work={editing ?? undefined}
            onCancel={() => setEditing(null)}
            onSaved={(work) => {
              setEditing(null);
              setMessage(editing ? t("messages.updated") : t("messages.created"));
              return work;
            }}
          />
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">{t("title")}</h2>
            <span className="text-xs font-medium text-zinc-400">
              {numberFormatter.format(works.length)} {language === "en" ? "items" : "خدمت"}
            </span>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-right text-sm">
              <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-3 py-2">{t("table.work")}</th>
                  <th className="px-3 py-2">{t("table.basePrice")}</th>
                  <th className="px-3 py-2">{t("table.draftPrice")}</th>
                  <th className="px-3 py-2">{t("table.editPrice")}</th>
                  <th className="px-3 py-2">{t("table.createdAt")}</th>
                  <th className="px-3 py-2">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedWorks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  sortedWorks.map((work) => (
                    <tr key={work.id} className="align-middle">
                      <td className="px-3 py-3 text-sm font-medium text-zinc-900">{work.title}</td>
                      <td className="px-3 py-3 text-sm text-zinc-700">
                        {numberFormatter.format(work.basePrice)}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700">
                        {numberFormatter.format(work.draftPrice)}
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-700">
                        {numberFormatter.format(work.editPrice)}
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-500">
                        {formatDateTime(work.createdAt, locale)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(work)}
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
                          >
                            {actions("edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(work)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          >
                            {actions("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
