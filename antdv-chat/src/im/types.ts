import type {VNodeChild} from 'vue'
import type {ChatBubbleRenderItem, ImEvent, ImHostPort} from '@loncra/chat-core'
import type {
  UserChatConversationResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
} from '@loncra/client/message'
import type {SystemUserContactItem} from '@loncra/antdv-pro'

/**
 * `l-im`（IM 模块入口组件）的对外形状：**props / slots / emits / expose**。
 *
 * 三条通道（2026-10-01 用户定，取代早期"一个 adapter 装下所有东西"）：
 * - **props**：宿主 → 模块（数据 + "只有宿主才能给的能力"）；
 * - **slots**：宿主 → 模块（**所有外观/自定义样式**；不搞 config-provider 让宿主填"返回 VNode 的函数"）；
 * - **emits**：模块 → 宿主（**领域事实**，单一出口 `@message`；宿主想干嘛就干嘛）；
 * - 另外 **expose**：只在"**能力在模块、触发/外观在宿主**"时才需要（如宿主渲染的"跳到未读锚点"按钮）。
 *
 * ⚠️ 模块**不认识**：路由 / 系统通知 / 图标字体 / 主题 / 环境配置 / 弹窗挂载点
 * （判据见模块设计 §二越权清单："这件事是不是'聊天'本身？"）。
 */

/*
 * **渲染项类型不在这里**：已归 `@loncra/chat-core` 的 `ChatBubbleRenderItem`
 * （2026-10-03 从 `ImBubbleItem` 上提 —— 两域同形：宿主 Agent 侧一直用的 `ChatBubbleRenderItem` 就是它
 * ⇒ 放 `im/` 会让 Agent 再抄一份）。下面插槽里的 `item` 就是它。
 */

/** 插槽（宿主在模板里写 `<template #avatar="{item}">…`） */
export interface ImSlots {
  /** 头像：气泡 / 会话列表 / 通话共用；`size` 是模块给的建议值 */
  avatar(props: {
    item?: ChatBubbleRenderItem
    conversation?: UserChatConversationResponseBody
    size?: 'small' | 'medium' | 'large'
  }): VNodeChild
  /**
   * 气泡表头"谁发的" —— **怎么由 `participant.metadata.details` 解出名字由宿主决定**。
   *
   * ⚠️ `conversation` 是给宿主判"**要不要出表头**"用的（2026-10-03 用户拍定：**表头只有群聊才有**
   * —— 单聊整块不出，AI/我发的都不出）—— 与 `avatar` 同形：模块只给数据，不给结论。
   */
  senderName(props: {
    item: ChatBubbleRenderItem
    conversation?: UserChatConversationResponseBody
  }): VNodeChild
  /** 参与者徽标（群主 / 管理员…） */
  participantBadge(props: {participant: UserChatParticipantEntity}): VNodeChild
  /** 图标（**可选覆盖**）：模块默认用 `antdv-next` 自带图标；宿主想接自己的 icon-font 时才用 */
  icon(props: {type: string}): VNodeChild
  /** 指令芯片（发送器里的 `@某人` / `/skill` 芯片） */
  instructionChip(props: {
    slot: {key?: string; prefix: string; value: {id: string; value: string}}
  }): VNodeChild
  /** 气泡列表下方（宿主放"跳到未读锚点"这类按钮；配合 expose 的 `showReadableAnchor` / `toReadableAnchor()`） */
  bubbleListAfter(): VNodeChild
  /** 替换模块自带的"房间设置"（不传 ⇒ 用模块自带的抽屉方案） */
  roomSettings(props: {conversation: UserChatConversationResponseBody}): VNodeChild
}

export interface ImProps {
  /** 宿主给的能力：`subscribe`（socket 在宿主）+ `getPrincipal`（"我是谁"） */
  port: ImHostPort
  /** 联系人数据 —— **宿主按登录者类型决定查什么**（企业用户 ⇒ 本企业用户 + 客服…）；模块只负责渲染与选择 */
  contacts?: SystemUserContactItem[]
  /** 受控的当前会话（如来自路由 query）；不传则模块内部自己管 */
  activeKey?: string
  /** 受控的"要跳到哪条消息"（配合 `activeKey`） */
  activeMessageId?: number
  /** 通话 UI 的挂载点（挂在哪里由宿主决定） */
  callContainer?: HTMLElement
  /**
   * **相对时间文案**（宿主给：通常是 `(t) => globalProperties.$dayjs(t).fromNow()`）。
   *
   * ⚠️ 2026-10-03 用户拍定走**方案 C**：模块**不引 dayjs**、也不去对齐语言包 ——
   * 这句文案（会话列表右侧、时间分隔条、撤回提示的 tooltip）**归宿主**（它有现成的 `$dayjs` + 语言配置）。
   * **必填**：不给这些位置就没有时间文字 —— 与其静默留白，不如让宿主显式给。
   */
  formatRelativeTime: (time: number) => string
}

export interface ImEmits {
  /** 领域事实（单一出口）：`message.received` / `conversation.activated` / `call.invited` … */
  message: [event: ImEvent]
}

/**
 * 只在"**能力在模块、触发/外观在宿主**"时暴露；其余优先用 props（受控）或事件。
 * （例：**不暴露 `activate()`** —— 宿主用 `activeKey` 受控即可。）
 */
export interface ImExpose {
  /** 跳到"未读锚点"（宿主在 `#bubbleListAfter` 里渲染的按钮触发它） */
  toReadableAnchor(): void
  /** 是否该显示那个按钮（宿主渲染按钮时用它做 `v-if`） */
  showReadableAnchor: boolean
  /** 宿主用 `#roomSettings` 自己渲染"历史消息"入口时需要 */
  jumpToHistory(message: UserChatMessageResponseBody): void
  /** 手动刷新会话列表（如 socket 重连后；平时不需要——模块挂载时自己拉一次） */
  reload(): void
}
