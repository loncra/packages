export { default as TooltipValidationFormItem } from './tooltip-validation-form-item'
export type {
  TooltipValidationFormItemProps,
  TooltipValidationFormItemSlots,
} from './tooltip-validation-form-item'

export { default as QrCodeModal } from './qr-code-modal'
export type { QrCodeModalEmits, QrCodeModalProps, QrCodeModalSlots } from './qr-code-modal'

export { default as BasicImage } from './basic-image'
export type { BasicImageProps, BasicImageSlots } from './basic-image'

export { default as IconSelect } from './icon-select'
export type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectEmits,
  IconSelectModeType,
  IconSelectProps,
  IconSelectSlots,
} from './icon-select'
export { AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE } from './icon-select'

export { default as EmojiButton } from './emoji-button'
export type { EmojiButtonEmits, EmojiButtonProps, EmojiButtonSlots } from './emoji-button'

export { default as Markdown, MarkdownCodeRenderer } from './markdown'
export type {
  MarkdownCodeRendererProps,
  MarkdownProps,
  MarkdownSlots,
  MarkdownTheme,
} from './markdown'

export { default as KeyValueTable } from './key-value-table'
export type {
  KeyValueRow,
  KeyValueTableEmits,
  KeyValueTableExpose,
  KeyValueTableProps,
  KeyValueTableSlots,
} from './key-value-table'

export { default as Editor } from './editor'
export type {
  EditorEmits,
  EditorProps,
  EditorSlots,
  OutputFormat,
  PluginName,
  UploadFn,
} from './editor'
export { isEmptyRichText, normalizeRichTextValue } from './editor'

export { default as InstructionSender } from './instruction-sender'
export type {
  InstructionItem,
  InstructionMeasure,
  InstructionPopoverState,
  InstructionSenderApi,
  InstructionSenderEmits,
  InstructionSenderExpose,
  InstructionSenderHandle,
  InstructionSenderProps,
  InstructionSenderSlots,
  InstructionSlotProps,
  UseInstructionSenderParams,
} from './instruction-sender'
export {
  createInstructionTagSlot,
  isInstructionSlot,
  useInstructionSender,
} from './instruction-sender'

export { default as zhCN } from './locale/zh_CN'
export { default as enUS } from './locale/en_US'
export type { Locale } from './locale'
export { useLocale } from './_util/useLocale'
export type { LocaleComponentName } from './_util/useLocale'
export { classNames } from './_util/classNames'
export { genStyleHooks } from './_util/genStyle'
export type { LoncraStyleToken } from './_util/genStyle'
export { renderIconFont } from './_util/iconFont'
export { useIsDark } from './_util/useIsDark'

/**
 * 包的 **VNode 类型视野**：宿主给 pro 传 VNode（动作的 `icon`、默认标题…）时用这两个类型，
 * 免得踩"两份 vue 副本"——两边 `@vue/runtime-core` 的 d.ts 互不兼容，只有同一个视野里才判等。
 * （运行期是同一份 vue：宿主的 vite `dedupe: ['vue']` 已经合并。）
 */
export type { VNode, VNodeChild } from 'vue'
