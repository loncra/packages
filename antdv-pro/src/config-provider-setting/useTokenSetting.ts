import {theme} from 'antdv-next'
import {useAntdvConfig} from '../config-provider/useAntdvConfig'

export function useTokenSetting() {
  const config = useAntdvConfig()
  const {token} = theme.useToken()

  /** 覆盖值优先，否则用当前生效的 token 值 */
  function tokenValue(key: string): string | number | boolean | undefined {
    const fallback = (token.value as unknown as Record<
      string,
      string | number | boolean | undefined
    >)[key]
    return config.state.token[key] ?? fallback
  }

  const numberValue = (key: string): number | undefined =>
    tokenValue(key) == null ? undefined : Number(tokenValue(key))

  const colorValue = (key: string): string | undefined =>
    tokenValue(key) == null ? undefined : String(tokenValue(key))

  const booleanValue = (key: string): boolean => Boolean(tokenValue(key))

  function setToken(key: string, value: unknown): void {
    config.setTokenValue(key, value as string | number | boolean)
  }

  return {tokenValue, numberValue, colorValue, booleanValue, setToken}
}
