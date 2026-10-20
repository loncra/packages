import {computed, defineComponent, type PropType} from 'vue'
import {Tooltip} from 'antdv-next'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'
import type {TooltipValidationFormItemProps} from './types'

const TooltipValidationFormItem = defineComponent(
  (props: TooltipValidationFormItemProps, { slots, attrs }) => {
    const itemStatus = useFormItemInputContext()
    const errorTitle = computed(() => {
      const first = itemStatus.value.errors?.[0]
      return first ? String(first) : undefined
    })

    return () => (
      <Tooltip {...attrs} classes={props.classes} styles={props.styles} title={errorTitle.value}>
        {slots.default?.()}
      </Tooltip>
    )
  },
  {
    name: 'LTooltipValidationFormItem',
    inheritAttrs: false,
    props: {
      classes: Object as PropType<TooltipValidationFormItemProps['classes']>,
      styles: Object as PropType<TooltipValidationFormItemProps['styles']>,
    },
  },
)

export default TooltipValidationFormItem
