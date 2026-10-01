/**
 * 渲染态角色（**不是业务枚举**）。
 *
 * ⚠️ 自持、**不 import `@antdv-next/x`**（规范包不许依赖框架；官方 `BuiltinRole` = `"ai" | "system" | "user" | "divider"`）。
 * 四个值写成字面量是为了自带说明 + 提示，末尾 `(string & {})` 与官方同款"开放字符串"写法
 * ⇒ 两边**结构等价、接缝处零 cast**。
 */
export type ChatRole = 'ai' | 'system' | 'user' | 'divider' | (string & {})

/**
 * 渲染态角色的四个标准值（与官方 `BuiltinRole` 等价）。
 *
 * ⚠️ **必须一处定义**：宿主现有 `CHAT_BUBBLE_TYPE`（`constants/systemConstant.ts:133-138`，46 处 / 12 文件）
 * 与它**同值不同名** ⇒ 落地时**二选一，不许并存**：规范内用 `CHAT_ROLE`，宿主那份改成再导出
 * （`export {CHAT_ROLE as CHAT_BUBBLE_TYPE} from '@loncra/chat-core'`）。
 */
export const CHAT_ROLE = {
  AI: 'ai',
  SYSTEM: 'system',
  USER: 'user',
  DIVIDER: 'divider',
} as const
