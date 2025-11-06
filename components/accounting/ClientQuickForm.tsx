'use client';

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ClientRecord, useAccountingStore } from "@/lib/accounting-store";

type ClientQuickFormProps = {
  onCreated?: (client: ClientRecord) => void;
  onClose?: () => void;
};

export function ClientQuickForm({ onCreated, onClose }: ClientQuickFormProps) {
  const t = useTranslations("clients.quickForm");
  const actions = useTranslations("common.actions");
  const addClient = useAccountingStore((state) => state.addClient);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    instagram: "",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const client = addClient({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
    });

    if (onCreated) {
      onCreated(client);
    }

    setForm({ name: "", phone: "", instagram: "" });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-right">
        <label className="text-sm font-medium text-zinc-600" htmlFor="client-name">
          {t("name")}
        </label>
        <input
          id="client-name"
          name="name"
          required
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1 text-right">
        <label className="text-sm font-medium text-zinc-600" htmlFor="client-phone">
          {t("phone")}
        </label>
        <input
          id="client-phone"
          name="phone"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1 text-right">
        <label className="text-sm font-medium text-zinc-600" htmlFor="client-instagram">
          {t("instagram")}
        </label>
        <input
          id="client-instagram"
          name="instagram"
          value={form.instagram}
          onChange={(event) => setForm((prev) => ({ ...prev, instagram: event.target.value }))}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            {actions("cancel")}
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
