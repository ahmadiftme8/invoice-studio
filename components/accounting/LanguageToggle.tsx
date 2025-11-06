'use client';

import { useTranslations } from "next-intl";
import { useAccountingStore } from "@/lib/accounting-store";

type SupportedLanguage = "fa" | "en";

const LANGUAGES: SupportedLanguage[] = ["fa", "en"];

export function LanguageToggle() {
  const t = useTranslations("dashboard.toggles");
  const language = useAccountingStore((state) => state.settings.language ?? "fa");
  const updateSettings = useAccountingStore((state) => state.updateSettings);

  const labels: Record<SupportedLanguage, string> = {
    fa: t("languageFa"),
    en: t("languageEn"),
  };

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white/80">
      {LANGUAGES.map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => updateSettings({ language: lang })}
            className={`px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {labels[lang]}
          </button>
        );
      })}
    </div>
  );
}
