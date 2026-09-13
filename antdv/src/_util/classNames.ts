function flattenClass(value: unknown): string[] {
  if (!value) {
    return []
  }
  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean)
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenClass)
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, on]) => Boolean(on))
      .map(([name]) => name)
  }
  return []
}

export function classNames(...values: unknown[]): string {
  return values.flatMap(flattenClass).join(' ')
}
