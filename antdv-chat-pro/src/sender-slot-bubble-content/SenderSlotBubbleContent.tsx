import {computed, defineComponent, type PropType} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {TextBlock} from '@loncra/chat-core'
import useStyle from './style'

const SenderSlotBubbleContent = defineComponent({
  name: 'LSenderSlotBubbleContent',
  inheritAttrs: false,
  props: {
    content: {
      type: Array as PropType<readonly TextBlock<string, unknown>[]>,
      required: true,
    },
    rootClass: String,
  },
  setup(props, {attrs, slots}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('sender-slot-bubble-content', 'loncra-sender-slot-bubble-content'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <span
          {...rest}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.rootClass,
            attrClass as string,
          )}
          style={attrStyle as never}
        >
          {props.content.map((block, index) => {
            if (block.type === 'text' && typeof block.value === 'string') {
              return <span key={index}>{block.value}</span>
            }
            return slots.renderBlock?.({block, index})
          })}
        </span>
      )
    }
  },
})

export default SenderSlotBubbleContent
