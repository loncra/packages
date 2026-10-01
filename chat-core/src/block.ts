/**
 * 内容块**信封**：只保证"块有 type"，**不碰块里装什么**（内容在各自域字段里：
 * `files` / `value` / `prefix` / `outputText` …）。
 * 形状对齐官方 `SlotConfigBaseType` 的最小面（**仅注释引用，代码不依赖**）。
 *
 * ⚠️ `slotKind` **不放这里** —— 它是"扩展位"的字段，见 `CustomChatBlock`。
 * 另：`id` 只能可选（Agent 块的 `id` 必填、IM 的 `ReferenceBlock` 没有 `id`）。
 */
export interface ChatBlockBase {
  id?: string
  type: string
}

/**
 * **自定义（扩展）块**：`slotKind` **必填、不加问号** —— 看 `SlotConfigType` 时一眼能认出哪些是自定义槽。
 *
 * 官方 `custom` 只有 `type: 'custom'` + `key` + `props`（任意）+ `customRender`，**官方没有 `slotKind`**；
 * `slotKind` 是**本仓在此之上的二级判别**（`files` / `instruction` / `reference` / `call` / `undo`）——
 * 旁证：草稿层 `PersistableSlot` 与 `isInstructionSlot()` 都是判 `slotKind`。
 */
export interface CustomChatBlock extends ChatBlockBase {
  type: 'custom'
  slotKind: string
}

/** 纯文本块：对齐官方 `SlotConfigTextType`（仅注释引用） */
export interface TextBlock extends ChatBlockBase {
  type: 'text'
  value: string
}
