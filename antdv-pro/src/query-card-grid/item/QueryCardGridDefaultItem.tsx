import {defineComponent, type PropType} from 'vue'
import {Card, Typography} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {ResolvedAction} from '../../_util/crud/actions'
import ActionButton from '../../action-button'

const QueryCardGridDefaultItem = defineComponent({
  name: 'LQueryCardGridDefaultItem',
  inheritAttrs: false,
  props: {
    prefixCls: {type: String, required: true},
    hashId: String,
    cssVarCls: String,
    title: {type: String, default: ''},
    itemActions: {type: Array as PropType<ResolvedAction[]>, default: () => []},
    dragEnabled: Boolean,
    onDragStart: Function as PropType<(event: DragEvent) => void>,
    onDragEnd: Function as PropType<() => void>,
    onAction: Function as PropType<(id: string) => void>,
  },
  setup(props, {attrs}) {
    return () => {
      const hasActions = props.itemActions.length > 0
      const hasHandle = props.dragEnabled
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Card
          {...rest}
          size="small"
          class={attrClass}
          style={attrStyle}
          title={props.title}
          v-slots={{
            actions:
              hasActions || hasHandle
                ? () => (
                    <>
                      {hasActions ? (
                        <div onClick={(e: Event) => e.stopPropagation()}>
                          <ActionButton
                            size="small"
                            type="text"
                            alwaysDropdown
                            actions={props.itemActions}
                            onAction={(id: string) => props.onAction?.(id)}
                          />
                        </div>
                      ) : null}
                      {hasHandle ? (
                        <div
                          class={classNames(
                            props.prefixCls,
                            props.hashId,
                            props.cssVarCls,
                            `${props.prefixCls}-drag-handle`,
                          )}
                          draggable
                          onClick={(e: Event) => e.stopPropagation()}
                          onDragstart={(e: DragEvent) => props.onDragStart?.(e)}
                          onDragend={() => props.onDragEnd?.()}
                        >
                          <Typography.Text type="secondary">::</Typography.Text>
                        </div>
                      ) : null}
                    </>
                  )
                : undefined,
          }}
        />
      )
    }
  },
})

export default QueryCardGridDefaultItem
