import SystemSettings from "@/model/systemSettingsModel";

const FALLBACK_EXPIRY_DAYS = 30;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 3650;

function normalizeExpiryDays(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return FALLBACK_EXPIRY_DAYS;
  }

  return Math.min(Math.max(Math.floor(value), MIN_EXPIRY_DAYS), MAX_EXPIRY_DAYS);
}

export type ExpiryInputParseResult =
  | { kind: "not-provided" }
  | { kind: "clear" }
  | { kind: "valid"; date: Date }
  | { kind: "invalid"; error: string };

export function parseExpiryInput(value: unknown): ExpiryInputParseResult {
  if (value === undefined) {
    return { kind: "not-provided" };
  }

  if (value === null) {
    return { kind: "clear" };
  }

  if (typeof value !== "string") {
    return {
      kind: "invalid",
      error: "expiresAt must be a valid date string or null",
    };
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { kind: "clear" };
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return { kind: "invalid", error: "Invalid expiresAt date" };
  }

  return { kind: "valid", date: parsedDate };
}

export async function getDefaultUrlExpiryDate() {
  const settings = await SystemSettings.findOne().select("defaultUrlExpiryDays");
  const expiryDays = normalizeExpiryDays(settings?.defaultUrlExpiryDays);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return expiryDate;
}
