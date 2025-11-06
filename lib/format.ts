const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const ENGLISH_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const ENGLISH_DIGIT_REGEX = /[0-9]/g;
const PERSIAN_DIGIT_REGEX = /[۰-۹٠-٩]/g;

const persianToEnglishMap: Record<string, string> = {};

PERSIAN_DIGITS.forEach((digit, index) => {
  persianToEnglishMap[digit] = ENGLISH_DIGITS[index];
});

ARABIC_DIGITS.forEach((digit, index) => {
  persianToEnglishMap[digit] = ENGLISH_DIGITS[index];
});

function toEnglishDigits(input: string): string {
  return input.replace(PERSIAN_DIGIT_REGEX, (char) => persianToEnglishMap[char] ?? char);
}

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) {
    return "";
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      return "";
    }

    return toPersianDigits(input.toString());
  }

  return input.replace(ENGLISH_DIGIT_REGEX, (digit) => {
    const index = digit.charCodeAt(0) - 48;
    return index >= 0 && index <= 9 ? PERSIAN_DIGITS[index] : digit;
  });
}

export function parsePersianNumber(input: string | number | null | undefined): number {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : 0;
  }

  if (!input) {
    return 0;
  }

  const normalizedDigits = toEnglishDigits(input)
    .replace(/\u200c/g, "")
    .replace(/[,٬\s]/g, "")
    .replace(/[٫]/g, ".");

  const parsed = Number(normalizedDigits);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function withCommas(value: number | string | null | undefined): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? parsePersianNumber(value)
        : 0;

  if (!Number.isFinite(numeric)) {
    return toPersianDigits("0");
  }

  const isNegative = numeric < 0;
  const absolute = Math.abs(numeric);
  const english = absolute.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 20,
  });

  const [integerPart, fractionalPart] = english.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted =
    (isNegative ? "-" : "") +
    groupedInteger +
    (fractionalPart && Number(fractionalPart) !== 0 ? `.${fractionalPart}` : "");

  return toPersianDigits(formatted);
}

export function displayRial(value: number | string | null | undefined): string {
  return `${withCommas(value)} ریال`;
}

export function displayToman(value: number | string | null | undefined): string {
  const numeric =
    typeof value === "number" ? value : parsePersianNumber(value);
  const toman = Math.trunc(numeric / 10);
  return `${withCommas(toman)} تومان`;
}

export function formatDateJalali(date: Date | number | string = new Date()): string {
  const candidate = date instanceof Date ? date : new Date(date);
  const target = Number.isNaN(candidate.getTime()) ? new Date() : candidate;

  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return toPersianDigits(formatter.format(target));
}

export function englishToPersian(input: string | number | null | undefined): string {
  return toPersianDigits(input);
}

export function persianToEnglish(input: string): string {
  return toEnglishDigits(input);
}

export function formatNumber(value: number | string): string {
  return withCommas(value);
}

export function formatCurrency(value: number | string, suffix = "ریال"): string {
  const formatted = withCommas(value);
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export function parseLocaleNumber(input: string | number | null | undefined): number {
  return parsePersianNumber(input);
}
