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
  setup(props, {attrs, slots}) {
    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const cellClass = classNames(
        props.prefixCls,
        props.hashId,
        props.cssVarCls,
        `${props.prefixCls}-cell`,
        attrClass,
      )
      if (props.isDrag) {
        return (
          <div {...rest} class={cellClass} style={attrStyle}>
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
          </div>
        )
      }
      return (
        <span {...rest} class={cellClass} style={attrStyle}>
          {slots.default?.()}
          {props.actionable ? (
            <ActionButton
              size="small"
              actions={props.actions}
              onAction={(id: string) => props.onAction?.(id)}
            />
          ) : null}
        </span>
      )
    }
  },
})

export default QueryTableCell
