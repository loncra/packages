import {defineComponent, type CSSProperties, type PropType, type SlotsType, type VNode} from 'vue'
import {Card, Spin} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {DataLoadingCardProps, DataLoadingCardSlots, DataLoadingTask} from './types'
import {useDataLoadingCard} from './useDataLoadingCard'

const DataLoadingCard = defineComponent({
  name: 'LDataLoadingCard',
  inheritAttrs: false,
  props: {
    loading: {type: Boolean, default: false},
    onMounted: Function as PropType<DataLoadingTask>,
    onActivated: Function as PropType<DataLoadingTask>,
    title: {type: [Object, Boolean] as PropType<VNode | boolean>, default: undefined},
    plain: {type: Boolean, default: false},
    spin: {type: Boolean, default: true},
    rootClass: String,
    classes: Object as PropType<DataLoadingCardProps['classes']>,
    styles: Object as PropType<DataLoadingCardProps['styles']>,
  },
  emits: {
    'update:loading': (_value: boolean) => true,
  },
  slots: Object as SlotsType<DataLoadingCardSlots>,
  setup(props, {attrs, emit, slots}) {
    const {loading, prefixCls, hashId, cssVarCls, resolveTitleSlot} = useDataLoadingCard(
      props,
      slots,
      emit,
    )

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const rootClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )

      if (props.plain) {
        const content = slots.default?.()
        return (
          <div
            {...(rest as Record<string, unknown>)}
            class={rootClass}
            style={attrStyle as CSSProperties | undefined}
          >
            {props.spin ? (
              <Spin
                class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-spin`)}
                spinning={loading.value}
                classes={props.classes?.spin}
                styles={props.styles?.spin}
              >
                {content}
              </Spin>
            ) : (
              content
            )}
          </div>
        )
      }

      const content = slots.default?.()

      return (
        <Card
          {...(rest as Record<string, unknown>)}
          class={rootClass}
          style={attrStyle as CSSProperties | undefined}
          classes={props.classes?.card}
          styles={props.styles?.card}
          v-slots={{
            title: resolveTitleSlot(),
            extra: slots.extra ? () => slots.extra?.() : undefined,
            default: () =>
              props.spin ? (
                <Spin
                  class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-spin`)}
                  spinning={loading.value}
                  classes={props.classes?.spin}
                  styles={props.styles?.spin}
                >
                  {content}
                </Spin>
              ) : (
                content
              ),
          }}
        />
      )
    }
  },
})

export default DataLoadingCard
