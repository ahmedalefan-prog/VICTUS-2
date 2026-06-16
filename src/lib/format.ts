// VICTUS — formatting helpers (Iraqi Dinar + Gregorian calendar, Arabic locale)

const IQD = new Intl.NumberFormat("ar-IQ", {
  style: "currency",
  currency: "IQD",
  maximumFractionDigits: 0,
});

// Format a number as Iraqi Dinar (IQD), Gregorian/Arabic locale.
export function formatIQD(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return IQD.format(n);
}

// Gregorian date only — the platform never uses the Hijri calendar.
const DATE_FMT = new Intl.DateTimeFormat("ar-IQ-u-ca-gregory", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("ar-IQ-u-ca-gregory", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE_FMT.format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return DATETIME_FMT.format(d);
}
