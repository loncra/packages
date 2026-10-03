import {computed, defineComponent, onUnmounted, type PropType, ref, type VNodeChild, watch} from 'vue'
import {Empty, Flex, Tag, Typography} from 'antdv-next'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AttachmentUpload} from '@loncra/antdv-pro'
import {isEnumValue} from '@loncra/client/commons'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS} from '@loncra/client/message'
import type {ChatBubbleItem, ChatViewControllerBase} from '@loncra/chat-core'
import {BubbleList, type BubbleListExpose} from '../../../bubble-list'
import {type RestoreInstructionBlock} from '../../../_util/draft'
import {useLocale} from '../../../_util/useLocale'
import EmojiButton from '../../../emoji-button'
import InstructionSender, {type InstructionSenderExpose} from '../../../instruction-sender'
import {SenderSlotBubbleContent} from '../../../sender-shell'
import {MessageReference} from '../reference/MessageReference'
import {useImBubbleList} from '../../useImBubbleList'
import {useImChat} from '../../useImChatContext'
import type {ImConversationsApi} from '../../useImConversations'
import {type ImDraftSenderExpose, useImDraft} from '../../useImDraft'
import type {ImMessageListApi} from '../../useImMessageList'
import {useImSender} from '../../useImSender'
import useStyle from './style'

/**
 * 右栏：消息区（气泡列表 + 发送器）。迁自宿主 `components/message-server/chat/ChatView.vue`。
 *
 * 契约来源（计划 §2.2 / §2.3）：
 * - 气泡容器直接复用包内 `BubbleList`（宿主 `ChatBubbleList.vue` 用的就是它）；
 * - 渲染项由 `useImBubbleList.buildItems` 给（时间分隔条 + `toBubbleContent` 派生）；
 * - 发送器 = 包内 `InstructionSender` + `EmojiButton` + 引用条；逻辑在 `useImSender`、草稿在 `useImDraft`；
 * - **头像 / "谁发的" 走宿主插槽**（`ImSlots.avatar` / `ImSlots.senderName`）—— 计划原话
 *   "模块不碰 `PlatformUser`" ⇒ 宿主不给插槽就**不出**头像/表头（模块不猜名字）；
 * - `#bubbleListAfter` 透传给宿主（"跳到最早未读"按钮的外观在宿主、能力在模块 expose）。
 *
 * ⚠️ **台账（本片未做，逐条有去处）**：
 * 1. **`@` 提名**（`instructionMap` + `filterInstruction` + 候选行渲染 + 选"所有人"时清个人提名）
 *    ⇒ 下一片；现在传空 map（打了 `@` 不出候选）；
 * 2. **`/` 指令**（同上，宿主今天也只有 `@`）；
 * 3. **气泡右键菜单**（引用 / 撤回 + 倒计时）与"撤回后重编辑"入口 ⇒ 下一片（`useImSender`
 *    的 `convertContentBlockToSlotConfig` + `useImDraft.schedulePersist` 已就位，差菜单本身）；
 * 4. **`extra` 插槽**（私聊"已读眼睛" / 群聊已读表）⇒ 依赖宿主 icon-font 与 `ChatMessageReadTable`；
 * 5. **`call` / `reference` 块中的 `call`** ⇒ Step 4（通话）；`reference` 块已接（本片）；
 * 6. **跳转闪烁高亮**（宿主 `rootClass: 'bg-flash'`）⇒ 待确认 x 的渲染项类型是否吃 `rootClass`。
 */
/**
 * 两个槽"内容等价"吗 —— 只比会影响编辑器 DOM 的部分：文本比 `value`，附件/指令比 `key`
 * （key 变了就说明换了个芯片）。用途见 `draftSlots`：**别把内容没变的数组变成新身份**
 * （x 一见新身份就重建 ProseMirror 文档 ⇒ 丢选区 ⇒ 光标卡住）。
 *
 * ⚠️ 参数故意用**松散结构类型**：x 的 `SlotConfigType` 是很深的联合，直接拿它做
 * `Array.prototype.every` 的回调参数会让 TS 报 **TS2589（类型实例化过深）**。
 */
interface LooseSlot {
  type?: string
  key?: string
  value?: unknown
}

function sameSlot(a: LooseSlot | undefined, b: LooseSlot | undefined): boolean {
  if (a === b) {
    return true
  }
  if (!a || !b || a.type !== b.type || a.key !== b.key) {
    return false
  }
  if (a.type === 'text') {
    return a.value === b.value
  }
  return true
}

export const ChatView = defineComponent({
  name: 'LImChatView',
  inheritAttrs: false,
  props: {
    /** 消息列表 API（`useImMessageList` 的返回值 —— 由 `l-im` 建好传进来） */
    list: {type: Object as PropType<ImMessageListApi>, required: true},
    /** 会话列表 API（发送成功后置顶 + 更新预览） */
    conversations: {type: Object as PropType<ImConversationsApi>, required: true},
    prefixCls: String,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('im-chat-view', props.prefixCls ?? 'loncra-im-chat-view'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    /** 根元素：前缀类 + hash + 变量类 */
    const rootClass = (extra?: string) =>
      classNames(prefixCls.value, hashId.value, cssVarCls.value, extra)
    /** 子元素：**只带 hash + 变量类 + 后缀**（前缀类只能给根，2026-10-03 实测踩过） */
    const subClass = (suffix: string) =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-${suffix}`)

    const runtime = useImChat()
    const {session, activeConversation, view, slots: hostSlots, port} = runtime
    const locale = useLocale('ChatView')
    const bubble = useImBubbleList(runtime)
    const bubbleListRef = ref<BubbleListExpose>()

    /**
     * 传给 `Sender` 的 `slot-config` —— **必须是身份稳定的数组**。
     *
     * ⚠️ **x 的 ProseMirror 用"引用身份"判受控值有没有变**（`SlotTextAreaProseMirror.js:817-825`：
     * `configsChanged = configs !== controlledConfigs` + `watch([...slotConfig...])`）——
     * **一变就重建文档**，DOM 选区被丢在 `.antd-sender-content` 上 ⇒ **光标卡住、不跟文字走、
     * 看起来像自动划到下一行**（2026-10-03 实测：`getSelection().anchorNode.parentElement`
     * = `div.antd-sender-content`）。
     *
     * 而 `activeConversation.draft` 挂在**会话实体**上，`conversations.load()` / socket 的会话刷新
     * 会整体替换实体对象 ⇒ `.draft` 每次都换身份 ✗ ⇒ 这里**只认内容**：内容等价就沿用同一个数组
     * （只有真的变了——切会话、hydrate 回填、发送后清空——才换，那时重建本来就是对的）。
     */
    const draftSlots = ref<SlotConfigType[]>([])
    watch(
      () => activeConversation.value?.draft,
      (draft) => {
        const next = (draft ?? []) as unknown as LooseSlot[]
        const current = draftSlots.value as unknown as LooseSlot[]
        let equivalent = current.length === next.length
        for (let i = 0; equivalent && i < next.length; i++) {
          equivalent = sameSlot(current[i], next[i])
        }
        if (equivalent) {
          return
        }
        draftSlots.value = [...(next as unknown as SlotConfigType[])]
      },
      {immediate: true},
    )

    // ── 发送器：草稿（`useImDraft`）→ 发送逻辑（`useImSender`）→ UI（`InstructionSender`） ──
    const senderRef = ref<InstructionSenderExpose>()
    const refMessages = ref<UserChatMessageResponseBody[]>([])
    /**
     * 草稿层要的"发送器工厂"（`createFilesSlot` / `getSlotConfigValue`）：由 `useImSender` 提供 ——
     * 宿主当年是**发送器组件自己 expose** 这两个（`ChatMessageSender.vue:88-93`）；模块里它们在逻辑 hook 里。
     * 先建空 ref、建完 `sender` 立刻填（两者都是懒调用 ⇒ 顺序安全）。
     */
    const draftSenderRef = ref<ImDraftSenderExpose>()
    const draft = useImDraft({
      runtime,
      senderRef: draftSenderRef,
      refMessages,
      /**
       * 指令芯片的还原工厂：**用模块自己那份**（芯片形状只在一处定义）。
       * 宿主想换芯片样子走 `instructionChip` 插槽；想换**工厂**（如自定义 metadata）才需要新契约。
       */
      restoreInstructionSlot: (block: RestoreInstructionBlock) =>
        sender.createInstructionSlot(
          {id: block.value?.id, value: block.value?.value ?? '', metadata: {slotPrefix: block.prefix}},
          {location: 0, prefix: block.prefix, keyword: '', dataSource: []},
          block.id,
        ) as SlotConfigType,
    })
    const sender = useImSender({
      runtime,
      list: props.list,
      conversations: props.conversations,
      draft,
      senderRef,
      refMessages,
    })
    draftSenderRef.value = {
      createFilesSlot: sender.createFilesSlot,
      getSlotConfigValue: sender.getSlotConfigValue,
    }

    /** 输入框占位：按会话状态给（宿主 `ChatView.vue:66-76` 同款顺序） */
    const placeholder = computed(() => {
      const status = activeConversation.value?.status
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.EXIST)) {
        return locale.value.placeholderExitRoom
      }
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.REMOVE)) {
        return locale.value.placeholderRoomRemove
      }
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.DISBAND)) {
        return locale.value.placeholderDisbandRoom
      }
      return locale.value.placeholder
    })
    /** 只有 `ENABLED` 才可输入（宿主同款判据） */
    const senderDisabled = computed(
      () =>
        !isEnumValue(
          activeConversation.value?.status,
          MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED,
        ),
    )

    /**
     * 气泡外观：**包内默认**（宿主那份 `DEFAULT_BUBBLE_LIST_ROLE` 的 `classes` 是宿主 Tailwind 类，
     * 进不了包）⇒ 同样的形状 + 包内 token 化的类。
     */
    const role = computed(
      () =>
        ({
          user: {
            variant: 'filled',
            placement: 'end',
            shape: 'corner',
            classes: {content: subClass('role-user-content')},
          },
          ai: {variant: 'filled', placement: 'start', shape: 'corner'},
          system: {
            variant: 'outlined',
            shape: 'round',
            classes: {content: subClass('role-system-content')},
          },
          divider: {
            dividerProps: {
              plain: true,
              dashed: true,
              size: 'small',
              classes: {content: subClass('divider'), root: subClass('divider')},
            },
          },
        }) as RoleType,
    )

    /**
     * 视图控制器（core `ChatViewControllerBase`）：`l-im` 的分页/激活路径通过它滚动、写回草稿。
     * 草稿三项**已经是真实现**（`useImDraft` 建好之后才能建它）。
     */
    const controller: ChatViewControllerBase = {
      jumpToMessage: (key, flashPending, block, behavior) =>
        bubbleListRef.value?.jumpToMessage(key, flashPending, block, behavior),
      scrollTo: (options) => bubbleListRef.value?.scrollTo(options),
      getSenderSlotConfigValue: () => sender.getSlotConfigValue(),
      persistSenderDraft: () => draft.persistSenderDraft(),
      hydrateSenderDraft: () => draft.hydrateSenderDraft(),
    }
    view.value = controller
    onUnmounted(() => {
      if (view.value === controller) {
        view.value = undefined
      }
    })

    /** 内容块（宿主 `ChatMessageBubbleContent.vue` 的 TSX 版；文字块由外壳直接出） */
    function renderBlock(block: Record<string, unknown>): VNodeChild {
      const slotKind = block.slotKind as string | undefined
      if (block.type === 'custom' && slotKind === 'files') {
        return <AttachmentUpload preview value={block.files as never} />
      }
      if (block.type === 'custom' && slotKind === 'instruction') {
        const value = block.value as {value?: string} | undefined
        return (
          <Tag>
            {block.prefix === '@' ? (hostSlots.icon?.({type: 'instruction'}) ?? null) : null}
            {value?.value}
          </Tag>
        )
      }
      if (block.type === 'custom' && slotKind === 'undo') {
        return <Typography.Text delete type="secondary">{String(block.value ?? '')}</Typography.Text>
      }
      if (block.type === 'custom' && slotKind === 'reference') {
        return (
          <Flex vertical gap="small">
            {((block.value ?? []) as UserChatMessageResponseBody[]).map((message) => (
              <MessageReference
                key={message.id}
                message={message}
                self={port.getPrincipal()}
                variant="outlined"
                onClick={() => bubbleListRef.value?.jumpToMessage(String(message.id))}
              />
            ))}
          </Flex>
        )
      }
      // `call` ⇒ Step 4（通话）
      return null
    }

    /** 引用区（发送器 `#header`）：选中/还原引用后显示，可关掉（宿主同款） */
    function renderReferences() {
      if (refMessages.value.length <= 0) {
        return null
      }
      return (
        <Flex wrap gap="small" class={subClass('reference')}>
          {refMessages.value.map((message) => (
            <MessageReference
              key={message.id}
              message={message}
              self={port.getPrincipal()}
              variant="outlined"
              closable
              onClick={() => bubbleListRef.value?.jumpToMessage(String(message.id))}
              onClose={() => {
                refMessages.value = refMessages.value.filter((item) => item.id !== message.id)
              }}
            />
          ))}
        </Flex>
      )
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const conversation = activeConversation.value
      return (
        <Flex {...rest} class={classNames(rootClass(), attrClass)} style={attrStyle as never}>
          {conversation ? (
            <Flex vertical class={subClass('body')}>
              <BubbleList
                ref={bubbleListRef}
                session={session.value}
                collectVisible
                renderItem={bubble.buildItems}
                role={role.value}
                onLoadPage={(tag: 'next' | 'previous') => void props.list.loadMore(tag)}
                onReloadLastPage={() => void props.list.activate(conversation, undefined, true)}
                onVisibleItems={(items: ChatBubbleItem[]) => bubble.onVisibleItems(items)}
                v-slots={{
                  avatar: ({item}: {item: ChatBubbleItem}) =>
                    hostSlots.avatar?.({item: item as never, conversation}) ?? null,
                  header: ({item}: {item: ChatBubbleItem}) =>
                    hostSlots.senderName?.({item: item as never, conversation}) ?? null,
                  contentRender: ({content}: {content: unknown}) => (
                    <SenderSlotBubbleContent
                      content={content as never[]}
                      v-slots={{
                        renderBlock: ({block}: {block: Record<string, unknown>}) =>
                          renderBlock(block),
                      }}
                    />
                  ),
                }}
              />
              <Flex vertical class={subClass('sender')}>
                <InstructionSender
                  ref={senderRef}
                  slotConfig={draftSlots.value}
                  placeholder={placeholder.value}
                  sending={sender.isSending.value}
                  disabled={senderDisabled.value}
                  // ⚠️ `@` 提名：候选数据 + 过滤 + 选中后的插入/芯片归**模块**（下一片）；
                  //    这里先给空 map ⇒ 打 `@` 不出候选（见文件头台账 ①）
                  instructionMap={{}}
                  onFilterDataSource={(_keyword, dataSource) => dataSource}
                  senderInsertInstruction={(handle, block, measure) =>
                    handle.insert(
                      [block, {type: 'text', value: ' '}],
                      'cursor',
                      measure.prefix + measure.keyword,
                    )
                  }
                  createInstructionSlot={(option, measure) =>
                    sender.createInstructionSlot(option, measure)
                  }
                  onPasteFile={(files: FileList) => sender.onPasteFiles(files)}
                  onSubmit={(value: string, slotConfig?: object[]) =>
                    void sender.submit(value, slotConfig as SlotConfigType[] | undefined)
                  }
                  onChange={() => draft.schedulePersist()}
                  v-slots={{
                    /**
                     * 引用区：**有引用时才给这个槽** —— 宿主是 `v-if="refMessages.length > 0"`；
                     * 常驻会让 x 渲染一个空 header 容器（多出一段内边距）。
                     */
                    header: refMessages.value.length > 0 ? renderReferences : undefined,
                    leftExtra: () => (
                      /**
                       * `type="text"` / `disabled` 是**透传 attrs**（宿主模板当年就是这么传的；
                       * `EmojiButton` 内部把 `rest` 原样铺给触发按钮）—— TSX 里组件 props 类型没声明它们，
                       * 只能这样标（与 `style={attrStyle as never}` 同一手法）。
                       */
                      <EmojiButton
                        {...({type: 'text', disabled: sender.isSending.value} as object)}
                        onSelected={sender.onSelectedEmoji}
                      />
                    ),
                  }}
                />
              </Flex>
            </Flex>
          ) : (
            <Flex vertical justify="center" align="center" class={subClass('empty')}>
              <Empty />
            </Flex>
          )}
        </Flex>
      )
    }
  },
})

export type ChatViewInstance = InstanceType<typeof ChatView>
