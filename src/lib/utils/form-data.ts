export function formatSqlTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function parseNumberField(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseBooleanField(value: FormDataEntryValue | null): boolean | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
}

export function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse JSON field", error);
    return fallback;
  }
}

type ParseStringOptions = {
  trim?: boolean;
  emptyAsUndefined?: boolean;
};

export function parseStringField(
  value: FormDataEntryValue | null,
  options: ParseStringOptions = {},
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const { trim = true, emptyAsUndefined = true } = options;
  const processed = trim ? value.trim() : value;

  if (emptyAsUndefined && processed.length === 0) {
    return undefined;
  }

  return processed;
}

export function parseStringArrayField(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag)).filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated parsing below
  }

  return trimmed
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
