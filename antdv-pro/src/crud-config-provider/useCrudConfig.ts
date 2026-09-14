import {computed, type ComputedRef, inject, type Ref, unref} from 'vue'
import {type ActionAuth, CRUD_CONFIG_KEY, type CrudConfig} from './types'

const EMPTY_CONFIG: CrudConfig = {}

export function useCrudConfig(): ComputedRef<CrudConfig> {
  const injected = inject(CRUD_CONFIG_KEY, undefined)
  return computed(() => injected?.value ?? EMPTY_CONFIG)
}

/**
 * 权限判定。优先用组件 has-permission prop，其次 CrudConfigProvider 注入，
 * 都没有则一律判为无权限。
 */
export function useActionAuth(
  override?: Ref<((permission: string) => boolean) | undefined>,
): ActionAuth {
  const config = useCrudConfig()

  return {
    can(permission?: string | boolean) {
      if (permission === undefined || permission === false) {
        return false
      }
      if (permission === true) {
        return true
      }
      const fn = unref(override) ?? config.value.hasPermission
      return fn ? fn(permission) : false
    },
  }
}
