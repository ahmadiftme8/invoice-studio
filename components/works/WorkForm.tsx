'use client';

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WorkRecord, useAccountingStore } from "@/lib/accounting-store";
import { formatNumber, parseLocaleNumber } from "@/lib/format";

type WorkFormProps = {
  mode: "create" | "edit";
  work?: WorkRecord;
  onSaved?: (work: WorkRecord) => void;
  onCancel?: () => void;
};

type WorkFormState = {
  title: string;
  basePrice: string;
  draftPrice: string;
  editPrice: string;
};

const emptyState: WorkFormState = {
  title: "",
  basePrice: "",
  draftPrice: "",
  editPrice: "",
};

export function WorkForm({ mode, work, onSaved, onCancel }: WorkFormProps) {
  const t = useTranslations("works.form");
  const actions = useTranslations("common.actions");
  const addWork = useAccountingStore((state) => state.addWork);
  const updateWork = useAccountingStore((state) => state.updateWork);

  const [state, setState] = useState<WorkFormState>(emptyState);

  useEffect(() => {
    if (work && mode === "edit") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        title: work.title,
        basePrice: formatNumber(work.basePrice),
        draftPrice: formatNumber(work.draftPrice),
        editPrice: formatNumber(work.editPrice),
      });
    } else {
      setState(emptyState);
    }
  }, [mode, work]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!state.title.trim()) {
      return;
    }

    const payload = {
      title: state.title.trim(),
      basePrice: parseLocaleNumber(state.basePrice) || 0,
      draftPrice: parseLocaleNumber(state.draftPrice) || 0,
      editPrice: parseLocaleNumber(state.editPrice) || 0,
    };

    const result =
      mode === "edit" && work
        ? updateWork(work.id, payload)
        : addWork(payload);

    if (result) {
      onSaved?.(result);
      if (mode === "create") {
        setState(emptyState);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400" htmlFor="work-title">
          {t("title")}
        </label>
        <input
          id="work-title"
          required
          value={state.title}
          onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400" htmlFor="work-base-price">
            {t("basePrice")}
          </label>
          <input
            id="work-base-price"
            inputMode="numeric"
            value={state.basePrice}
            onChange={(event) => setState((prev) => ({ ...prev, basePrice: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400" htmlFor="work-draft-price">
            {t("draftPrice")}
          </label>
          <input
            id="work-draft-price"
            inputMode="numeric"
            value={state.draftPrice}
            onChange={(event) => setState((prev) => ({ ...prev, draftPrice: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400" htmlFor="work-edit-price">
            {t("editPrice")}
          </label>
          <input
            id="work-edit-price"
            inputMode="numeric"
            value={state.editPrice}
            onChange={(event) => setState((prev) => ({ ...prev, editPrice: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {actions("cancel")}
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {mode === "edit" ? t("submitUpdate") : t("submitNew")}
        </button>
      </div>
    </form>
  );
}
