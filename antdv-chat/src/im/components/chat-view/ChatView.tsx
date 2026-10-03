import {computed, defineComponent, onUnmounted, type PropType, ref, type VNodeChild, watch} from 'vue'
import {Dropdown, Empty, Flex, Space, Tooltip, Typography} from 'antdv-next'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AttachmentUpload} from '@loncra/antdv-pro'
import {isEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import type {UserChatMessageResponseBody, UserChatParticipantEntity} from '@loncra/client/message'
import {
  CHAT_EVERYONE_ID,
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
} from '@loncra/client/message'
import {
  CHAT_ROLE,
  isInstructionSlot,
  type ChatBubbleItem,
  type ChatViewControllerBase,
} from '@loncra/chat-core'
import {BubbleList, type BubbleListExpose} from '../../../bubble-list'
import {type RestoreInstructionBlock} from '../../../_util/draft'
import {SLOT_PLACEHOLDER} from '../../../_util/draft/slots'
import {useLocale} from '../../../_util/useLocale'
import EmojiButton from '../../../emoji-button'
import InstructionSender, {
  type InstructionItem,
  type InstructionMeasure,
  type InstructionSenderExpose,
  type InstructionSenderHandle,
} from '../../../instruction-sender'
import {SenderSlotBubbleContent} from '../../../sender-shell'
import {MessageReference} from '../reference/MessageReference'
import {useImBubbleList} from '../../useImBubbleList'
import {useImChat} from '../../useImChatContext'
import type {ImConversationsApi} from '../../useImConversations'
import {type ImDraftSenderExpose, useImDraft} from '../../useImDraft'
import type {ImMessageListApi} from '../../useImMessageList'
import {renderInstructionChip} from '../../instructionChip'
import {focusAfterSlot, useImSender} from '../../useImSender'
import {useImBubbleMenu} from './useImBubbleMenu'
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
 * ⚠️ **台账（未做，逐条有去处）**：
 * 1. ~~`@` 提名~~ ⇒ **2026-10-03 已接**（`instructionMap` + `onFilterDataSource` +
 *    `onSenderInsertInstruction` + `stripIndividualMentions` / `removeTrailingTrigger`，
 *    逐行对应宿主 `ChatView.vue:56-64 / 107-202`）；
 * 2. **`/` 指令**：⚠️ **宿主今天只有 `@`**（`instructionMap` 只给了 `'@'` 一个键）⇒
 *    按"移植期不加自造物"的规矩，**先不做**，要不要做等你定（设计稿里有 `/`）；
 * 3. ~~气泡右键菜单（引用 / 撤回 + 倒计时）与"撤回后重编辑"~~ ⇒ **2026-10-03 已接**（3-C3：
 *    `useImBubbleMenu` + 本文件 `Dropdown` 包裹 + 撤回块里的"重新编辑" → `useImSender.reedit`）；
 * 4. **`extra` 插槽**（私聊"已读眼睛" / 群聊已读表）⇒ 依赖宿主 icon-font 与 `ChatMessageReadTable`；
 * 5. **`call` / `reference` 块中的 `call`** ⇒ Step 4（通话）；`reference` 块已接（本片）；
 * 6. **跳转闪烁高亮**（宿主 `rootClass: 'bg-flash'`）⇒ 待确认 x 的渲染项类型是否吃 `rootClass`。
 */
/**
 * 指令芯片后面**必须跟一个"末尾仍是文本"的尾巴**（和文件芯片用 `SLOT_PLACEHOLDER` 是同一件事）。
 *
 * 机制：`prosemirror-view` 的 `addTextblockHacks` 判定"文本块最后一个子节点**不是文本节点**"就补
 * 一个 `<br class="ProseMirror-trailingBreak">` ⇒ **光标被顶到下一行**。芯片是行内原子 ⇒ 必须有它。
 *
 * ⚠️ 尾巴**只放零宽空格，不带普通空格**：插完芯片会把光标放回**芯片之后、尾巴之前**
 * （见 `focusAfterSlot`）⇒ 用户接着打字是插在**尾巴前面**的 ⇒ 尾巴会留在消息末尾 ⇒
 * 若这里带普通空格，就会把那个空格**发给后端**（零宽空格在落盘 / `submit` 时会被摘掉，不留脏数据）。
 *
 * ⚠️ 与宿主 `ChatView.vue:167/172` 的差异：宿主只插了 `{type:'text', value:' '}`（普通空格）。
 */
const INSTRUCTION_TAIL = SLOT_PLACEHOLDER

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
      /**
       * 发送成功后**强制**把 `slot-config` 换成新数组（身份变化 ⇒ x 重建空文档）——
       * 这是"一定能清空"的那一路；`clear()` 那条受 x 的锁影响，只当补充。
       */
      onSent: () => {
        draftSlots.value = []
      },
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
     * 气泡右键菜单（引用 / 撤回 + 倒计时）。逻辑在 hook 里，这里只把"引用条状态 + 样式类"给它。
     */
    const bubbleMenu = useImBubbleMenu({
      runtime,
      refMessages,
      countdownClass: subClass('menu-countdown'),
    })

    /**
     * `@` 候选数据（**逐行对应宿主 `ChatView.vue:56-64**）：房间成员（**排除自己**）
     * + 末尾那条"所有人"。
     *
     * ⚠️ 与宿主的差异（唯一一处）：宿主用 `principalStore.isCurrentPrincipal(d.principal)`，
     * 模块用 `port.getPrincipal()`（模块不碰宿主 store，见契约）。
     * `CHAT_EVERYONE_ID` **不在模块里另定义** —— client 已经导出（`@loncra/client/message`，
     * 宿主 `@/constants` 就是 re-export 它）。
     */
    const instructionMap = computed(() => ({
      '@': [
        ...(session.value.participants ?? [])
          .filter((participant) => participant.principal !== port.getPrincipal())
          .map((participant) => ({
            id: participant.principal,
            value: AuthServerService.getPrincipalNameByUserDetails(participant.metadata?.details),
            metadata: participant as unknown as Record<string, unknown>,
          })),
        {id: CHAT_EVERYONE_ID, value: locale.value.everyone},
      ],
    }))

    /** 选"所有人"时：去掉所有单人 `@` 芯片，保留文本/附件等（宿主 `ChatView.vue:107-116` 逐行对应） */
    function stripIndividualMentions(slots: SlotConfigType[]): SlotConfigType[] {
      return slots.filter((slot) => !isInstructionSlot(slot))
    }

    /**
     * 抹掉末尾那个触发词（如 `@张`）；抹成空就整块删掉（宿主 `ChatView.vue:118-142` 逐行对应）。
     * 只从**最后一个 text 槽**往前找一次。
     */
    function removeTrailingTrigger(slots: SlotConfigType[], trigger: string): SlotConfigType[] {
      if (!trigger) {
        return slots
      }
      const result = slots.map((slot) => ({...slot}))
      for (let i = result.length - 1; i >= 0; i--) {
        const slot = result[i] as unknown as {type?: string; value?: unknown}
        if (slot?.type !== 'text' || typeof slot.value !== 'string') {
          continue
        }
        if (!slot.value.endsWith(trigger)) {
          break
        }
        const next = slot.value.slice(0, -trigger.length)
        if (next === '') {
          result.splice(i, 1)
        } else {
          result[i] = {...slot, value: next} as unknown as SlotConfigType
        }
        break
      }
      return result
    }

    /**
     * 选中候选后怎么插（宿主 `ChatView.vue:144-173` 逐行对应）。
     * "所有人"那条特殊：先摘掉已有单人提名、抹掉触发词、清空编辑器，再**一次性**写
     * `[所有人, ' ', ...其余]` 到行首（不传 `replaceCharacters`）；其余候选是普通插入。
     */
    function onSenderInsertInstruction(
      handle: InstructionSenderHandle,
      block: object,
      measure: InstructionMeasure,
    ): void {
      const slot = block as unknown as {
        type: 'custom'
        key: string
        props: {
          slotKind: 'instruction'
          defaultValue: {id?: string; value?: string}
          prefix: string
        }
      }
      if (slot.props.prefix === '@' && slot.props.defaultValue.id === CHAT_EVERYONE_ID) {
        const trigger = measure.prefix + measure.keyword
        const kept = stripIndividualMentions(sender.getSlotConfigValue())
        const cleaned = removeTrailingTrigger(kept, trigger)
        handle.clear()
        handle.insert(
          [block as SlotConfigType, {type: 'text', value: INSTRUCTION_TAIL}, ...cleaned],
          'start',
        )
        return
      }
      handle.insert(
        [block as SlotConfigType, {type: 'text', value: INSTRUCTION_TAIL}],
        'cursor',
        measure.prefix + measure.keyword,
      )
      // 光标放回芯片之后（占位符之前）⇒ 一次 Backspace 就是"取消这个 @"（见 `focusAfterSlot`）
      focusAfterSlot((slot as {key?: string}).key)
    }

    /**
     * `@` 候选过滤（宿主 `ChatView.vue:175-202` 逐行对应）：
     * 已经提名过的不再出现；已经提名了"所有人"就整个收起来；
     * "所有人"永远排第一，其余按**显示名**匹配关键字。
     *
     * ⚠️ 与宿主的差异：宿主读 `senderRef.value.getSlotConfigValue()`（组件 expose），
     * 模块读 `useImSender` 的同名 API —— 同一个值（模块的发送器逻辑在 hook 里）。
     */
    function onFilterDataSource(
      keyword: string,
      dataSource: InstructionItem[],
      prefix: string,
    ): InstructionItem[] {
      if (prefix !== '@') {
        return dataSource
      }
      const existIds = sender
        .getSlotConfigValue()
        .filter((slot) => slot.type === 'custom')
        .filter(
          (slot) =>
            (slot as unknown as {props?: {slotKind?: string}}).props?.slotKind === 'instruction',
        )
        .map(
          (slot) =>
            (slot as unknown as {props?: {defaultValue?: {id?: string}}}).props?.defaultValue?.id,
        )
      if (existIds.includes(CHAT_EVERYONE_ID)) {
        return []
      }
      const notExist = dataSource.filter((item) => !existIds.includes(item.id))
      if (notExist.length === 1 && notExist.at(-1)?.id === CHAT_EVERYONE_ID) {
        return []
      }
      return [
        ...notExist
          .filter((item) => item.id === CHAT_EVERYONE_ID)
          .filter((item) => (keyword === '' ? item : item.value.includes(keyword))),
        ...notExist
          .filter(
            (item) =>
              (item.metadata as unknown as UserChatParticipantEntity | undefined)?.metadata
                ?.details,
          )
          .filter((item) =>
            keyword === ''
              ? item
              : AuthServerService.getPrincipalNameByUserDetails(
                  (item.metadata as unknown as UserChatParticipantEntity).metadata.details,
                ).includes(keyword),
          ),
      ]
    }

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
    function renderBlock(block: Record<string, unknown>, item?: ChatBubbleItem): VNodeChild {
      const slotKind = block.slotKind as string | undefined
      if (block.type === 'custom' && slotKind === 'files') {
        return <AttachmentUpload preview value={block.files as never} />
      }
      if (block.type === 'custom' && slotKind === 'instruction') {
        const value = block.value as {id?: string; value?: string} | undefined
        /**
         * 与编辑器里的芯片**共用**同一处渲染（`renderInstructionChip`，
         * 宿主原话："芯片形状只有这一处定义"）；宿主想整块换 ⇒ `#instructionChip`。
         */
        return renderInstructionChip(
          {key: String(block.id ?? ''), prefix: String(block.prefix ?? ''), value: value ?? {}},
          hostSlots.instructionChip,
        )
      }
      if (block.type === 'custom' && slotKind === 'undo') {
        /**
         * 撤回块（宿主 `ChatBubbleList.vue:185-204` 的 `#undo` 槽，逐条对应）：
         * **我撤回的** ⇒ "您已撤回此消息" + **"重新编辑"**（把撤回前的内容拿回草稿）；
         * 别人撤回的 ⇒ 原样文案（`block.value` = "该消息已撤销"）。
         */
        const data = item?.data as UserChatMessageResponseBody | undefined
        const mine = !!data && data.principal === port.getPrincipal()
        return (
          <Tooltip title={block.tooltip as string | undefined}>
            {mine ? (
              <Space>
                <Typography.Text delete type="secondary">{locale.value.selfUndo}</Typography.Text>
                <Typography.Link
                  onClick={() => {
                    // 撤回时写进 `metadata.oldContent` 的那份旧内容（`useImMessageList.markUndone`）
                    const old = (data.metadata as {oldContent?: Record<string, unknown>[]} | undefined)
                      ?.oldContent
                    if (old?.length) {
                      sender.reedit(old)
                    }
                  }}
                >
                  {locale.value.reedit}
                </Typography.Link>
              </Space>
            ) : (
              <Typography.Text delete type="secondary">{String(block.value ?? '')}</Typography.Text>
            )}
          </Tooltip>
        )
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
                  contentRender: ({
                    item,
                    role,
                    content,
                  }: {
                    item?: ChatBubbleItem
                    role?: string
                    content: unknown
                  }) => {
                    const body = (
                      <SenderSlotBubbleContent
                        content={content as never[]}
                        v-slots={{
                          renderBlock: ({block}: {block: Record<string, unknown>}) =>
                            renderBlock(block, item),
                        }}
                      />
                    )
                    /**
                     * 右键菜单只在**真人 / AI 的、带实体的**气泡上出
                     * （宿主 `ChatBubbleList.vue:173-208`：`v-if="item.data && [USER, AI].includes(role)"`）。
                     */
                    if (!item?.data || (role !== CHAT_ROLE.USER && role !== CHAT_ROLE.AI)) {
                      return body
                    }
                    return (
                      <Dropdown
                        menu={{items: bubbleMenu.createMessageMenu(item, role)}}
                        trigger={['contextmenu']}
                        onMenuClick={(event: {key: string | number}) =>
                          bubbleMenu.onMessageMenuClick(event, item)
                        }
                      >
                        <div class={subClass('menu-anchor')}>{body}</div>
                      </Dropdown>
                    )
                  },
                }}
              />
              <Flex vertical class={subClass('sender')}>
                <InstructionSender
                  ref={senderRef}
                  slotConfig={draftSlots.value}
                  placeholder={placeholder.value}
                  sending={sender.isSending.value}
                  disabled={senderDisabled.value}
                  // `@` 提名：候选数据 + 过滤 + 选中后的插入（宿主 `ChatView.vue:56-64 / 107-202`）
                  instructionMap={instructionMap.value}
                  onFilterDataSource={(keyword, dataSource, prefix) =>
                    onFilterDataSource(keyword, dataSource, prefix)
                  }
                  senderInsertInstruction={(handle, block, measure) =>
                    onSenderInsertInstruction(handle, block, measure)
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
