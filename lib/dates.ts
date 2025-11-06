import { englishToPersian } from "./format";

export function getPersianToday(): string {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return englishToPersian(formatter.format(new Date()));
}

export function generateInvoiceNumber(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const compact = formatter.format(date).replace(/\D/g, "");
  return `${englishToPersian(compact)}-1`;
}
