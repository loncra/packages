import type {ComputedRef} from 'vue'
import type {ThemeConfig} from 'antdv-next'
import type {CrudConfigProviderProps} from '../crud-config-provider'
import type {ClientProviderProps} from '../client-provider'

/** 主题模式：跟随系统 / 暗 / 亮 */
export type AntdvThemeMode = 'system' | 'dark' | 'light'

/** 解析后的主题（`system` 会按系统偏好落到 dark / light） */
export type AntdvResolvedTheme = Exclude<AntdvThemeMode, 'system'>

export type AntdvComponentSize = 'small' | 'middle' | 'large'
export type AntdvFormLayout = 'horizontal' | 'vertical' | 'inline'
export type AntdvDetailLayout = 'horizontal' | 'vertical'

/** theme token 的覆盖值：只允许标量（嵌套结构不许写） */
export type AntdvTokenOverrides = Record<string, string | number | boolean>

/**
 * 配置的**输入**部分（可持久化的就这些；派生值不进 state）。
 * `mode` 的初值默认 `'system'`，`locale` 不给就用 `navigator.language`。
 */
export interface AntdvConfigState {
  mode: AntdvThemeMode
  token: AntdvTokenOverrides
  compact: boolean
  componentSize: AntdvComponentSize
  locale: string
  formLayout: AntdvFormLayout
  detailLayout: AntdvDetailLayout
}

/** `createAntdvConfig` 的入参（宿主从自己的存储/后端读出来喂进来） */
export type AntdvConfigInitial = Partial<AntdvConfigState>

/**
 * 配置实例：**纯内存、无 IO**。
 *
 * 持久化 / `<html data-theme>` / i18n 同步**都归宿主**（一台机器 N 个用户 ⇒ pro 不知道
 * "存哪、按谁存"）；宿主自己 `watch(config.state)` 写回、`watch(config.theme)` 同步 DOM。
 */
export interface AntdvConfig {
  /** 输入状态（reactive，直接读；改都走下面的 setter） */
  state: AntdvConfigState
  /** 解析后的主题（跟随系统时会随系统变化） */
  theme: ComputedRef<AntdvResolvedTheme>
  /** 喂 antdv `XProvider :theme`（`compact` 会合并进 algorithm） */
  themeConfig: ComputedRef<ThemeConfig>
  setMode: (mode: AntdvThemeMode) => void
  setCompact: (compact: boolean) => void
  setComponentSize: (size: AntdvComponentSize) => void
  /** 单项覆盖 token（只接受标量新值，防写坏主题的嵌套结构） */
  setTokenValue: (key: string, value: string | number | boolean) => void
  setFormLayout: (layout: AntdvFormLayout) => void
  setDetailLayout: (layout: AntdvDetailLayout) => void
  setLocale: (locale: string) => void
}

export interface AntdvConfigProviderProps extends ClientProviderProps, CrudConfigProviderProps {
  /** 宿主自己初始化好的配置实例；不传则内部建一份默认的 */
  antdvConfig?: AntdvConfig
  /** antdv 的 locale 对象（宿主从自己的 i18n 里取；pro 不猜 i18n） */
  localeMessage?: object
}

export interface AntdvConfigProviderSlots {
  default?: () => unknown
}
