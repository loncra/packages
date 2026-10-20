import {computed, defineComponent} from 'vue'
import {Tooltip} from 'antdv-next'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'
import type {TooltipValidationFormItemProps} from './types'

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
