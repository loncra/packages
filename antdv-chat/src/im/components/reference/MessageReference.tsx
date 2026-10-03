import {computed, defineComponent, type PropType} from 'vue'
import {Flex, Tag, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {getEnumName, isEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE} from '@loncra/client/message'
import {useLocale} from '../../../_util/useLocale'
import {messagePreview} from '../../imPreview'
import useStyle from './style'

/**
 * 引用消息条（迁自宿主 `components/message-server/chat/ChatMessageReference.vue`，2026-10-03 3-C2）。
 * 两处用：**发送器的引用区**（`#header`）与**气泡里的 `reference` 块**。
 *
 * ⚠️ 与宿主的差异（都是"宿主依赖换成调用方传参/包内件"，行为不变）：
 * 1. "我是谁"由 `self` 传入（宿主读 `principalStore.isCurrentPrincipal`）；
 * 2. 预览文案复用 `ConversationList` 切片的附件标签（同一套 `fileImage/...`）——
 *    以后若要抽共享切片再说；本组件只读那几个 key。
 */
export const MessageReference = defineComponent({
  name: 'LImMessageReference',
  inheritAttrs: false,
  props: {
    message: {type: Object as PropType<UserChatMessageResponseBody>, required: true},
    /** "我是谁"（`port.getPrincipal()`）—— 判这条引用是不是我发的 */
    self: {type: String, default: ''},
    /**
     * 透传给内部 `Tag` 的两个常用项（宿主当年走 attrs 传，模板不查类型；TSX 里得声明）：
     * 发送器引用区用 `variant="outlined" + closable`（可关掉），气泡里的引用块只给 `variant`。
     */
    variant: {
      type: String as PropType<'outlined' | 'solid' | 'filled'>,
      default: undefined,
    },
    closable: {type: Boolean, default: false},
    prefixCls: String,
  },
  emits: {
    click: (message: UserChatMessageResponseBody) => !!message,
    /** `closable` 时点叉（发送器引用区用它把这条从 `refMessages` 里摘掉） */
    close: () => true,
  },
  setup(props, {attrs, emit}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'im-message-reference',
        props.prefixCls ?? 'loncra-im-message-reference',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const rootClass = (extra?: string) =>
      classNames(prefixCls.value, hashId.value, cssVarCls.value, extra)
    const subClass = (suffix: string) =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-${suffix}`)

    const locale = useLocale('ChatView')
    const previewLocale = useLocale('ConversationList')

    /** 群主 / 群管等**非成员**：前面补 `[类型名]`，整条染金色（宿主同款） */
    const participantType = computed(() => props.message.participant?.type)
    const isMember = computed(() =>
      isEnumValue(participantType.value, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER),
    )

    /** `[类型名]` + （`我` 或 `[对方名]`）+ `:`（宿主模板逐字对应） */
    const author = computed(() => {
      const typePrefix = isMember.value ? '' : `[${getEnumName(participantType.value)}]`
      const who =
        props.message.principal === props.self
          ? locale.value.me
          : `[${AuthServerService.getPrincipalNameByUserDetails(props.message.participant?.metadata?.details)}]`
      return `${typePrefix}${who}:`
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Tag
          {...rest}
          class={classNames(rootClass(), attrClass)}
          style={attrStyle as never}
          variant={props.variant}
          closable={props.closable}
          color={isMember.value ? undefined : 'gold'}
          onClick={() => emit('click', props.message)}
          onClose={() => emit('close')}
        >
          <Flex align="center" gap={0} class={subClass('body')}>
            <Typography.Text class={subClass('author')}>{author.value}</Typography.Text>
            <Typography.Text type="secondary" ellipsis class={subClass('content')}>
              {messagePreview(props.message, undefined, props.self, previewLocale.value)}
            </Typography.Text>
          </Flex>
        </Tag>
      )
    }
  },
})

export type MessageReferenceInstance = InstanceType<typeof MessageReference>
