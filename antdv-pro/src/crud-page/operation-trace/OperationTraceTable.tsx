import {computed, defineComponent, type PropType, type SlotsType} from 'vue'
import {CrudHomePage} from '../home'
import {createOperationTracePage, OPERATION_TRACE_VARIANT} from './page'
import type {OperationTraceEntity, OperationTraceTableProps, OperationTraceTableSlots,} from './types'

export function isOperationTraceVisible(target?: string, entity?: OperationTraceEntity): boolean {
  return !!target && entity?.id != null && entity?.creationTime != null
}

const OperationTraceTable = defineComponent({
  name: 'LOperationTraceTable',
  inheritAttrs: false,
  props: {
    target: String,
    entity: {type: Object as PropType<OperationTraceTableProps['entity']>, default: undefined},
  },
  slots: Object as SlotsType<OperationTraceTableSlots>,
  setup(props, {attrs, slots}) {
    const page = createOperationTracePage()

    const query = computed(() => ({
      after: props.entity?.creationTime,
      'filter_[data.operationTrace.target_eq]': props.target,
      'filter_[data.operationTrace.id_eq]': props.entity?.id,
    }))

    return () => {
      if (!isOperationTraceVisible(props.target, props.entity)) {
        return null
      }
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <div {...rest} class={attrClass} style={attrStyle}>
          <CrudHomePage
            plain
            page={page}
            query={query.value}
            variant={OPERATION_TRACE_VARIANT}
            title={false}
          />
          {slots.default?.({entity: props.entity})}
        </div>
      )
    }
  },
})

export default OperationTraceTable
