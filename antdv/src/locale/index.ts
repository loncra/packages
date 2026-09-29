export interface TooltipValidationFormItemLocale {}

export interface QrCodeModalLocale {
  share: string
  copy: string
}

export interface IconSelectLocale {
  link: string
  name: string
  icon: string
  /** 图标选择弹层里搜索框的占位文案 */
  searchPlaceholder: string
}

export interface EmojiButtonLocale {
  smileys_emotion: string
  animals_nature: string
  food_drink: string
  travel_places: string
  activities: string
  objects: string
}

export interface KeyValueTableLocale {
  name: string
  value: string
  action: string
}

export interface Locale {
  locale: string
  TooltipValidationFormItem?: TooltipValidationFormItemLocale
  QrCodeModal?: QrCodeModalLocale
  IconSelect?: IconSelectLocale
  EmojiButton?: EmojiButtonLocale
  KeyValueTable?: KeyValueTableLocale
}
