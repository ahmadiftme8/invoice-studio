export function persianDigitsToEnglish(input: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return input.replace(/[۰-۹]/g, (digit) => {
    const index = persianDigits.indexOf(digit);
    return index === -1 ? digit : englishDigits[index];
  });
}

export function englishToPersian(input: string): string {
  const englishDigits = "0123456789";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return input.replace(/[0-9]/g, (digit) => {
    const index = englishDigits.indexOf(digit);
    return index === -1 ? digit : persianDigits[index];
  });
}

export function formatPersianNumber(value: number | string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return englishToPersian(value.toLocaleString("en-US"));
  }

  if (typeof value === "string") {
    const numeric = Number(value.replace(/,/g, ""));
    if (Number.isFinite(numeric)) {
      return englishToPersian(numeric.toLocaleString("en-US"));
    }

    return englishToPersian(value);
  }

  return "";
}

export function formatPersianCurrency(value: number | string): string {
  const formatted = formatPersianNumber(value);
  return formatted ? `${formatted} ریال` : "";
}
