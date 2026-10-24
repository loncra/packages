import {defineComponent, Teleport, type CSSProperties, type PropType, type Ref} from 'vue'
import {Popover} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {InstructionItem} from './types'

const InstructionSenderPanel = defineComponent({
  name: 'LInstructionSenderPanel',
  props: {
    popoverRef: Object as PropType<Ref<{forceAlign?: () => void} | undefined>>,
    open: Boolean,
    hashedClass: String,
    prefixCls: String,
    prefix: String,
    items: {
      type: Array as PropType<InstructionItem[]>,
      default: () => [],
    },
    activeIndex: Number,
    pick: Function as PropType<(item: InstructionItem) => void>,
    highlight: Function as PropType<(index: number) => void>,
    popoverClasses: Object as PropType<Record<string, string>>,
    popoverStyles: Object as PropType<Record<string, unknown>>,
    panelClass: String,
    panelStyle: Object as PropType<CSSProperties>,
    itemClass: String,
    itemStyle: Object as PropType<CSSProperties>,
    anchorClass: String,
    anchorStyle: Object as PropType<Record<string, string | number>>,
  },
  setup(props, {slots}) {
    return () => (
      <Teleport to="body">
        <Popover
          ref={props.popoverRef as never}
          open={props.open}
          trigger={[]}
          destroyOnHidden={false}
          class={props.hashedClass}
          rootClass={props.hashedClass}
          classes={props.popoverClasses}
          styles={props.popoverStyles as never}
          v-slots={{
            content: () => (
              <div
                class={classNames(
                  props.hashedClass,
                  `${props.prefixCls}-panel`,
                  props.panelClass,
                )}
                style={props.panelStyle as never}
                onMousedown={(e: MouseEvent) => e.preventDefault()}
              >
                {slots.list
                  ? slots.list({
                      items: props.items ?? [],
                      prefix: props.prefix ?? '',
                      activeIndex: props.activeIndex ?? 0,
                      pick: (item: InstructionItem) => props.pick?.(item),
                    })
                  : props.items.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        class={classNames(
                          props.hashedClass,
                          `${props.prefixCls}-item`,
                          props.itemClass,
                          {
                            [`${props.prefixCls}-item-active`]: index === props.activeIndex,
                          },
                        )}
                        style={props.itemStyle as never}
                        onMouseenter={() => props.highlight?.(index)}
                        onClick={() => props.pick?.(item)}
                      >
                        {slots.item
                          ? slots.item({
                              index,
                              item,
                              prefix: props.prefix ?? '',
                            })
                          : item.value}
                      </div>
                    ))}
              </div>
            ),
          }}
        >
          <span
            class={classNames(props.hashedClass, `${props.prefixCls}-anchor`, props.anchorClass)}
            style={props.anchorStyle as never}
          />
        </Popover>
      </Teleport>
    )
  },
})

export default InstructionSenderPanel
