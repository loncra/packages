export interface QrCodeModalLocale {
  share: string
  copy: string
}

export interface IconSelectLocale {
  link: string
  name: string
  icon: string
  searchPlaceholder: string
}

export interface KeyValueTableLocale {
  name: string
  value: string
  action: string
}

export interface Locale {
  locale: string
  QrCodeModal?: QrCodeModalLocale
  IconSelect?: IconSelectLocale
  KeyValueTable?: KeyValueTableLocale
}
