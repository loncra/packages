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

/** 系统主题查询（SSR / 无 matchMedia 时给个恒亮的假实现） */
function darkMediaQuery(): MediaQueryList | undefined {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return undefined
  }
  return window.matchMedia('(prefers-color-scheme: dark)')
}

/**
 * 建一份 antdv 配置实例（**纯内存**）。
 *
 * - 宿主决定初值从哪来（`createAntdvConfig(readStored())`）、怎么存回去（自己 `watch`）；
 * - 唯一的副作用是 `mode: 'system'` 时跟随系统主题（`matchMedia` 监听，应用级生命周期）；
 * - 派生值 `theme` / `themeConfig` 都是 computed，`compact` 会合并进 algorithm。
 */
export function createAntdvConfig(initial?: AntdvConfigInitial): AntdvConfig {
  const state = reactive<AntdvConfigState>({...DEFAULT_STATE, ...initial})

  /** 系统偏好：只有 `mode: 'system'` 时才参与解析；监听是应用级生命周期（无 scope 依赖） */
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
      // 覆盖值是标量白名单（见 setTokenValue），断言成 antdv 的 token 类型
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

/** `LProvider` 里注入配置实例（宿主若传了自己的实例，注入的就是那一份） */
export function provideAntdvConfig(config: AntdvConfig): void {
  provide(ANTDV_CONFIG_KEY, config)
}

/**
 * 读当前配置实例。拿不到就抛（在 `LProvider` 之外用，是写错了 —— 别静默给一份临时实例）。
 */
export function useAntdvConfig(): AntdvConfig {
  const config = inject(ANTDV_CONFIG_KEY, undefined)
  if (!config) {
    throw new Error('[antdv-pro] useAntdvConfig() 必须用在 <l-provider> 之内')
  }
  return config
}
