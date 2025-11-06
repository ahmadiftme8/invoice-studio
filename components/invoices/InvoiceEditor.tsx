'use client';

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClientRecord, InvoiceRecord, InvoiceType, NewInvoiceItemInput, SettingsRecord, WorkRecord, useAccountingStore } from "@/lib/accounting-store";
import { ClientQuickForm } from "@/components/accounting/ClientQuickForm";
import { createWorkLookup } from "@/lib/accounting-helpers";
import { parseLocaleNumber } from "@/lib/format";

type InvoiceEditorProps = {
  mode: "create" | "edit";
  invoiceId?: string;
  onSaved?: (invoice: InvoiceRecord) => void;
  onConvert?: (invoice: InvoiceRecord) => void;
};

type InvoiceItemDraft = {
  id: string;
  workId: string;
  qty: number;
  drafts: number;
  edits: number;
  customDesc: string;
};

type InvoiceEditorState = {
  type: InvoiceType;
  clientId: string;
  dateJalali: string;
  taxRatePercent: number;
  discountRial: number;
  currency: string;
  items: InvoiceItemDraft[];
};

function createItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Math.random().toString(36).slice(2, 10)}`;
}

function initialStateFromInvoice(
  invoice: InvoiceRecord | undefined,
  settings: SettingsRecord,
): InvoiceEditorState {
  if (!invoice) {
    return {
      type: "pre",
      clientId: "",
      dateJalali: "",
      taxRatePercent: Math.round((settings.defaultTaxRate ?? 0) * 10000) / 100,
      discountRial: 0,
      currency: settings.defaultCurrency ?? "IRR",
      items: [],
    };
  }

  return {
    type: invoice.type,
    clientId: invoice.clientId,
    dateJalali: invoice.dateJalali,
    taxRatePercent: Math.round((invoice.taxRate ?? 0) * 10000) / 100,
    discountRial: invoice.discountRial ?? 0,
    currency: invoice.currency ?? settings.defaultCurrency ?? "IRR",
    items: invoice.items.map((item) => ({
      id: createItemId(),
      workId: item.workId,
      qty: item.qty ?? 1,
      drafts: item.drafts ?? 0,
      edits: item.edits ?? 0,
      customDesc: item.customDesc ?? "",
    })),
  };
}

function ensureNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function computeLineTotal(item: InvoiceItemDraft, work: WorkRecord | undefined) {
  if (!work) {
    return { unit: 0, total: 0 };
  }

  const base = ensureNonNegative(work.basePrice);
  const perDraft = ensureNonNegative(work.draftPrice);
  const perEdit = ensureNonNegative(work.editPrice);
  const qty = ensureNonNegative(item.qty || 1);
  const drafts = ensureNonNegative(item.drafts || 0);
  const edits = ensureNonNegative(item.edits || 0);

  const unitPrice = Math.round(base + drafts * perDraft + edits * perEdit);
  return {
    unit: unitPrice,
    total: Math.round(unitPrice * (qty || 1)),
  };
}

function buildNewInvoiceItems(items: InvoiceItemDraft[]): NewInvoiceItemInput[] {
  return items.map((item) => ({
    workId: item.workId,
    qty: ensureNonNegative(item.qty || 1),
    drafts: ensureNonNegative(item.drafts || 0),
    edits: ensureNonNegative(item.edits || 0),
    customDesc: item.customDesc.trim() ? item.customDesc.trim() : undefined,
  }));
}

export function InvoiceEditor({ mode, invoiceId, onConvert, onSaved }: InvoiceEditorProps) {
  const t = useTranslations("invoices.editor");
  const messages = useTranslations("invoices.messages");
  const actions = useTranslations("common.actions");
  const language = useAccountingStore((state) => state.settings.language ?? "fa");

  const clients = useAccountingStore((state) => state.clients);
  const works = useAccountingStore((state) => state.works);
  const invoices = useAccountingStore((state) => state.invoices);
  const settings = useAccountingStore((state) => state.settings);

  const addInvoice = useAccountingStore((state) => state.addInvoice);
  const updateInvoice = useAccountingStore((state) => state.updateInvoice);
  const convertInvoiceToFinal = useAccountingStore((state) => state.convertInvoiceToFinal);

  const targetInvoice =
    mode === "edit" && invoiceId
      ? invoices.find((invoice) => invoice.id === invoiceId)
      : undefined;

  const [state, setState] = useState<InvoiceEditorState>(() =>
    initialStateFromInvoice(targetInvoice, settings),
  );
  const [showClientForm, setShowClientForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefill form whenever the backing invoice changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(initialStateFromInvoice(targetInvoice, settings));
  }, [invoiceId, targetInvoice, settings]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const locale = language === "en" ? "en-US" : "fa-IR";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const workOptions = useMemo(() => {
    return [...works].sort((a, b) => a.title.localeCompare(b.title));
  }, [works]);

  const workLookup = useMemo(() => createWorkLookup(works), [works]);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => {
      const work = workLookup[item.workId];
      return sum + computeLineTotal(item, work).total;
    }, 0);

    const taxRate = ensureNonNegative(state.taxRatePercent) / 100;
    const tax = Math.round(subtotal * taxRate);
    const discount = Math.round(ensureNonNegative(state.discountRial));
    const payable = subtotal + tax - discount;

    return {
      subtotal,
      tax,
      discount,
      payable,
    };
  }, [state.items, state.taxRatePercent, state.discountRial, workLookup]);

  const formatAmount = (value: number) => numberFormatter.format(ensureNonNegative(value));

  if (mode === "edit" && invoiceId && !targetInvoice) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        {messages("updated")}
      </div>
    );
  }

  const handleInvoiceTypeChange = (nextType: InvoiceType) => {
    setState((prev) => ({ ...prev, type: nextType }));
  };

  const handleClientChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setState((prev) => ({ ...prev, clientId: value }));
  };

  const handleItemChange = <Field extends keyof InvoiceItemDraft>(
    id: string,
    field: Field,
    value: InvoiceItemDraft[Field],
  ) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleNumberChange =
    (id: string, field: keyof Pick<InvoiceItemDraft, "qty" | "drafts" | "edits">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const numeric = parseLocaleNumber(raw);
      handleItemChange(id, field, numeric);
    };

  const handleWorkSelection = (id: string) => (event: ChangeEvent<HTMLSelectElement>) => {
      handleItemChange(id, "workId", event.target.value);
    };

  const handleAddItem = () => {
    if (!workOptions.length) {
      return;
    }

    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: createItemId(),
          workId: workOptions[0].id,
          qty: 1,
          drafts: 0,
          edits: 0,
          customDesc: "",
        },
      ],
    }));
  };

  const handleRemoveItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleTaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      taxRatePercent: parseLocaleNumber(event.target.value),
    }));
  };

  const handleDiscountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      discountRial: parseLocaleNumber(event.target.value),
    }));
  };

  const handleCurrencyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      currency: event.target.value,
    }));
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      dateJalali: event.target.value,
    }));
  };

  const handleClientCreated = (client: ClientRecord) => {
    setShowClientForm(false);
    setState((prev) => ({ ...prev, clientId: client.id }));
  };

  const saveInvoice = (): InvoiceRecord | undefined => {
    if (!state.clientId) {
      setError(messages("validation.selectClient"));
      return undefined;
    }

    const normalizedItems = buildNewInvoiceItems(state.items).filter((item) => item.workId);

    if (!normalizedItems.length) {
      setError(messages("validation.addWork"));
      return undefined;
    }

    setError(null);

    const payload = {
      type: state.type,
      clientId: state.clientId,
      items: normalizedItems,
      taxRate: ensureNonNegative(state.taxRatePercent) / 100,
      discountRial: ensureNonNegative(state.discountRial),
      currency: state.currency || settings.defaultCurrency,
      dateJalali: state.dateJalali || undefined,
    };

    if (mode === "create") {
      const created = addInvoice(payload);
      return created;
    }

    if (mode === "edit" && invoiceId) {
      return updateInvoice(invoiceId, payload);
    }

    return undefined;
  };

  const handleSave = () => {
    const result = saveInvoice();

    if (!result) {
      return;
    }

    setFeedback(mode === "create" ? messages("saved") : messages("updated"));
    onSaved?.(result);
  };

  const handleConvert = () => {
    if (!invoiceId) {
      return;
    }

    const result = saveInvoice();
    if (!result) {
      return;
    }

    const converted = convertInvoiceToFinal(invoiceId);
    if (converted) {
      setFeedback(messages("converted"));
      onConvert?.(converted);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-right">
            <h1 className="text-2xl font-semibold text-zinc-900">
              {mode === "create" ? t("newTitle") : t("editTitle")}
            </h1>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="flex flex-col gap-3 text-right">
              <span className="text-xs font-medium text-zinc-500">{t("invoiceType")}</span>
              <div className="flex overflow-hidden rounded-xl border border-zinc-300">
                {(["pre", "final"] as InvoiceType[]).map((typeOption) => {
                  const active = state.type === typeOption;
                  return (
                    <button
                      type="button"
                      key={typeOption}
                      onClick={() => handleInvoiceTypeChange(typeOption)}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {typeOption === "pre" ? messages("status.draft") : messages("status.final")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 text-right">
              <label className="text-xs font-medium text-zinc-500" htmlFor="invoice-client">
                {t("client")}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="invoice-client"
                  value={state.clientId}
                  onChange={handleClientChange}
                  className="h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                >
                  <option value="">{messages("validation.selectClient")}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowClientForm((prev) => !prev)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                >
                  {t("addClient")}
                </button>
              </div>
              {showClientForm ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-700">{t("addClient")}</p>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <ClientQuickForm onCreated={handleClientCreated} onClose={() => setShowClientForm(false)} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 text-right">
              <label className="text-xs font-medium text-zinc-500" htmlFor="invoice-date">
                {t("issueDate")}
              </label>
              <input
                id="invoice-date"
                value={state.dateJalali}
                onChange={handleDateChange}
                placeholder="1404/01/01"
                className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-2 text-right">
              <label className="text-xs font-medium text-zinc-500" htmlFor="invoice-tax">
                {t("taxRate")}
              </label>
              <input
                id="invoice-tax"
                inputMode="decimal"
                value={state.taxRatePercent}
                onChange={handleTaxChange}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-2 text-right">
              <label className="text-xs font-medium text-zinc-500" htmlFor="invoice-discount">
                {t("discount")}
              </label>
              <input
                id="invoice-discount"
                inputMode="numeric"
                value={state.discountRial}
                onChange={handleDiscountChange}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900">{t("items")}</h2>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!workOptions.length}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {t("addWork")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-right text-sm">
              <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-3 py-2">{messages("itemRow.work")}</th>
                  <th className="px-3 py-2">{messages("itemRow.qty")}</th>
                  <th className="px-3 py-2">{messages("itemRow.drafts")}</th>
                  <th className="px-3 py-2">{messages("itemRow.edits")}</th>
                  <th className="px-3 py-2">{t("currency")}</th>
                  <th className="px-3 py-2">{messages("itemRow.total")}</th>
                  <th className="px-3 py-2">{actions("delete")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {state.items.map((item) => {
                  const work = workLookup[item.workId];
                  const { unit, total } = computeLineTotal(item, work);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <select
                            value={item.workId}
                            onChange={handleWorkSelection(item.id)}
                            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                          >
                            {workOptions.map((workOption) => (
                              <option key={workOption.id} value={workOption.id}>
                                {workOption.title}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder={work?.title ?? ""}
                            value={item.customDesc}
                            onChange={(event) =>
                              handleItemChange(item.id, "customDesc", event.target.value)
                            }
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 outline-none transition focus:border-zinc-400"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          inputMode="numeric"
                          value={item.qty}
                          onChange={handleNumberChange(item.id, "qty")}
                          className="w-20 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          inputMode="numeric"
                          value={item.drafts}
                          onChange={handleNumberChange(item.id, "drafts")}
                          className="w-20 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          inputMode="numeric"
                          value={item.edits}
                          onChange={handleNumberChange(item.id, "edits")}
                          className="w-20 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-zinc-700">
                        {formatAmount(unit)} {state.currency}
                      </td>
                      <td className="px-3 py-3 text-zinc-900">{formatAmount(total)}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-600 transition hover:border-red-300 hover:text-red-600"
                        >
                          {actions("delete")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 text-right">
            <h3 className="text-lg font-semibold text-zinc-900">{t("totals")}</h3>
            <div className="flex flex-col gap-3 text-sm text-zinc-700">
              <div className="flex items-center justify-between">
                <span>{t("currency")}</span>
                <span>
                  {formatAmount(totals.subtotal)} {state.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("taxRate")}</span>
                <span>{formatAmount(totals.tax)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("discount")}</span>
                <span>{formatAmount(totals.discount)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-zinc-900">
                <span>{messages("itemRow.total")}</span>
                <span>
                  {formatAmount(totals.payable)} {state.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 text-right">
            <label className="text-xs font-medium text-zinc-500" htmlFor="invoice-currency">
              {t("currency")}
            </label>
            <input
              id="invoice-currency"
              value={state.currency}
              onChange={handleCurrencyChange}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              {language === "en"
                ? "Typically IRR or IRT (Toman)."
                : "واحد پولی دلخواه را وارد کنید؛ مانند ریال یا تومان."}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pb-16">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          {mode === "create" ? t("saveDraft") : t("updateInvoice")}
        </button>
        {mode === "edit" && targetInvoice?.type === "pre" ? (
          <button
            type="button"
            onClick={handleConvert}
            className="rounded-xl border border-emerald-500 px-5 py-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50"
          >
            {t("convertToFinal")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
