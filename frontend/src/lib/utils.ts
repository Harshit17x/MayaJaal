/**
 * Normalizes any confidence score (which may be 0.0-1.0 or 0.0-100.0 from calibrated face models)
 * into a standard 0.0 - 1.0 decimal range.
 */
export function normalizeConfidence(conf: number | null | undefined): number {
  if (conf == null || isNaN(conf)) return 0;
  if (conf > 1.0) return Math.min(1.0, conf / 100);
  return Math.max(0, Math.min(1.0, conf));
}

/**
 * Formats confidence into an intuitive percentage string, e.g. "98%" or "98.3%".
 * Safely handles both 0.0-1.0 (e.g. 0.983) and 0.0-100.0 (e.g. 98.3) without multiplying twice.
 */
export function formatConfidence(
  conf: number | null | undefined,
  includeDecimals: boolean = false
): string {
  if (conf == null || isNaN(conf)) return "0%";
  const pct = conf > 1.0 ? conf : conf * 100;
  const clamped = Math.min(99.9, Math.max(0, pct));
  if (includeDecimals) {
    return `${clamped.toFixed(1)}%`;
  }
  return `${Math.round(clamped)}%`;
}
