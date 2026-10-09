import {defineComponent, type PropType} from 'vue'
import {Tag, Typography} from 'antdv-next'
import {ApiOutlined, ThunderboltOutlined} from '@antdv-next/icons'
import type {TextBlock} from '@loncra/chat-core'
import SenderSlotBubbleContent from '../../sender-slot-bubble-content/SenderSlotBubbleContent.tsx'

const AgentUserContent = defineComponent({
  name: 'LAgentUserContent',
  props: {
    item: {
      type: Object as PropType<{content?: readonly TextBlock<string, unknown>[]; reedit?: boolean}>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <Typography.Text delete={props.item.reedit} type={props.item.reedit ? 'secondary' : undefined}>
        <SenderSlotBubbleContent
          content={(props.item.content ?? []).filter((block) =>
            !(block.type === 'custom' && 'slotKind' in block && block.slotKind === 'files'),
          )}
          v-slots={{
            renderBlock: ({block}: {block: TextBlock<string, unknown>}) => {
              const piece = block as TextBlock<'custom', {value?: string}> & {slotKind?: string; prefix?: string}
              if (piece.type !== 'custom' || piece.slotKind !== 'instruction') {
                return null
              }
              const Icon = piece.prefix === '/skill'
                ? ThunderboltOutlined
                : piece.prefix === '/mcp'
                  ? ApiOutlined
                  : undefined
              return (
                <Tag
                  variant="outlined"
                  v-slots={{
                    icon: Icon ? () => <Icon /> : undefined,
                    default: () => piece.value?.value,
                  }}
                />
              )
            },
          }}
        />
      </Typography.Text>
    )
  },
})

export default AgentUserContent
