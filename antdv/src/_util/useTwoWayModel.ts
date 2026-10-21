import {shallowRef, watch, type Ref} from 'vue'

export function useTwoWayModel<P extends object, K extends keyof P & string>(
  props: P,
  name: K,
  emit: (event: any, value: any) => void,
): Ref<P[K]> {
  const local = shallowRef<P[K]>(props[name]) as Ref<P[K]>
  let syncing = false

  watch(
    local,
    (value) => {
      if (!syncing) {
        emit(`update:${name}`, value)
      }
    },
    {flush: 'sync'},
  )

  watch(
    () => props[name],
    (value) => {
      if (Object.is(value, local.value)) {
        return
      }
      syncing = true
      local.value = value
      syncing = false
    },
    {flush: 'sync'},
  )

  return local
}
