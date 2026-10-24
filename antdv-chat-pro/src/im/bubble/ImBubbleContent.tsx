import {computed, defineComponent, type PropType} from 'vue'
import {Flex, Tag, Tooltip, Typography} from 'antdv-next'
import {UserOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AttachmentUpload} from '@loncra/antdv-pro'
import {getEnumName, isEnumValue, type ObjectWriteResult} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE, type UserChatMessageResponseBody,} from '@loncra/client/message'
import type {
  AttachmentBlock,
  CallBlock,
  ImCustomBlock,
  InstructionBlock,
  ReferenceBlock,
  TextBlock,
  UndoBlock,
} from '@loncra/chat-core'
import SenderSlotBubbleContent from '../../sender-slot-bubble-content'
import type {ImChatHost} from '../host.ts'
import {AuthServerService} from '@loncra/client/auth'
import ImCallBlock from '../call/ImCallBlock.tsx'
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
    host: {type: Object as PropType<ImChatHost>, required: true},
    onJump: {type: Function as PropType<(message: UserChatMessageResponseBody) => void>, required: true},
    onReedit: {type: Function as PropType<() => void>, required: true},
  },
  setup(props) {
    const locale = useLocale('ImBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-bubble', IM_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function renderReference(message: UserChatMessageResponseBody) {
      const owner = message.participant?.type
      const mine = message.principal === props.host.self.systemName
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
              {mine ? locale.value.me : `[${AuthServerService.getPrincipalNameByUserDetails(message.participant?.metadata?.details)}]`}
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

    function renderFilesBlock(piece: AttachmentBlock) {
      return (
        <AttachmentUpload
          preview
          value={piece.value}
          onUpdate:value={(value) => {
            if (Array.isArray(value)) {
              piece.value = value as ObjectWriteResult[]
            }
          }}
        />
      )
    }

    function renderInstructionBlock(piece: InstructionBlock) {
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

    function renderCallBlock(piece: CallBlock) {
      return <ImCallBlock block={piece} host={props.host} />
    }

    function renderUndoBlock(piece: UndoBlock) {
      const mine = props.principal === props.host.self.systemName
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

    function renderReferenceBlock(piece: ReferenceBlock) {
      return <Flex vertical gap="small">{piece.value.map(renderReference)}</Flex>
    }

    return () => (
      <SenderSlotBubbleContent
        content={props.content}
        v-slots={{
          renderBlock: ({block}: {block: TextBlock<string, unknown>}) => {
            if (block.type !== 'custom') {
              return null
            }
            const slotKind = (block as ImCustomBlock<string, unknown>).slotKind
            if (slotKind === 'files') {
              return renderFilesBlock(block as AttachmentBlock)
            }
            if (slotKind === 'instruction') {
              return renderInstructionBlock(block as InstructionBlock)
            }
            if (slotKind === 'call') {
              return renderCallBlock(block as CallBlock)
            }
            if (slotKind === 'undo') {
              return renderUndoBlock(block as UndoBlock)
            }
            if (slotKind === 'reference') {
              return renderReferenceBlock(block as ReferenceBlock)
            }
            return null
          },
        }}
      />
    )
  },
})

export default ImBubbleContent
