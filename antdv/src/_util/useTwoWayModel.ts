import {shallowRef, toRaw, watch, type Ref} from 'vue'

export type ModelEmit = (event: any, ...args: any[]) => void

export interface TwoWayModelOptions<P, K extends keyof P & string, L> {
  toLocal?: (value: P[K]) => L
  toEmitted?: (local: L) => P[K]
  deep?: boolean
  flush?: 'pre' | 'sync' | 'post'
}

export function useTwoWayModel<P extends object, K extends keyof P & string, L = P[K]>(
  props: P,
  name: K,
  emit: ModelEmit,
  options?: TwoWayModelOptions<P, K, L>,
): Ref<L> {
  const toLocal = options?.toLocal ?? ((value: P[K]) => value as unknown as L)
  const toEmitted = options?.toEmitted ?? ((local: L) => local as unknown as P[K])
  const deep = options?.deep ?? false
  const flush = options?.flush ?? 'sync'
  const local = shallowRef<L>(toLocal(props[name]))
  let lastEmitted: P[K] | undefined
  let syncing = false

  watch(
    local,
    (value) => {
      if (syncing) {
        return
      }
      lastEmitted = toEmitted(value)
      emit(`update:${name}`, lastEmitted)
    },
    {flush, deep},
  )

  watch(
    () => props[name],
    (value) => {
      if (value != null && toRaw(value) === toRaw(lastEmitted)) {
        return
      }
      const next = toLocal(value)
      if (Object.is(next, local.value)) {
        return
      }
      syncing = true
      local.value = next
      syncing = false
    },
    {flush, deep},
  )

  return local
}
