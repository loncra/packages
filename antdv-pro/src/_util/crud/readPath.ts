/**
 * 按 `a.b.c` **读 / 写**嵌套值：列表列 key、详情项 key、表单字段 key 都允许写**路径**
 * （数据不在顶层字段时用，如 `data.details.requestDetails.remoteAddress`）。
 *
 * 顶层字段就是退化的单段路径 ⇒ 两种写法走同一条路，不需要额外的 prop 或 formatter；
 * **读与写共用同一个 `walk`**（路径语义只有这一份，别在别处再造一套）。
 * 不支持 `a['b.c']`（段名里带点）：后端字段名里没有点，真出现了再说。
 *
 * 住 `_util/crud/`：列表（`crud-page/home/columns.ts`）、详情（`crud-page/detail/items.ts`）、
 * 表单（`crud-page/form/CrudFormPage.tsx` 的值绑定）都要用它，放任何一侧都会让另一侧反向依赖。
 */

/** 拆段：表单要把 key 交给 `a-form-item` 的 `name` **数组**（路径 key 才需要） */
export function pathSegments(path: string): string[] {
  return path.split('.')
}

/** 逐段走；中途遇到空值就停（读侧得到 `undefined`，写侧据此判"父容器不存在"） */
function walk(source: unknown, keys: string[]): unknown {
  return keys.reduce<unknown>(
    (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
    source,
  )
}

export function readPath(source: unknown, path: string): unknown {
  return walk(source, pathSegments(path))
}

/**
 * 写回 `a.b.c` 的最后一段（单段 key = 顶层赋值，与 `readPath` 对称）。
 *
 * 父容器**不存在或不是对象**（含中途遇到 `null` / `undefined` / 标量）**当场抛**：那说明声明的
 * 路径与实体形状对不上（如 `createEntity` 没给出中间层），静默丢值、或漏出原生的
 * "Cannot create property … on number" 都比报错难查得多 —— 与 `buildFormFields` 的
 * "声明写错当场抛"同一口径。（自检见 `.codebuddy/check-path.mjs`：这一步就是它抓出来的。）
 */
export function writePath(target: unknown, path: string, value: unknown): void {
  const keys = pathSegments(path)
  const last = keys.pop()
  const parent = walk(target, keys)
  if (last == null || parent == null || typeof parent !== 'object') {
    throw new Error(
      `[crud-page] 写回路径 '${path}' 的父容器不存在或不是对象：检查表单 key 与实体形状（createEntity 要给全中间层）`,
    )
  }
  ;(parent as Record<string, unknown>)[last] = value
}
