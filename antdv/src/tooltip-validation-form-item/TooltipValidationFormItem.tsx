import {computed, defineComponent} from 'vue'
import {Tooltip, type TooltipProps} from 'antdv-next'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'

export interface TooltipValidationFormItemProps {
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: TooltipProps['classes']
  styles?: TooltipProps['styles']
}

export interface TooltipValidationFormItemSlots {
  default?: () => unknown
}

const TooltipValidationFormItem = defineComponent(
  (_props: TooltipValidationFormItemProps, { slots, attrs }) => {
    const itemStatus = useFormItemInputContext()
    const errorTitle = computed(() => {
      const first = itemStatus.value.errors?.[0]
      return first ? String(first) : undefined
    })

    return () => (
      <Tooltip {...attrs} title={errorTitle.value}>
        {slots.default?.()}
      </Tooltip>
    )
  },
  {
    name: 'LTooltipValidationFormItem',
    inheritAttrs: false,
  },
)

export default TooltipValidationFormItem
