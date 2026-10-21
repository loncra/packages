import {computed, type ComputedRef, inject, type Ref, unref} from 'vue'
import type {ActionAuth} from '../_util/crud/actions'
import {CRUD_CONFIG_KEY, type CrudConfig} from './types'

const EMPTY_CONFIG: CrudConfig = {}

export function useCrudConfig(): ComputedRef<CrudConfig> {
  const injected = inject(CRUD_CONFIG_KEY, undefined)
  return computed(() => injected?.value ?? EMPTY_CONFIG)
}

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
