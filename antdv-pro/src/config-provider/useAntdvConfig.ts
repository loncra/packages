import {computed, inject, provide, reactive, ref, type ComputedRef, type InjectionKey} from 'vue'
import {theme, type ThemeConfig} from 'antdv-next'
import type {MappingAlgorithm} from 'antdv-next/dist/theme'
import type {
  AntdvConfig,
  AntdvConfigInitial,
  AntdvConfigState,
  AntdvResolvedTheme,
  AntdvThemeMode,
} from './types'

export const ANTDV_CONFIG_KEY: InjectionKey<AntdvConfig> = Symbol('loncra-antdv-config')

const DEFAULT_STATE: AntdvConfigState = {
  mode: 'system',
  token: {},
  compact: false,
  componentSize: 'middle',
  locale: typeof navigator === 'undefined' ? 'zh-CN' : navigator.language,
  formLayout: 'vertical',
  detailLayout: 'vertical',
}

function darkMediaQuery(): MediaQueryList | undefined {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return undefined
  }
  return window.matchMedia('(prefers-color-scheme: dark)')
}

export function createAntdvConfig(initial?: AntdvConfigInitial): AntdvConfig {
  const state = reactive<AntdvConfigState>({...DEFAULT_STATE, ...initial})

  const prefersDark = ref(darkMediaQuery()?.matches ?? false)
  darkMediaQuery()?.addEventListener('change', (event) => {
    prefersDark.value = event.matches
  })

  const resolvedTheme: ComputedRef<AntdvResolvedTheme> = computed(() =>
    state.mode === 'system' ? (prefersDark.value ? 'dark' : 'light') : state.mode,
  )

  const themeConfig = computed<ThemeConfig>(() => {
    const algorithm: MappingAlgorithm =
      resolvedTheme.value === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm
    return {
      algorithm: state.compact ? [algorithm, theme.compactAlgorithm] : algorithm,
      token: state.token as ThemeConfig['token'],
    }
  })

  function isScalar(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
  }

  return {
    state,
    theme: resolvedTheme,
    themeConfig,
    setMode: (mode: AntdvThemeMode) => {
      state.mode = mode
    },
    setCompact: (compact: boolean) => {
      state.compact = compact
    },
    setComponentSize: (size) => {
      state.componentSize = size
    },
    setTokenValue: (key: string, value: string | number | boolean) => {
      if (!isScalar(value)) {
        return
      }
      state.token[key] = value
    },
    setFormLayout: (layout) => {
      state.formLayout = layout
    },
    setDetailLayout: (layout) => {
      state.detailLayout = layout
    },
    setLocale: (locale: string) => {
      state.locale = locale
    },
  }
}

export function provideAntdvConfig(config: AntdvConfig): void {
  provide(ANTDV_CONFIG_KEY, config)
}

export function useAntdvConfig(): AntdvConfig {
  const config = inject(ANTDV_CONFIG_KEY, undefined)
  if (!config) {
    throw new Error('[antdv-pro] useAntdvConfig() 必须用在 <l-provider> 之内')
  }
  return config
}
