import {computed, defineComponent, type PropType} from 'vue'
import type {ButtonProps} from 'antdv-next'
import {Button, Dropdown} from 'antdv-next'
import {renderIconFont} from '@loncra/antdv'
import type {ResolvedAction} from '../_util/crud/actions'

export type ActionButtonSize = 'small' | 'middle' | 'large'

export interface ActionButtonProps {
  actions?: ResolvedAction[]
  size?: ActionButtonSize
  alwaysDropdown?: boolean
  type?: ButtonProps['type']
}

export interface ActionButtonEmits {
  action: (id: string) => void
}

const ActionButton = defineComponent({
  name: 'LActionButton',
  inheritAttrs: false,
  props: {
    actions: {
      type: Array as PropType<ResolvedAction[]>,
      default: () => [],
    },
    size: {
      type: String as PropType<ActionButtonSize>,
      default: 'small',
    },
    alwaysDropdown: {
      type: Boolean,
      default: false,
    },
    type: String as PropType<ButtonProps['type']>,
  },
  emits: {
    action: (_id: string) => true,
  },
  setup(props, {emit, attrs}) {
    const loneAction = computed(() => (props.actions.length === 1 ? props.actions[0] ?? null : null))

    const menuItems = computed(() =>
      props.actions.map((action) => ({
        key: action.id,
        label: action.label,
        danger: action.danger,
        icon: action.icon ? () => action.icon : undefined,
        disabled: action.disabled,
      })),
    )

    function dispatchAction(action: ResolvedAction) {
      if (action.disabled) {
        return
      }
      void action.run?.()
      emit('action', action.id)
    }

    function handleMenuClick(e: {key?: string | number}) {
      const action = props.actions.find((item) => item.id === String(e.key ?? ''))
      if (action) {
        dispatchAction(action)
      }
    }

    return () => {
      if (props.actions.length > 1 || props.alwaysDropdown) {
        return (
          <Dropdown
            placement="bottomRight"
            menu={{items: menuItems.value, onClick: handleMenuClick}}
          >
            <Button
              {...attrs}
              type={props.type}
              size={props.size}
              v-slots={{icon: () => renderIconFont('loncra-ellipsis')}}
            />
          </Dropdown>
        )
      }

      const lone = loneAction.value
      if (!lone) {
        return null
      }

      return (
        <Button
          {...attrs}
          type={props.type}
          size={props.size}
          disabled={lone.disabled}
          loading={lone.loading}
          onClick={() => dispatchAction(lone)}
          v-slots={{icon: () => lone.icon}}
        >
          <span>{lone.label}</span>
        </Button>
      )
    }
  },
})

export default ActionButton
