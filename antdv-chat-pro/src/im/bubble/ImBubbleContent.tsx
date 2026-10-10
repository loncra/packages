import {computed, defineComponent, type PropType} from 'vue'
import {Flex, Tag, Tooltip, Typography} from 'antdv-next'
import {UserOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AttachmentUpload} from '@loncra/antdv-pro'
import {isEnumValue} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
  type UserChatMessageResponseBody,
} from '@loncra/client/message'
import type {TextBlock} from '@loncra/chat-core'
import {getEnumName} from '@loncra/client/commons'
import SenderSlotBubbleContent from '../../sender-slot-bubble-content/SenderSlotBubbleContent.tsx'
import type {ImHost} from '../host.ts'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_BUBBLE_PREFIX} from './style/index.ts'

function instructionText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value != null && typeof value === 'object' && 'value' in value) {
    const text = (value as {value?: unknown}).value
    return text == null ? '' : String(text)
  }
  return ''
}

const ImBubbleContent = defineComponent({
  name: 'LImBubbleContent',
  props: {
    content: {type: Array as PropType<readonly TextBlock<string, unknown>[]>, required: true},
    principal: {type: String, required: true},
    host: {type: Object as PropType<ImHost>, required: true},
    onJump: {type: Function as PropType<(message: UserChatMessageResponseBody) => void>, required: true},
    onReedit: {type: Function as PropType<() => void>, required: true},
  },
  setup(props, {slots}) {
    const locale = useLocale('ImBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-bubble', IM_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function renderReference(message: UserChatMessageResponseBody) {
      const owner = message.participant?.type
      const mine = message.principal === props.host.selfName
      return (
        <span key={message.id} class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
        <Tag
          variant="outlined"
          class={`${prefixCls.value}-reference`}
          color={owner != null && !isEnumValue(owner, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER) ? 'gold' : undefined}
          onClick={() => props.onJump(message)}
        >
          <Flex class={`${prefixCls.value}-reference-body`} align="center" gap={0}>
            <Typography.Text class={`${prefixCls.value}-reference-name`}>
              {owner != null && !isEnumValue(owner, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER)
                ? `[${getEnumName(owner)}] `
                : ''}
              {mine ? locale.value.me : `[${props.host.principalName(message.participant?.metadata?.details)}]`}
              :
            </Typography.Text>
            <Typography.Text class={`${prefixCls.value}-reference-preview`} type="secondary" ellipsis>
              {props.host.messagePreview(message)}
            </Typography.Text>
          </Flex>
        </Tag>
        </span>
      )
    }

    return () => (
      <SenderSlotBubbleContent
        content={props.content}
        v-slots={{
          renderBlock: ({block}: {block: TextBlock<string, unknown>}) => {
            const piece = block as TextBlock<'custom', any> & {
              slotKind?: string
              prefix?: string
              tooltip?: string
            }
            if (piece.type === 'custom' && piece.slotKind === 'files') {
              return (
                <AttachmentUpload
                  preview
                  value={piece.value}
                  onUpdate:value={(value) => {
                    if (Array.isArray(value)) {
                      piece.value = value
                    }
                  }}
                />
              )
            }
            if (piece.type === 'custom' && piece.slotKind === 'instruction') {
              const name = instructionText(piece.value)
              return (
                <Tag
                  variant="outlined"
                  v-slots={{
                    icon: piece.prefix === '@' ? () => <UserOutlined /> : undefined,
                    default: () => name,
                  }}
                />
              )
            }
            if (piece.type === 'custom' && piece.slotKind === 'call') {
              return slots.call?.({block: piece}) ?? null
            }
            if (piece.type === 'custom' && piece.slotKind === 'undo') {
              const mine = props.principal === props.host.selfName
              return (
                <Tooltip title={piece.tooltip}>
                  <Typography.Text delete type="secondary">
                    {mine ? locale.value.selfUndo : piece.value}
                  </Typography.Text>
                  {mine
                    ? (
                      <Typography.Link href="javascript:;" onClick={() => props.onReedit()}>
                        {locale.value.reedit}
                      </Typography.Link>
                    )
                    : null}
                </Tooltip>
              )
            }
            if (piece.type === 'custom' && piece.slotKind === 'reference') {
              return <Flex vertical gap="small">{piece.value.map(renderReference)}</Flex>
            }
            return null
          },
        }}
      />
    )
  },
})

export default ImBubbleContent
