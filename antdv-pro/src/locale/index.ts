export interface UserSelectLocale {
  all: string
}

export interface AttachmentUploadLocale {
  draggerTitle: string
  draggerSubTitle: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
}

export interface FileEditorLocale {
  untitled: string
  refresh: string
  uploadFile: string
  uploadDirectory: string
  rename: string
  delete: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
  save: string
  locate: string
  download: string
  unsavedConfirm: string
  unsupported: string
  tooLarge: string
  nameEmpty: string
  nameReserved: string
  nameIllegal: string
  nameTooLong: string
}

export interface SystemUserPanelLocale {
  selectedMember: string
  phoneNumber: string
  email: string
}

/** 操作记录（审计）块的文案（`Crud.operationTrace.*`，声明里写相对 key） */
export interface OperationTraceLocale {
  title: string
  auditType: string
  target: string
  time: string
  principal: string
  type: string
  traceId: string
  remark: string
}

export interface CrudLocale {
  search: string
  reset: string
  save: string
  /** 详情描述区的标题（旧 host `common.basicInformation`） */
  basicInformation: string
  /** 陈旧检查（切回页签时）：文案在这里，宿主可用 `locale-message` 覆写 */
  stale: {
    /** 记录已被删 */
    deletedTitle: string
    deletedContent: string
    /** 记录被别处改过 */
    modifiedTitle: string
    modifiedContent: string
    /** 用服务器版本（丢本地修改） */
    useRemote: string
    /** 保留我的修改 */
    keepMine: string
  }
  clear: string
  add: string
  edit: string
  detail: string
  action: string
  deleteText: string
  deleteSelected: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
  deleteConfirmBatch: string
  operationTrace: OperationTraceLocale
}

/** 颜色细项：标题 + 一句说明（与宿主原 `systemSetting.colorSetting.<item>` 同形） */
export interface ConfigProviderSettingColorItemLocale {
  title: string
  subTitle: string
}

export interface ConfigProviderSettingColorLocale {
  text: string
  prepare: string
  colorPrimary: string
  colorSuccess: string
  colorError: string
  colorWarning: string
  active: ConfigProviderSettingColorItemLocale
  bg: ConfigProviderSettingColorItemLocale
  bgHover: ConfigProviderSettingColorItemLocale
  border: ConfigProviderSettingColorItemLocale
  borderHover: ConfigProviderSettingColorItemLocale
  hover: ConfigProviderSettingColorItemLocale
  colorText: ConfigProviderSettingColorItemLocale
  colorTextActive: ConfigProviderSettingColorItemLocale
  colorTextHover: ConfigProviderSettingColorItemLocale
  other: {
    blue: string
    purple: string
    cyan: string
    red: string
    orange: string
    yellow: string
    green: string
    magenta: string
    pink: string
    volcano: string
    geekblue: string
    lime: string
    gold: string
  }
}

export interface ConfigProviderSettingLocale {
  lang: string
  open: string
  close: string
  defaultText: string
  theme: {text: string; system: string; dark: string; light: string}
  compact: string
  componentSize: string
  wireframe: string
  tabs: {color: string; size: string; style: string; other: string}
  size: {
    common: string
    large: string
    middle: string
    small: string
    lg: string
    md: string
    sm: string
    xl: string
    xs: string
    xxl: string
    xxs: string
  }
  color: ConfigProviderSettingColorLocale
  border: {radius: string; shadow: string; shadowSecondary: string; shadowTertiary: string}
  /** `heading` 里带 `{number}` 占位 */
  font: {text: string; heading: string}
  /** `heading` 里带 `{number}` 占位 */
  lineHeight: {text: string; heading: string}
  margin: string
  padding: string
  transparency: {text: string; loading: string; image: string}
}

export interface Locale {
  locale: string
  UserSelect?: UserSelectLocale
  AttachmentUpload?: AttachmentUploadLocale
  FileEditor?: FileEditorLocale
  SystemUserPanel?: SystemUserPanelLocale
  Crud?: CrudLocale
  ConfigProviderSetting?: ConfigProviderSettingLocale
}
