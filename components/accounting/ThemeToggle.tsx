'use client';

import { useTranslations } from "next-intl";
import { useAccountingStore } from "@/lib/accounting-store";

export function ThemeToggle() {
  const t = useTranslations("dashboard.toggles");
  const theme = useAccountingStore((state) => state.settings.theme ?? "light");
  const updateSettings = useAccountingStore((state) => state.updateSettings);

  const isDark = theme === "dark";

  const handleToggle = () => {
    updateSettings({ theme: isDark ? "light" : "dark" });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-gray-800/70 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {isDark ? t("themeLight") : t("themeDark")}
    </button>
  );
}
