import type {ComputedRef} from 'vue'
import type {ThemeConfig} from 'antdv-next'
import type {CrudConfigProviderProps} from '../crud-config-provider'
import type {ClientProviderProps} from '../client-provider'

export type AntdvThemeMode = 'system' | 'dark' | 'light'

export type AntdvResolvedTheme = Exclude<AntdvThemeMode, 'system'>

export type AntdvComponentSize = 'small' | 'middle' | 'large'
export type AntdvFormLayout = 'horizontal' | 'vertical' | 'inline'
export type AntdvDetailLayout = 'horizontal' | 'vertical'

export type AntdvTokenOverrides = Record<string, string | number | boolean>

export interface AntdvConfigState {
  mode: AntdvThemeMode
  token: AntdvTokenOverrides
  compact: boolean
  componentSize: AntdvComponentSize
  locale: string
  formLayout: AntdvFormLayout
  detailLayout: AntdvDetailLayout
}

export type AntdvConfigInitial = Partial<AntdvConfigState>

export interface AntdvConfig {
  state: AntdvConfigState
  theme: ComputedRef<AntdvResolvedTheme>
  themeConfig: ComputedRef<ThemeConfig>
  setMode: (mode: AntdvThemeMode) => void
  setCompact: (compact: boolean) => void
  setComponentSize: (size: AntdvComponentSize) => void
  setTokenValue: (key: string, value: string | number | boolean) => void
  setFormLayout: (layout: AntdvFormLayout) => void
  setDetailLayout: (layout: AntdvDetailLayout) => void
  setLocale: (locale: string) => void
}

export interface AntdvConfigProviderProps extends ClientProviderProps, CrudConfigProviderProps {
  antdvConfig?: AntdvConfig
  localeMessage?: object
}

export interface AntdvConfigProviderSlots {
  default?: () => unknown
}
