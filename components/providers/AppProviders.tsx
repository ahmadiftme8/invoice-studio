'use client';

import { ReactNode, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useAccountingStore } from "@/lib/accounting-store";
import faMessages from "@/lib/translations/fa";
import enMessages from "@/lib/translations/en";

const messagesMap = {
  fa: faMessages,
  en: enMessages,
};

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const language = useAccountingStore((state) => state.settings.language ?? "fa");
  const theme = useAccountingStore((state) => state.settings.theme ?? "light");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "en" ? "ltr" : "rtl";
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const html = document.documentElement;
    html.dataset.theme = theme;
    html.classList.toggle("theme-dark", theme === "dark");

    const palette =
      theme === "dark"
        ? { background: "#111827", foreground: "#f9fafb" }
        : { background: "#f4f4f5", foreground: "#18181b" };

    html.style.setProperty("--background", palette.background);
    html.style.setProperty("--foreground", palette.foreground);
  }, [theme]);

  const messages = messagesMap[language as "fa" | "en"] ?? faMessages;

  return (
    <NextIntlClientProvider locale={language} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
