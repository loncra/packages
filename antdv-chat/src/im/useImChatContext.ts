import {computed, type ComputedRef, inject, type InjectionKey, provide, ref, type Ref} from 'vue'
import {
  type ActiveChatSession,
  type ChatViewControllerBase,
  createEmptySession,
  type ImEvent,
  type ImHostPort,
} from '@loncra/chat-core'
import type {UserChatConversationResponseBody, UserChatParticipantEntity,} from '@loncra/client/message'
import type {SystemUserContactItem} from '@loncra/antdv-pro'
import type {ImSlots} from './types'

/**
 * IM 模块**内部**的运行时上下文：`l-im` 在自己内部 `provide`，内部子组件/hook 用它。
 *
 * ⚠️ **宿主不接触它** —— 宿主只跟 `l-im` 的 props / slots / emits 打交道（三条通道）。
 *
 * 两条状态纪律（§1.6）：
 * 1. **会话实体是唯一真相**：`draft` / `name` / `pinned` / `muted` / `lastUserMessage` / `readableCount`
 *    只存在 `conversations` 这一份里；
 * 2. `activeKey` **只持身份**，实体靠 `activeConversation`（**派生态**）按 key 取 —— 任何地方都不复制实体。
 */
export interface ImRuntime {
  /** 宿主给的能力（socket 订阅 + "我是谁"） */
  port: ImHostPort
  /** 联系人（宿主按登录者类型给；模块只渲染与选择） */
  contacts: Ref<SystemUserContactItem[]>
  /** 会话实体列表 —— **唯一真相** */
  conversations: Ref<UserChatConversationResponseBody[]>
  /** 当前会话**身份**（只持 key） */
  activeKey: Ref<string | undefined>
  /** 当前会话实体（**派生态**：从列表按 key 取；取不到 = 列表没这条 ⇒ 需要刷新） */
  activeConversation: ComputedRef<UserChatConversationResponseBody | undefined>
  /** 当前会话的**渲染容器**（core `ActiveChatSession` 基座 + IM 自有运行态，见 `ImSession`） */
  session: Ref<ImSession>
  /** 气泡列表实例（`l-im` 挂载后写入，供分页/锚点/滚动调用） */
  view: Ref<ChatViewControllerBase | undefined>
  /** 宿主插槽（`l-im` 原样透传给内部子组件） */
  slots: Readonly<ImSlots>
  /** 相对时间文案（宿主注入；模块不引 dayjs，见 `ImProps.formatRelativeTime`） */
  formatRelativeTime: (time: number) => string
  /** 把**领域事实**抛给宿主（`l-im` 的 `@message`；模块不做跳转/通知/埋点） */
  emit(event: ImEvent): void
}

/**
 * IM 自己的会话容器：core `ActiveChatSession` 基座 + **IM 自有的运行态**。
 *
 * ⚠️ 装的是**存储条目**（`ChatBubbleItem` = 业务体 + role）**不是** `ChatBubbleRenderItem`：
 * A1 之后 `content` 不是条目字段，而是渲染时由 `toBubbleContent` 现算的投影
 * ⇒ `ChatBubbleRenderItem`（带 `content`，在 `@loncra/chat-core`）是喂插槽的**渲染项**，不进这里。
 *
 * `ActiveChatSession` 的 `I` 这里**不写**（= 默认 `ChatBubbleItem`）：A1 之后两域的存储条目就是它，
 * 写出来没有信息量；等域的**块联合**（如 IM 的 `ChatContentBlock`）随域迁进包时，
 * 写成 `ActiveChatSession<ChatBubbleItem<ChatContentBlock>>` 才有意义。
 */
export interface ImSession extends ActiveChatSession {
  /** 房间参与者（群聊气泡"谁发的"、房间设置用） */
  participants?: UserChatParticipantEntity[]
  /** 正在跳"最早未读"（期间请求不带未读锚点，见 `useImMessageList` 的 `fetchPage`） */
  readableAnchorLoading?: boolean
}

/**
 * 空会话容器**不在这里**：已经上提到 `@loncra/chat-core` 的 `createEmptySession()`
 * （2026-10-03 —— Agent 复位列表用的是同一套口径，放 `im/` 会让它抄一份）。
 */

/** 模块内部注入键（`Symbol` 不会和宿主任何 key 撞） */
const IM_RUNTIME_KEY: InjectionKey<ImRuntime> = Symbol('ImRuntime')

export interface ProvideImChatOptions {
  port: ImHostPort
  contacts: Ref<SystemUserContactItem[]>
  slots: Readonly<ImSlots>
  emit(event: ImEvent): void
  /** `l-im` 从 props 透传（`ImProps.formatRelativeTime`） */
  formatRelativeTime: (time: number) => string
}

/**
 * 在 `l-im` 内部调用：建上下文并 `provide`。
 * 只负责"装起来"；列表/消息/草稿等行为在各自的 hook 里（本文件不做业务）。
 */
export function provideImChat(options: ProvideImChatOptions): ImRuntime {
  const conversations = ref<UserChatConversationResponseBody[]>([]) as Ref<
    UserChatConversationResponseBody[]
  >
  const activeKey = ref<string | undefined>(undefined)
  const session = ref<ImSession>(createEmptySession()) as Ref<ImSession>
  const view = ref<ChatViewControllerBase | undefined>(undefined)

  const activeConversation = computed(() =>
    activeKey.value == null
      ? undefined
      : conversations.value.find((c) => String(c.id) === String(activeKey.value)),
  )

  const runtime: ImRuntime = {
    port: options.port,
    contacts: options.contacts,
    conversations,
    activeKey,
    activeConversation,
    session,
    view,
    slots: options.slots,
    emit: options.emit,
    formatRelativeTime: options.formatRelativeTime,
  }
  provide(IM_RUNTIME_KEY, runtime)
  return runtime
}

/** 在内部子组件/hook 里取上下文 */
export function useImChat(): ImRuntime {
  const runtime = inject(IM_RUNTIME_KEY)
  if (!runtime) {
    throw new Error('useImChat() 必须在 <l-im> 的子树内调用（模块内部使用，宿主不需要）')
  }
  return runtime
}
