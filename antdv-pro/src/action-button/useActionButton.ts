import {computed} from 'vue'
import type {ResolvedAction} from '../_util/crud/actions'
import type {ActionButtonProps} from './types'

export function useActionButton(
  props: ActionButtonProps,
  emit: (event: 'action', id: string) => void,
) {
  const actions = computed(() => props.actions ?? [])

  const useDropdown = computed(() => actions.value.length > 1 || !!props.alwaysDropdown)

  const loneAction = computed(() =>
    actions.value.length === 1 ? (actions.value[0] ?? null) : null,
  )

  const menuItems = computed(() =>
    actions.value.flatMap((action, index) => {
      const item = {
        key: action.id,
        label: action.label,
        danger: action.danger,
        icon: action.icon ? () => action.icon : undefined,
        disabled: action.disabled,
      }
      return action.danger && index > 0
        ? [{type: 'divider' as const, key: `${action.id}-divider`}, item]
        : [item]
    }),
  )

  function dispatchAction(action: ResolvedAction) {
    if (action.disabled) {
      return
    }
    void action.run?.()
    emit('action', action.id)
  }

  function onMenuClick(event: {key?: string | number}) {
    const action = actions.value.find((item) => item.id === String(event.key ?? ''))
    if (action) {
      dispatchAction(action)
    }
  }

  return {useDropdown, loneAction, menuItems, dispatchAction, onMenuClick}
}
