import {defineComponent, type PropType} from 'vue'
import {Typography} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {ResolvedAction} from '../../_util/crud/actions'
import ActionButton from '../../action-button'

const QueryTableCell = defineComponent({
  name: 'LQueryTableCell',
  inheritAttrs: false,
  props: {
    prefixCls: {type: String, required: true},
    hashId: String,
    cssVarCls: String,
    isDrag: Boolean,
    actionable: Boolean,
    actions: {type: Array as PropType<ResolvedAction[]>, default: () => []},
    onAction: Function as PropType<(id: string) => void>,
    onDragStart: Function as PropType<(event: DragEvent) => void>,
    onDragEnd: Function as PropType<() => void>,
  },
  setup(props, {slots}) {
    return () => {
      if (props.isDrag) {
        return (
          <div
            class={classNames(
              props.prefixCls,
              props.hashId,
              props.cssVarCls,
              `${props.prefixCls}-drag-handle`,
            )}
            draggable
            onDragstart={(e: DragEvent) => props.onDragStart?.(e)}
            onDragend={() => props.onDragEnd?.()}
          >
            <Typography.Text type="secondary">::</Typography.Text>
          </div>
        )
      }
      const content = slots.default?.()
      if (!props.actionable) {
        return content
      }
      return (
        <>
          {content}
          <ActionButton
            size="small"
            actions={props.actions}
            onAction={(id: string) => props.onAction?.(id)}
          />
        </>
      )
    }
  },
})

export default QueryTableCell
