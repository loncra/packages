/**
 * 按 `a.b.c` 取嵌套值：列表列 key 与详情项 key 都允许写**路径**，数据不在顶层字段时用
 * （如 `data.details.requestDetails.remoteAddress`）。
 *
 * 顶层字段就是退化的单段路径 ⇒ 两种写法走同一条路，不需要额外的 prop 或 formatter。
 * 不支持 `a['b.c']`（段名里带点）：后端字段名里没有点，真出现了再说。
 *
 * 住 `_util/crud/`：列表（`crud-page/home/columns.ts`）与详情（`crud-page/detail/items.ts`）
 * 都要用它，放任何一侧都会让另一侧反向依赖。
 */
export function readPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      source,
    )
}
