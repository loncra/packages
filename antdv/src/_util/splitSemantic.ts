/**
 * 语义样式 map 的**按部件拆分**。
 *
 * 用途：一个组件内嵌别的组件（卡片套表格、面板套列表、门面套表格……），而它们各自的
 * `classes` / `styles` 是**同一个 prop 名**（antd 所有组件的语义样式都叫这两个）——
 * 于是把"部件"写进键里分层：`部件.语义路径`（如 `table.header.cell`），
 * 不带前缀的键归 `defaultPart`。
 *
 * 本工具**不认识任何部件名**：部件表由调用方传（同一次调用里 `parts` 就是全部合法前缀）。
 *
 * ```ts
 * splitSemantic({body: 'p-0!', 'table.header.cell': 'font-bold!'}, ['card', 'table'], 'card')
 * // → {card: {body: 'p-0!'}, table: {'header.cell': 'font-bold!'}}
 * ```
 */
export function splitSemantic<TValue, const TParts extends readonly string[]>(
  map: Record<string, TValue> | undefined | null,
  parts: TParts,
  defaultPart?: TParts[number],
): Partial<Record<TParts[number], Record<string, TValue>>> {
  const result: Partial<Record<TParts[number], Record<string, TValue>>> = {}
  if (!map) {
    return result
  }
  // `parts` 是只读的空数组时取不到 `[0]`，兜个空串（那时 `parts` 里也没有任何合法前缀）
  const fallback = defaultPart ?? ((parts[0] ?? '') as TParts[number])
  for (const [rawKey, value] of Object.entries(map)) {
    const dot = rawKey.indexOf('.')
    const head = dot > 0 ? rawKey.slice(0, dot) : ''
    // 认不出的前缀不算部件：键原样留给默认部件（不认识它的组件自然忽略）
    const matched = head !== '' && (parts as readonly string[]).includes(head)
    const part = (matched ? head : fallback) as TParts[number]
    const bucket = (result[part] ??= {})
    bucket[matched ? rawKey.slice(dot + 1) : rawKey] = value
  }
  return result
}
