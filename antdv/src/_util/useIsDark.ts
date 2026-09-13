import {computed, type ComputedRef} from 'vue'
import {theme} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'

export function useIsDark(): ComputedRef<boolean> {
  const config = useConfig()
  return computed(() => {
    const algorithm = (
      config.value as { theme?: { algorithm?: unknown } }
    ).theme?.algorithm
    const list = Array.isArray(algorithm) ? algorithm : algorithm != null ? [algorithm] : []
    return list.includes(theme.darkAlgorithm)
  })
}
