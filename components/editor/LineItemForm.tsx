'use client';

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { computeLineItemTotalRial } from "@/lib/calc";
import {
  LineItem,
  LineItemSchema,
  Service,
  lineItemValidatorForService,
} from "@/lib/schema";
import { displayRial } from "@/lib/format";
import { useInvoiceStore } from "@/lib/store";

type LineItemFormProps = {
  services?: Service[];
  initialValues?: Partial<LineItem>;
  submitLabel?: string;
  onSave: (item: LineItem) => void;
  onCancel?: () => void;
};

type TotalsState = {
  total: number;
  valid: boolean;
};

function createLineItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `line-${crypto.randomUUID()}`;
  }

  return `line-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDefaultValues(
  initialValues: Partial<LineItem> | undefined,
  fallbackService: Service | undefined,
): any {
  const initialServiceId = initialValues?.serviceId ?? fallbackService?.id ?? "";
  const pricingModel =
    initialValues?.pricingModel ??
    fallbackService?.pricingModel ??
    ("fixed" as LineItem["pricingModel"]);

  const base = {
    id: initialValues?.id ?? createLineItemId(),
    serviceId: initialServiceId,
    qty: initialValues?.qty ?? 1,
    drafts: initialValues?.drafts ?? 0,
    edits: initialValues?.edits ?? 0,
    titleOverride: initialValues?.titleOverride,
    unitPriceOverrideRial: initialValues?.unitPriceOverrideRial,
    notes: initialValues?.notes,
  };

  switch (pricingModel) {
    case "hourly":
      return {
        ...base,
        pricingModel: "hourly",
        hours: initialValues?.hours ?? 1,
      } as Partial<LineItem>;
    case "per_page":
      return {
        ...base,
        pricingModel: "per_page",
        pages: initialValues?.pages ?? 1,
      } as Partial<LineItem>;
    case "per_item":
      return {
        ...base,
        pricingModel: "per_item",
        items: initialValues?.items ?? 1,
      } as Partial<LineItem>;
    case "tiered":
      return {
        ...base,
        pricingModel: "tiered",
        qty: initialValues?.qty ?? 1,
      } as Partial<LineItem>;
    case "fixed":
      return {
        ...base,
        pricingModel: "fixed",
        qty: 1,
      } as Partial<LineItem>;
    default:
      return base as Partial<LineItem>;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-500 dark:text-red-400">{message}</p>;
}

function TierPreview({ service }: { service: Service }) {
  if (service.pricingModel !== "tiered" || !service.tiers?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4 text-sm text-zinc-600 dark:text-zinc-400">
      <p className="mb-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Tier ranges</p>
      <div className="space-y-2">
        {service.tiers.map((tier) => (
          <div
            key={`${tier.from}-${tier.to ?? "plus"}`}
            className="flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300"
          >
            <span>
              {tier.from}–{tier.to ?? "∞"} {service.unitLabel ?? ""}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {displayRial(tier.unitPriceRial)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineItemForm({
  services: servicesProp,
  initialValues,
  submitLabel = "Save to invoice",
  onSave,
  onCancel,
}: LineItemFormProps) {
  const transformNumber = (value: unknown) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const normalizeText = (value: unknown) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const catalog = useInvoiceStore((state) => state.services);
  const services = servicesProp ?? catalog;
  const primaryService =
    services.find((service) => service.id === initialValues?.serviceId) ?? services[0];

  const form = useForm<LineItem>({
    resolver: zodResolver(LineItemSchema),
    mode: "onChange",
    defaultValues: buildDefaultValues(initialValues, primaryService) as any,
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = form;

  const idField = register("id");
  const pricingModelField = register("pricingModel");
  const qtyField = register("qty", { setValueAs: transformNumber });

  const watchValues = useWatch<LineItem>({ control });
  const selectedService = useMemo(
    () => services.find((service) => service.id === watchValues.serviceId),
    [services, watchValues.serviceId],
  );

  useEffect(() => {
    if (!selectedService && services.length > 0) {
      const fallback = services[0];
      setValue("serviceId", fallback.id);
      setValue("pricingModel", fallback.pricingModel);
    }
  }, [selectedService, services, setValue]);

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    setValue("pricingModel", selectedService.pricingModel);

    switch (selectedService.pricingModel) {
      case "fixed":
        setValue("qty", 1);
        setValue("hours", undefined);
        setValue("pages", undefined);
        setValue("items", undefined);
        break;
      case "hourly":
        setValue("qty", 1);
        setValue("hours", getValues("hours") ?? 1);
        setValue("pages", undefined);
        setValue("items", undefined);
        break;
      case "per_page":
        setValue("qty", 1);
        setValue("pages", getValues("pages") ?? 1);
        setValue("hours", undefined);
        setValue("items", undefined);
        break;
      case "per_item":
        setValue("qty", 1);
        setValue("items", getValues("items") ?? 1);
        setValue("hours", undefined);
        setValue("pages", undefined);
        break;
      case "tiered":
        setValue("qty", getValues("qty") ?? 1);
        setValue("hours", undefined);
        setValue("pages", undefined);
        setValue("items", undefined);
        break;
      default:
        break;
    }
  }, [selectedService, setValue, getValues]);

  const totals = useMemo<TotalsState>(() => {
    if (!selectedService) {
      return { total: 0, valid: false };
    }

    const candidate = {
      ...watchValues,
      pricingModel: selectedService.pricingModel,
    };

    const parseResult = lineItemValidatorForService(selectedService).safeParse(candidate);

    if (!parseResult.success) {
      return { total: 0, valid: false };
    }

    try {
      const total = computeLineItemTotalRial(selectedService, parseResult.data);
      return { total, valid: true };
    } catch {
      return { total: 0, valid: false };
    }
  }, [selectedService, watchValues]);

  const onSubmit = (data: LineItem) => {
    if (!selectedService) {
      return;
    }

    onSave({
      ...data,
      pricingModel: selectedService.pricingModel,
    });
  };

  const numericInputClass =
    "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-500";

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Add a service to the catalog before creating line items.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <input type="hidden" {...idField} />
      <input type="hidden" {...pricingModelField} />
      {selectedService?.pricingModel !== "tiered" ? (
        <input type="hidden" {...qtyField} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 text-right">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="line-service">
            Service
          </label>
          <select
            id="line-service"
            {...register("serviceId")}
            className="h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
          <FieldError message={errors.serviceId?.message} />
        </div>
        <div className="flex flex-col gap-2 text-right">
          <label className="text-xs font-medium text-zinc-500" htmlFor="line-title">
            Custom title
          </label>
          <input
            id="line-title"
            placeholder="Override service title"
            className="h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
            {...register("titleOverride", { setValueAs: normalizeText })}
          />
          <FieldError message={errors.titleOverride?.message} />
        </div>
      </div>

      {selectedService?.description ? (
        <p className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
          {selectedService.description}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {selectedService?.pricingModel === "tiered" ? (
          <div className="flex flex-col gap-2 text-right">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="line-qty">
              Quantity ({selectedService.unitLabel ?? "units"})
            </label>
            <input
              id="line-qty"
              type="number"
              min={1}
              step={1}
              className={numericInputClass}
              {...qtyField}
            />
            <FieldError message={errors.qty?.message} />
          </div>
        ) : selectedService?.pricingModel === "fixed" ? null : (
          <div className="flex flex-col gap-2 text-right">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {selectedService?.pricingModel === "hourly"
                ? "Hours"
                : selectedService?.pricingModel === "per_page"
                  ? "Pages"
                  : selectedService?.pricingModel === "per_item"
                    ? "Items"
                    : "Units"}
            </label>
            {selectedService?.pricingModel === "hourly" ? (
              <input
                type="number"
                min={0.25}
                step={0.25}
                className={numericInputClass}
                {...register("hours", { setValueAs: transformNumber })}
              />
            ) : null}
            {selectedService?.pricingModel === "per_page" ? (
              <input
                type="number"
                min={1}
                step={1}
                className={numericInputClass}
                {...register("pages", { setValueAs: transformNumber })}
              />
            ) : null}
            {selectedService?.pricingModel === "per_item" ? (
              <input
                type="number"
                min={1}
                step={1}
                className={numericInputClass}
                {...register("items", { setValueAs: transformNumber })}
              />
            ) : null}
            <FieldError
              message={
                errors.hours?.message ??
                errors.pages?.message ??
                errors.items?.message
              }
            />
          </div>
        )}

        <div className="flex flex-col gap-2 text-right">
          <label className="text-xs font-medium text-zinc-500" htmlFor="line-price-override">
            Unit price override (rial)
          </label>
          <input
            id="line-price-override"
            type="number"
            min={0}
            className={numericInputClass}
            {...register("unitPriceOverrideRial", { setValueAs: transformNumber })}
          />
          <FieldError message={errors.unitPriceOverrideRial?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 text-right">
          <label className="text-xs font-medium text-zinc-500" htmlFor="line-drafts">
            Draft rounds
          </label>
          <input
            id="line-drafts"
            type="number"
            min={0}
            step={1}
            className={numericInputClass}
            {...register("drafts", { setValueAs: transformNumber })}
          />
          <FieldError message={errors.drafts?.message} />
        </div>
        <div className="flex flex-col gap-2 text-right">
          <label className="text-xs font-medium text-zinc-500" htmlFor="line-edits">
            Final edits
          </label>
          <input
            id="line-edits"
            type="number"
            min={0}
            step={1}
            className={numericInputClass}
            {...register("edits", { setValueAs: transformNumber })}
          />
          <FieldError message={errors.edits?.message} />
        </div>
        {selectedService?.pricingModel === "fixed" ? (
          <div className="flex flex-col gap-2 text-right">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quantity</label>
            <input value={1} readOnly className={`${numericInputClass} bg-zinc-100`} />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Fixed services bill as a single unit.</p>
          </div>
        ) : null}
      </div>

      {selectedService?.pricingModel === "tiered" ? <TierPreview service={selectedService} /> : null}

      <div className="flex flex-col gap-2 text-right">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="line-notes">
          Notes (optional)
        </label>
        <textarea
          id="line-notes"
          rows={3}
          className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 outline-none transition focus:border-zinc-500 dark:focus:border-zinc-600"
          placeholder="Add delivery notes or clarifications…"
          {...register("notes", { setValueAs: normalizeText })}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4">
        <div className="text-right">
          <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Line total</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedService ? displayRial(totals.total) : "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!totals.valid || !isValid || isSubmitting}
            className="h-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 text-sm font-medium text-white dark:text-zinc-900 transition hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
