'use client';

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { PricingModel, Service } from "@/lib/schema";
import { useInvoiceStore } from "@/lib/store";
import { displayRial } from "@/lib/format";

type TierDraft = {
  id: string;
  from: string;
  to: string;
  unitPriceRial: string;
};

type ServiceFormDraft = {
  title: string;
  description: string;
  pricingModel: PricingModel;
  basePriceRial: string;
  draftPriceRial: string;
  editPriceRial: string;
  hourlyRateRial: string;
  unitLabel: string;
  tiers: TierDraft[];
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

const PRICING_LABELS: Record<PricingModel, string> = {
  fixed: "Fixed fee",
  hourly: "Hourly",
  per_page: "Per page",
  per_item: "Per item",
  tiered: "Tiered",
};

function createTierId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tier-${crypto.randomUUID()}`;
  }

  return `tier-${Math.random().toString(36).slice(2, 10)}`;
}

function createTierDraft(): TierDraft {
  return {
    id: createTierId(),
    from: "1",
    to: "",
    unitPriceRial: "",
  };
}

function emptyDraft(): ServiceFormDraft {
  return {
    title: "",
    description: "",
    pricingModel: "fixed",
    basePriceRial: "",
    draftPriceRial: "",
    editPriceRial: "",
    hourlyRateRial: "",
    unitLabel: "",
    tiers: [createTierDraft()],
  };
}

function serviceToDraft(service?: Service): ServiceFormDraft {
  if (!service) {
    return emptyDraft();
  }

  return {
    title: service.title,
    description: service.description ?? "",
    pricingModel: service.pricingModel,
    basePriceRial: service.basePriceRial.toString(),
    draftPriceRial: service.draftPriceRial?.toString() ?? "",
    editPriceRial: service.editPriceRial?.toString() ?? "",
    hourlyRateRial: service.hourlyRateRial?.toString() ?? "",
    unitLabel: service.unitLabel ?? "",
    tiers:
      service.pricingModel === "tiered"
        ? (service.tiers ?? []).map((tier) => ({
            id: createTierId(),
            from: tier.from.toString(),
            to: tier.to?.toString() ?? "",
            unitPriceRial: tier.unitPriceRial.toString(),
          }))
        : [createTierDraft()],
  };
}

function parseMoney(value: string, fallback = 0): number {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const numeric = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.round(numeric);
}

function parseOptionalMoney(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numeric = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  return Math.round(numeric);
}

function draftToServiceInput(draft: ServiceFormDraft): Omit<Service, "id"> {
  const tiers =
    draft.pricingModel === "tiered"
      ? draft.tiers
          .map((tier) => ({
            from: parseMoney(tier.from, 1),
            to: tier.to.trim() ? parseMoney(tier.to) : undefined,
            unitPriceRial: parseMoney(tier.unitPriceRial),
          }))
          .filter((tier) => Number.isFinite(tier.unitPriceRial))
      : undefined;

  return {
    title: draft.title.trim(),
    description: draft.description.trim() ? draft.description.trim() : undefined,
    pricingModel: draft.pricingModel,
    basePriceRial: parseMoney(draft.basePriceRial),
    draftPriceRial: parseOptionalMoney(draft.draftPriceRial),
    editPriceRial: parseOptionalMoney(draft.editPriceRial),
    hourlyRateRial:
      draft.pricingModel === "hourly" ? parseMoney(draft.hourlyRateRial) : undefined,
    unitLabel: draft.unitLabel.trim() ? draft.unitLabel.trim() : undefined,
    ...(draft.pricingModel === "tiered" ? { tiers } : {}),
  };
}

export default function ServicesPage() {
  const services = useInvoiceStore((state) => state.services);
  const addService = useInvoiceStore((state) => state.addService);
  const updateService = useInvoiceStore((state) => state.updateService);
  const deleteService = useInvoiceStore((state) => state.deleteService);

  const [draft, setDraft] = useState<ServiceFormDraft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.title.localeCompare(b.title)),
    [services],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    try {
      const payload = draftToServiceInput(draft);
      if (editingId) {
        updateService(editingId, payload);
        setAlert({ type: "success", message: "Service updated." });
      } else {
        addService(payload);
        setAlert({ type: "success", message: "Service added to catalog." });
      }
      setDraft(emptyDraft());
      setEditingId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save service.";
      setAlert({ type: "error", message });
    }
  };

  const handleEdit = (service: Service) => {
    setDraft(serviceToDraft(service));
    setEditingId(service.id);
    setAlert(null);
  };

  const handleDelete = (service: Service) => {
    const confirmed = window.confirm(
      `Delete ${service.title}? Preset line items using it will also be removed.`,
    );
    if (!confirmed) {
      return;
    }

    deleteService(service.id);
    if (editingId === service.id) {
      setDraft(emptyDraft());
      setEditingId(null);
    }
    setAlert({ type: "success", message: "Service deleted." });
  };

  const handleModelChange = (value: PricingModel) => {
    setDraft((previous) => ({
      ...previous,
      pricingModel: value,
      tiers:
        value === "tiered" && previous.tiers.length === 0
          ? [createTierDraft()]
          : previous.tiers,
    }));
  };

  const handleTierChange = (id: string, field: keyof TierDraft, value: string) => {
    setDraft((previous) => ({
      ...previous,
      tiers: previous.tiers.map((tier) =>
        tier.id === id
          ? {
              ...tier,
              [field]: value,
            }
          : tier,
      ),
    }));
  };

  const removeTier = (id: string) => {
    setDraft((previous) => {
      if (previous.tiers.length === 1) {
        return previous;
      }

      return {
        ...previous,
        tiers: previous.tiers.filter((tier) => tier.id !== id),
      };
    });
  };

  const addTier = () => {
    setDraft((previous) => ({
      ...previous,
      tiers: [...previous.tiers, createTierDraft()],
    }));
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 px-8 py-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-right">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Service catalog</h1>
            <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Define pricing models, revisions, and tiered rates once. They will be available
              everywhere in the invoice editor and preset builder.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/presets"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Manage presets
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between text-right">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingId ? "Edit service" : "Add new service"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(emptyDraft());
                  setEditingId(null);
                }}
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400 underline-offset-2 hover:underline"
              >
                Cancel editing
              </button>
            ) : null}
          </div>

          {alert ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                alert.type === "success"
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              }`}
            >
              {alert.message}
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-right">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Service name</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
              placeholder="e.g. App UI Design"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-right">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
              placeholder="Explain what is included to reuse it later…"
            />
          </label>

          <label className="flex flex-col gap-2 text-right">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pricing model</span>
            <select
              value={draft.pricingModel}
              onChange={(event) => handleModelChange(event.target.value as PricingModel)}
              className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
            >
              {Object.entries(PRICING_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-right">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Base price (rial)</span>
              <input
                type="number"
                min={0}
                value={draft.basePriceRial}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, basePriceRial: event.target.value }))
                }
                className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-right">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unit label</span>
              <input
                value={draft.unitLabel}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, unitLabel: event.target.value }))
                }
                className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                placeholder="project, page, hour…"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-right">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Draft round price</span>
              <input
                type="number"
                min={0}
                value={draft.draftPriceRial}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, draftPriceRial: event.target.value }))
                }
                className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
              />
            </label>
            <label className="flex flex-col gap-2 text-right">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Edit round price</span>
              <input
                type="number"
                min={0}
                value={draft.editPriceRial}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, editPriceRial: event.target.value }))
                }
                className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
              />
            </label>
            {draft.pricingModel === "hourly" ? (
              <label className="flex flex-col gap-2 text-right">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hourly rate (rial)</span>
                <input
                  type="number"
                  min={0}
                  value={draft.hourlyRateRial}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, hourlyRateRial: event.target.value }))
                  }
                  className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                  required
                />
              </label>
            ) : null}
          </div>

          {draft.pricingModel === "tiered" ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Tier ranges</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Configure quantity steps and per-unit rates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTier}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Add tier
                </button>
              </div>

              <div className="space-y-3">
                {draft.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="grid gap-3 rounded-2xl bg-white dark:bg-gray-800 p-4 text-right sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
                  >
                    <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      From
                      <input
                        type="number"
                        min={0}
                        value={tier.from}
                        onChange={(event) => handleTierChange(tier.id, "from", event.target.value)}
                        className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 px-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      To (leave blank for ∞)
                      <input
                        type="number"
                        min={0}
                        value={tier.to}
                        onChange={(event) => handleTierChange(tier.id, "to", event.target.value)}
                        className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 px-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Unit price (rial)
                      <input
                        type="number"
                        min={0}
                        value={tier.unitPriceRial}
                        onChange={(event) =>
                          handleTierChange(tier.id, "unitPriceRial", event.target.value)
                        }
                        className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 px-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
                      />
                    </label>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeTier(tier.id)}
                        disabled={draft.tiers.length <= 1}
                        className="rounded-xl border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 transition hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:border-zinc-200 dark:disabled:border-zinc-700 disabled:text-zinc-400 dark:disabled:text-zinc-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              {editingId ? "Update service" : "Save service"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Catalog</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tap any service to edit defaults.</p>
            </div>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {services.length} total
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedServices.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No services found. Add your first offering to get started.
              </p>
            ) : (
              sortedServices.map((service) => (
                <div key={service.id} className="flex flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{service.title}</p>
                      {service.description ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.description}</p>
                      ) : null}
                      {service.pricingModel === "tiered" && service.tiers ? (
                        <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {service.tiers.map((tier) => (
                            <div
                              key={`${tier.from}-${tier.to ?? "plus"}`}
                              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-right"
                            >
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {tier.from} – {tier.to ?? "∞"}
                              </span>
                              <span className="mr-2 text-zinc-500 dark:text-zinc-400">
                                {displayRial(tier.unitPriceRial)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end text-right text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {PRICING_LABELS[service.pricingModel]}
                      </span>
                      <span className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {displayRial(
                          service.pricingModel === "hourly"
                            ? service.hourlyRateRial ?? service.basePriceRial
                            : service.basePriceRial,
                        )}
                        <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {service.pricingModel === "hourly"
                            ? "per hour"
                            : service.unitLabel ?? "per unit"}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Draft {displayRial(service.draftPriceRial ?? 0)} · Edit{" "}
                        {displayRial(service.editPriceRial ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(service)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service)}
                      className="rounded-lg border border-red-200 dark:border-red-800 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 transition hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
