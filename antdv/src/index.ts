/// <reference path="./env.d.ts" />

export { default as TooltipValidationFormItem } from './tooltip-validation-form-item'
export type {
  TooltipValidationFormItemProps,
  TooltipValidationFormItemSlots,
} from './tooltip-validation-form-item'

export { default as QrCodeModal } from './qr-code-modal'
export type {
  QrCodeModalClasses,
  QrCodeModalEmits,
  QrCodeModalProps,
  QrCodeModalSlots,
  QrCodeModalStyles,
} from './qr-code-modal'

export { default as BasicImage } from './basic-image'
export type { BasicImageProps, BasicImageSlots } from './basic-image'

export { default as IconSelect } from './icon-select'
export type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectClasses,
  IconSelectEmits,
  IconSelectModeType,
  IconSelectProps,
  IconSelectSlots,
  IconSelectStyles,
} from './icon-select'
export { AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE } from './icon-select'

export { default as KeyValueTable } from './key-value-table'
export type {
  KeyValueRow,
  KeyValueTableClasses,
  KeyValueTableEmits,
  KeyValueTableExpose,
  KeyValueTableProps,
  KeyValueTableSlots,
  KeyValueTableStyles,
} from './key-value-table'

export { default as zhCN } from './locale/zh_CN'
export { default as enUS } from './locale/en_US'
export type { Locale } from './locale'
export { createUseLocale, fillLocale, useLocale } from './_util/context/useLocale'
export type { LocaleComponentName } from './_util/context/useLocale'
export { classNames } from './_util/classNames'
export { createStyleHooks } from './_util/style/factory'
export type { LoncraStyleToken } from './_util/genStyleLayer'
export {
  genFullSpinStyle,
  genScrollAreaStyle,
  JUMP_KEYFRAMES,
  SPIN_KEYFRAMES,
} from './_util/style/fragments'
export { useIsDark } from './_util/context/useIsDark'
export { useFormItemTrigger } from './_util/useFormItemTrigger'
export { useTwoWayModel } from './_util/useTwoWayModel'
export type { ModelEmit } from './_util/useTwoWayModel'

export type { VNode, VNodeChild } from 'vue'
