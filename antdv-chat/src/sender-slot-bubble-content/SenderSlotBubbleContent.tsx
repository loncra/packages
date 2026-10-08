import {computed, defineComponent, type PropType} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {TextBlock} from '@loncra/chat-core'
import useStyle from './style/index.ts'

const SenderSlotBubbleContent = defineComponent({
  name: 'LSenderSlotBubbleContent',
  props: {
    content: {
      type: Array as PropType<readonly TextBlock<string, unknown>[]>,
      required: true,
    },
  },
  setup(props, {slots}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('sender-slot-bubble-content', 'loncra-sender-slot-bubble-content'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    return () => props.content.map((block, index) => {
      if (block.type === 'text' && typeof block.value === 'string') {
        return (
          <span
            key={index}
            class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}
          >
            {block.value}
          </span>
        )
      }
      return slots.renderBlock?.({block, index})
    })
  },
})

export default SenderSlotBubbleContent
