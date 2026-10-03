export interface EmojiButtonLocale {
  smileys_emotion: string
  animals_nature: string
  food_drink: string
  travel_places: string
  activities: string
  objects: string
}

/**
 * 气泡列表里**合成项**的文案（模块内部提示，宿主不需要管）。
 *
 * ⚠️ 挂 `BubbleList`（**渲染它们**的组件）而不是域（`Im`）：**两域共用同一句**
 * —— Agent 的"没有更多了"与 IM 就是同一句 ⇒ 按"谁渲染"归位，不按"谁触发"归位。
 */
export interface BubbleListLocale {
  /** 没有更多消息时的提示 */
  noMore: string
  /** 跳到"最早未读"时插在它前面的系统提示 */
  readableSystemMessage: string
  /**
   * 撤回块文案（宿主 `chat.view.undo.messageValue`）—— **别人撤回的**显示它；
   * 我撤回的走 `ChatView.selfUndo`（渲染侧现换，所以不写进块的 `value`）。
   */
  undoMessageValue: string
  /** 撤回块的 tooltip（宿主 `chat.view.undo.time`；`{time}` 由调用方填**相对时间**） */
  undoTime: string
}

/**
 * 会话列表（左栏）的文案。
 *
 * ⚠️ 全部**照抄宿主** `i18n/locales/*.ts`（`chat.conversation.draft` / `chat.conversation.mention` /
 * `chat.view.selfUndo` / `chat.view.undo.messageValue` / `attachment.type.*`）—— 迁进来是为了让
 * "预览文案"成为**纯函数**（宿主那份要 `i18n.global` + `principalStore` + `AuthServerService`）。
 */
export interface ConversationListLocale {
  /** 草稿预览前缀（宿主 `chat.conversation.draft`） */
  draft: string
  /** "有人提到我"的预览（宿主 `chat.conversation.mention`，`{count}` 占位） */
  mentionCount: string
  /** 我撤回的预览（宿主 `chat.view.selfUndo`） */
  selfUndo: string
  /** 别人撤回的预览（宿主 `chat.view.undo.messageValue`） */
  othersUndo: string
  /** 预览里的附件类型标签（宿主 `attachment.type.*`） */
  fileImage: string
  fileVideo: string
  fileAudio: string
  fileUnknown: string
}

/**
 * 消息区（右栏）的文案。
 *
 * ⚠️ 全部**照抄宿主** `i18n/locales/*.ts`（`common.me` / `chat.view.placeholder.*`，2026-10-03 迁入）。
 */
export interface ChatViewLocale {
  /** 引用条里"我发的"（宿主 `common.me`） */
  me: string
  /** `@` 候选里最后那条"所有人"（宿主 `chat.everyone`） */
  everyone: string
  /** 输入框默认占位（宿主 `chat.view.placeholder.text`） */
  placeholder: string
  /** 会话状态占位：我已退出该群（`chat.view.placeholder.exitRoom`） */
  placeholderExitRoom: string
  /** 会话状态占位：我被移出该群（`roomRemove`） */
  placeholderRoomRemove: string
  /** 会话状态占位：该群已解散（`disbandRoom`） */
  placeholderDisbandRoom: string
  /** 右键菜单：引用（宿主 `chat.view.reference`） */
  reference: string
  /** 撤回块里"我撤回的"（宿主 `chat.view.selfUndo`） */
  selfUndo: string
  /** 撤回块里的"重新编辑"入口（宿主 `chat.view.reedit`） */
  reedit: string
  /** 撤回确认弹窗标题（宿主 `chat.view.undo.confirmTitle`） */
  undoConfirmTitle: string
  /** 撤回确认弹窗正文（宿主 `chat.view.undo.confirmContent`） */
  undoConfirmContent: string
  /** 撤回菜单项文案（宿主 `chat.view.undo.action`） */
  undoAction: string
  /** 撤回倒计时文案（宿主 `chat.view.undo.countdown`；`s` 是剩余秒数占位，由 `StatisticTimer` 填） */
  undoCountdown: string
}

export interface Locale {
  locale: string
  EmojiButton?: EmojiButtonLocale
  BubbleList?: BubbleListLocale
  ConversationList?: ConversationListLocale
  ChatView?: ChatViewLocale
}
