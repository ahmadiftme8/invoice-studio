'use client';

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { LineItem, Service } from "@/lib/schema";
import { useInvoiceStore } from "@/lib/store";
import { computeLineItemTotalRial } from "@/lib/calc";
import { displayRial } from "@/lib/format";
import { LineItemForm } from "@/components/editor/LineItemForm";

type PresetDraft = {
  title: string;
  description: string;
  items: LineItem[];
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

type LineEditorState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      item: LineItem;
    };

function emptyPresetDraft(): PresetDraft {
  return {
    title: "",
    description: "",
    items: [],
  };
}

function cloneLineItem(item: LineItem): LineItem {
  return { ...item };
}

function formatUsage(line: LineItem): string {
  switch (line.pricingModel) {
    case "hourly":
      return `${line.hours ?? 0} hours`;
    case "per_page":
      return `${line.pages ?? 0} pages`;
    case "per_item":
      return `${line.items ?? 0} items`;
    case "tiered":
      return `${line.qty} units`;
    default:
      return `${line.qty} unit${line.qty > 1 ? "s" : ""}`;
  }
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PresetsPage() {
  const services = useInvoiceStore((state) => state.services);
  const presets = useInvoiceStore((state) => state.presets);
  const addPreset = useInvoiceStore((state) => state.addPreset);
  const updatePreset = useInvoiceStore((state) => state.updatePreset);
  const deletePreset = useInvoiceStore((state) => state.deletePreset);

  const [draft, setDraft] = useState<PresetDraft>(() => emptyPresetDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [lineEditor, setLineEditor] = useState<LineEditorState | null>(null);
  const [lineFormKey, setLineFormKey] = useState(0);

  const serviceMap = useMemo(
    () => new Map<Service["id"], Service>(services.map((service) => [service.id, service])),
    [services],
  );

  const sortedPresets = useMemo(
    () =>
      [...presets].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [presets],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    if (!draft.title.trim()) {
      setAlert({ type: "error", message: "Preset title is required." });
      return;
    }

    if (draft.items.length === 0) {
      setAlert({ type: "error", message: "Add at least one line item blueprint." });
      return;
    }

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() ? draft.description.trim() : undefined,
      items: draft.items,
    };

    try {
      if (editingId) {
        updatePreset(editingId, payload);
        setAlert({ type: "success", message: "Preset updated." });
      } else {
        addPreset(payload);
        setAlert({ type: "success", message: "Preset created." });
      }

      setDraft(emptyPresetDraft());
      setEditingId(null);
      setLineEditor(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save preset.";
      setAlert({ type: "error", message });
    }
  };

  const handleEditPreset = (presetId: string) => {
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    setDraft({
      title: preset.title,
      description: preset.description ?? "",
      items: preset.items.map(cloneLineItem),
    });
    setEditingId(preset.id);
    setLineEditor(null);
    setAlert(null);
  };

  const handleDeletePreset = (presetId: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}" preset?`);
    if (!confirmed) {
      return;
    }

    deletePreset(presetId);
    if (editingId === presetId) {
      setDraft(emptyPresetDraft());
      setEditingId(null);
      setLineEditor(null);
    }
    setAlert({ type: "success", message: "Preset deleted." });
  };

  const handleLineSave = (line: LineItem) => {
    setDraft((previous) => {
      if (lineEditor && lineEditor.mode === "edit") {
        const targetId = lineEditor.item.id;
        return {
          ...previous,
          items: previous.items.map((item) => (item.id === targetId ? line : item)),
        };
      }

      return {
        ...previous,
        items: [...previous.items, line],
      };
    });
    setLineEditor(null);
  };

  const openLineEditor = (state: LineEditorState) => {
    if (services.length === 0) {
      setAlert({
        type: "error",
        message: "Add at least one service in the catalog before defining presets.",
      });
      return;
    }

    setLineEditor(state);
    setLineFormKey((key) => key + 1);
  };

  const removeLineItem = (lineId: string) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.filter((line) => line.id !== lineId),
    }));
  };

  const presetTotal = (items: LineItem[]) =>
    items.reduce((acc, item) => {
      const service = serviceMap.get(item.serviceId);
      if (!service) {
        return acc;
      }
      return acc + computeLineItemTotalRial(service, item);
    }, 0);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 px-8 py-10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-right">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Presets & packages</h1>
            <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Bundle frequently sold services into reusable blueprints. Apply them to any invoice to
              pre-fill line items and revision allowances.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/services"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Manage services
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

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between text-right">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {editingId ? "Edit preset" : "Create preset"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(emptyPresetDraft());
                  setEditingId(null);
                  setLineEditor(null);
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

          {services.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
              Add at least one service to the catalog before building presets.
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-right">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Preset title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="h-11 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
              placeholder="Restaurant starter kit"
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
              placeholder="Explain what's included for your team."
            />
          </label>

          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Line blueprints</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {draft.items.length} item(s) ·{" "}
                  {displayRial(presetTotal(draft.items))} estimated subtotal
                </p>
              </div>
              <button
                type="button"
                onClick={() => openLineEditor({ mode: "create" })}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
                disabled={services.length === 0}
              >
                Add line item
              </button>
            </div>

            {draft.items.length === 0 ? (
              <p className="rounded-2xl border border-dotted border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No line items yet. Add at least one service to save this preset.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.items.map((line) => {
                  const service = serviceMap.get(line.serviceId);
                  const total = service ? computeLineItemTotalRial(service, line) : 0;
                  return (
                    <div
                      key={line.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-800 p-4 text-right"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {service?.title ?? "Service unavailable"}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatUsage(line)}</p>
                          {(line.drafts ?? 0) > 0 || (line.edits ?? 0) > 0 ? (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              Drafts {line.drafts ?? 0} · Edits {line.edits ?? 0}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {service ? displayRial(total) : "Service missing"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openLineEditor({ mode: "edit", item: line })}
                          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Edit defaults
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLineItem(line.id)}
                          className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 transition hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lineEditor ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-800 p-4 shadow-inner">
              <LineItemForm
                key={lineFormKey}
                services={services}
                initialValues={lineEditor.mode === "edit" ? lineEditor.item : undefined}
                submitLabel={lineEditor.mode === "edit" ? "Update line" : "Add line"}
                onSave={handleLineSave}
                onCancel={() => setLineEditor(null)}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              {editingId ? "Update preset" : "Save preset"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Saved presets</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Apply them from the invoice editor.</p>
            </div>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {presets.length} saved
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedPresets.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No presets yet. Start by creating a package on the left.
              </p>
            ) : (
              sortedPresets.map((preset) => (
                <div key={preset.id} className="flex flex-col gap-3 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{preset.title}</p>
                      {preset.description ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{preset.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                      <p>{preset.items.length} items</p>
                      <p>Updated {formatTimestamp(preset.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {preset.items.slice(0, 4).map((line) => {
                      const service = serviceMap.get(line.serviceId);
                      return (
                        <span key={line.id} className="mr-2 inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1">
                          {service?.title ?? "Missing service"}
                        </span>
                      );
                    })}
                    {preset.items.length > 4 ? (
                      <span className="text-zinc-400 dark:text-zinc-500">+{preset.items.length - 4} more</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {displayRial(presetTotal(preset.items))}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPreset(preset.id)}
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset.id, preset.title)}
                        className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 transition hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
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
