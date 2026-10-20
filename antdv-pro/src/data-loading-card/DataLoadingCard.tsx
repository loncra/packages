import {defineComponent, type PropType, type SlotsType, type VNode} from 'vue'
import {Card, Spin} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {DataLoadingCardSlots, DataLoadingTask} from './types'
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
  },
  emits: {
    'update:loading': (_value: boolean) => true,
  },
  slots: Object as SlotsType<DataLoadingCardSlots>,
  setup(props, {attrs, slots}) {
    const {loading, prefixCls, hashId, cssVarCls, resolveTitleSlot} = useDataLoadingCard(
      props,
      slots,
    )

    return () => {
      if (props.plain) {
        const content = slots.default?.()
        return (
          <div {...(attrs as Record<string, unknown>)}>
            {props.spin ? <Spin spinning={loading.value}>{content}</Spin> : content}
          </div>
        )
      }

      const content = slots.default?.()

      return (
        <Card
          {...(attrs as Record<string, unknown>)}
          v-slots={{
            title: resolveTitleSlot(),
            extra: slots.extra ? () => slots.extra?.() : undefined,
            default: () =>
              props.spin ? (
                <Spin
                  class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-spin`)}
                  spinning={loading.value}
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
