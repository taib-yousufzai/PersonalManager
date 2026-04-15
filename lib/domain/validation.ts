export function isPositiveAmount(value: unknown): boolean {
  return typeof value === 'number' && isFinite(value) && value > 0
}

export function isValidPercentage(value: unknown): boolean {
  return typeof value === 'number' && value >= 1 && value <= 100
}

export function isValidCategoryType(value: unknown): value is 'essential' | 'discretionary' {
  return value === 'essential' || value === 'discretionary'
}
