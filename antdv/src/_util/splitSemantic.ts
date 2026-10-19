export function splitSemantic<TValue, const TParts extends readonly string[]>(
  map: Record<string, TValue> | undefined | null,
  parts: TParts,
  defaultPart?: TParts[number],
): Partial<Record<TParts[number], Record<string, TValue>>> {
  const result: Partial<Record<TParts[number], Record<string, TValue>>> = {}
  if (!map) {
    return result
  }
  const fallback = defaultPart ?? ((parts[0] ?? '') as TParts[number])
  for (const [rawKey, value] of Object.entries(map)) {
    const dot = rawKey.indexOf('.')
    const head = dot > 0 ? rawKey.slice(0, dot) : ''
    const matched = head !== '' && (parts as readonly string[]).includes(head)
    const part = (matched ? head : fallback) as TParts[number]
    const bucket = (result[part] ??= {})
    bucket[matched ? rawKey.slice(dot + 1) : rawKey] = value
  }
  return result
}
