type ParseBoundedIntegerOptions = {
  fallback: number;
  min: number;
  max: number;
};

export function parseBoundedInteger(
  value: string | null,
  options: ParseBoundedIntegerOptions
) {
  const parsed = Number(value ?? String(options.fallback));
  if (!Number.isFinite(parsed)) {
    return options.fallback;
  }

  return Math.min(
    Math.max(Math.floor(parsed), options.min),
    options.max
  );
}
