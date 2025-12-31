'use client';

import { ChangeEvent, useMemo, useState } from "react";
import {
  Discount,
  Invoice,
  LineItem,
  PricingModel,
  Service,
  Surcharges,
} from "@/lib/schema";
import { useInvoiceStore } from "@/lib/store";
import { computeInvoiceTotals, computeLineItemTotalRial } from "@/lib/calc";
import { displayRial, displayToman } from "@/lib/format";
import { LineItemForm } from "./LineItemForm";

type DiscountMode = "none" | "percent" | "fixed";

type SurchargeDraft = {
  rushPercent?: number;
  shippingRial?: number;
  otherRial?: number;
};

const PLACEHOLDER_CLIENT: Invoice["client"] = {
  id: "preview-client",
  name: "Draft Client",
};

const PRICING_LABELS: Record<PricingModel, string> = {
  fixed: "Fixed",
  hourly: "Hourly",
  per_page: "Per page",
  per_item: "Per item",
  tiered: "Tiered",
};

function formatUsage(line: LineItem): string {
  switch (line.pricingModel) {
    case "hourly":
      return `${line.hours ?? 0} hrs`;
    case "per_page":
      return `${line.pages ?? 0} pages`;
    case "per_item":
      return `${line.items ?? 0} items`;
    case "tiered":
      return `${line.qty} units`;
    case "fixed":
    default:
      return "Single delivery";
  }
}

function normalizeTax(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

function buildDiscount(mode: DiscountMode, value: number): Discount | undefined {
  if (mode === "none") {
    return undefined;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  if (mode === "percent") {
    return { type: "percent", value: normalizeTax(value) };
  }

  return { type: "fixed", value: normalizeMoney(value) };
}

function buildSurcharges(draft: SurchargeDraft): Surcharges | undefined {
  const rushPercent =
    draft.rushPercent && draft.rushPercent > 0
      ? normalizeTax(draft.rushPercent)
      : undefined;
  const shippingRial =
    draft.shippingRial && draft.shippingRial > 0 ? normalizeMoney(draft.shippingRial) : undefined;
  const otherRial =
    draft.otherRial && draft.otherRial > 0 ? normalizeMoney(draft.otherRial) : undefined;

  if (!rushPercent && !shippingRial && !otherRial) {
    return undefined;
  }

  return {
    ...(rushPercent ? { rushPercent } : {}),
    ...(shippingRial ? { shippingRial } : {}),
    ...(otherRial ? { otherRial } : {}),
  };
}

export function InvoiceEditor() {
  const services = useInvoiceStore((state) => state.services);
  const defaultTax = useInvoiceStore((state) => state.settings.defaultTaxPercent);

  const [items, setItems] = useState<LineItem[]>([]);
  const [taxPercent, setTaxPercent] = useState<number>(defaultTax ?? 9);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [surchargesDraft, setSurchargesDraft] = useState<SurchargeDraft>({});
  const [displayCurrency, setDisplayCurrency] = useState<"rial" | "toman">("rial");
  const [formResetKey, setFormResetKey] = useState(0);

  const serviceMap = useMemo(
    () => new Map<Service["id"], Service>(services.map((service) => [service.id, service])),
    [services],
  );

  const discount = useMemo(
    () => buildDiscount(discountMode, discountValue),
    [discountMode, discountValue],
  );

  const surcharges = useMemo(
    () => buildSurcharges(surchargesDraft),
    [surchargesDraft],
  );

  const invoiceForTotals = useMemo<Invoice>(
    () => ({
      id: "invoice-preview",
      type: "pre",
      number: "PREVIEW",
      dateJalali: "1403/01/01",
      client: PLACEHOLDER_CLIENT,
      items,
      taxPercent: normalizeTax(taxPercent),
      discount,
      surcharges,
      currency: "rial",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    }),
    [items, taxPercent, discount, surcharges],
  );

  const totals = useMemo(() => {
    if (items.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        discount: 0,
        surcharges: 0,
        payable: 0,
      };
    }

    return computeInvoiceTotals(invoiceForTotals, services);
  }, [invoiceForTotals, items.length, services]);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const service = serviceMap.get(item.serviceId);
        const total = service ? computeLineItemTotalRial(service, item) : 0;
        return { item, service, total };
      }),
    [items, serviceMap],
  );

  const formatAmount = (value: number) =>
    displayCurrency === "rial" ? displayRial(value) : displayToman(value);

  const handleAddItem = (line: LineItem) => {
    setItems((prev) => [...prev, line]);
    setFormResetKey((prev) => prev + 1);
  };

  const handleRemoveItem = (targetId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== targetId));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, removed);
      return copy;
    });
  };

  const onTaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const next = raw === "" ? 0 : Number(raw);
    setTaxPercent(normalizeTax(next));
  };

  const onDiscountValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const next = raw === "" ? 0 : Number(raw);
    setDiscountValue(next);
  };

  const setSurchargeField = (field: keyof SurchargeDraft) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const next = raw === "" ? undefined : Number(raw);
      setSurchargesDraft((prev) => ({
        ...prev,
        [field]: next,
      }));
    };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-right">
              <h2 className="text-lg font-semibold text-zinc-900">Invoice items</h2>
              <p className="text-xs text-zinc-500">
                Add services from your catalog and adjust revisions per line.
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {enrichedItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                Use the form on the right to add your first service line.
              </div>
            ) : (
              enrichedItems.map(({ item, service, total }, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 text-right">
                      <p className="text-sm font-semibold text-zinc-900">
                        {item.titleOverride ?? service?.title ?? "Untitled service"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {PRICING_LABELS[item.pricingModel]} · {formatUsage(item)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Drafts {item.drafts ?? 0} · Edits {item.edits ?? 0}
                      </p>
                      {item.notes ? (
                        <p className="text-xs text-zinc-500">
                          Notes: <span className="text-zinc-700">{item.notes}</span>
                        </p>
                      ) : null}
                      {!service ? (
                        <p className="text-xs text-red-500">Service no longer exists.</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase text-zinc-500">Line total</p>
                      <p className="text-lg font-semibold text-zinc-900">{formatAmount(total)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === enrichedItems.length - 1}
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-600 transition hover:border-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 text-right">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Adjustments</p>
                <p className="text-xs text-zinc-500">
                  Configure taxes, discounts, and optional surcharges.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-500">Tax percent</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={taxPercent}
                    onChange={onTaxChange}
                    className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-500">Discount</span>
                  <div className="flex gap-3">
                    <select
                      value={discountMode}
                      onChange={(event) => setDiscountMode(event.target.value as DiscountMode)}
                      className="h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                    >
                      <option value="none">None</option>
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed (rial)</option>
                    </select>
                    {discountMode !== "none" ? (
                      <input
                        type="number"
                        min={0}
                        value={discountValue}
                        onChange={onDiscountValueChange}
                        className="h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                      />
                    ) : null}
                  </div>
                </label>

                <div className="space-y-3">
                  <span className="text-xs font-medium text-zinc-500">Surcharges</span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Rush %"
                      value={surchargesDraft.rushPercent ?? ""}
                      onChange={setSurchargeField("rushPercent")}
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Shipping (rial)"
                      value={surchargesDraft.shippingRial ?? ""}
                      onChange={setSurchargeField("shippingRial")}
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Other (rial)"
                      value={surchargesDraft.otherRial ?? ""}
                      onChange={setSurchargeField("otherRial")}
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 text-right">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">Totals preview</p>
                <div className="flex gap-2 rounded-2xl bg-zinc-100 p-1 text-xs font-medium text-zinc-600">
                  <button
                    type="button"
                    onClick={() => setDisplayCurrency("rial")}
                    className={`rounded-xl px-3 py-1 transition ${
                      displayCurrency === "rial"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Rial
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayCurrency("toman")}
                    className={`rounded-xl px-3 py-1 transition ${
                      displayCurrency === "toman"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Toman
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-zinc-900">{formatAmount(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Tax ({normalizeTax(taxPercent)}%)</span>
                  <span className="font-medium text-zinc-900">{formatAmount(totals.tax)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Discount</span>
                  <span className="font-medium text-emerald-600">
                    -{formatAmount(totals.discount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Surcharges</span>
                  <span className="font-medium text-zinc-900">{formatAmount(totals.surcharges)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-zinc-900">
                  <span>Payable</span>
                  <span>{formatAmount(totals.payable)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-right">
          <h2 className="text-lg font-semibold text-zinc-900">Add line item</h2>
          <p className="text-xs text-zinc-500">Pick a service and tailor the effort estimate.</p>
        </div>
        <LineItemForm key={formResetKey} services={services} onSave={handleAddItem} />
      </div>
    </div>
  );
}
