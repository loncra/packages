import {getEnumName, getEnumValue, isEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import type {
    UserChatConversationResponseBody,
    UserChatMessageEntity,
    UserChatMessageResponseBody,
} from '@loncra/client/message'
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ConversationListLocale} from '../locale'

/**
 * 会话列表的**两行预览**（迁自宿主 `utils/chatUtils.ts` 的 `getMessageContent` / `getDraftContent` /
 * `convertSlotConfigToText` / `slotConfigItemToText`，2026-10-03 Step 3）。
 *
 * 与宿主的差异只有两处，都是"把环境依赖换成包内依赖"（**行为不变**）：
 * 1. 名字解析走 **client** 的 `AuthServerService.getPrincipalNameByUserDetails` ——
 *    宿主 `utils/crudFormatters.ts:72-75` 的注释写着"IM 还在用它（宿主那层覆写），**等 IM 迁移时一起收**"，
 *    收的就是这里（client 版还多一个 `defaultValue` 兜底参数）；
 * 2. 文案由调用方传入（`useLocale('ConversationList')` 的切片）、"我是谁"由调用方传入
 *    ⇒ 本文件是**纯函数**，不再依赖 `i18n.global` / `principalStore`。
 */
export function messagePreview(
  lastUserMessage: UserChatMessageEntity | undefined,
  conversation: UserChatConversationResponseBody | undefined,
  self: string,
  locale: ConversationListLocale,
): string {
  if (!lastUserMessage) {
    return ''
  }
  let content = ''
  // 群聊：先补"[发送者]: "前缀（`participant` 只在 ResponseBody 上有 ⇒ 判一下在不在）
  if (
    conversation &&
    isEnumValue(conversation.room.type, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT) &&
    'participant' in lastUserMessage
  ) {
    const details = (lastUserMessage as UserChatMessageResponseBody).participant?.metadata?.details
    content += '[' + AuthServerService.getPrincipalNameByUserDetails(details) + ']: '
  }
  // 撤回：只说这一句（不再拼内容 —— 与宿主一致，之后 `return`）
  if (getEnumValue(lastUserMessage.undo)) {
    content += lastUserMessage.principal === self ? locale.selfUndo : locale.othersUndo
    return content
  }
  // 内容块（client 侧 `content: any` ⇒ 这里是宿主块联合的松视图，逐块取文本）
  for (const block of (lastUserMessage as UserChatMessageResponseBody).content ?? []) {
    if (block.type === 'text') {
      content += block.value || ''
    } else if (block.type === 'custom' && block.slotKind === 'files') {
      for (const file of block.files || []) {
        content += '[' + fileTypeLabel(file?.extraHeaders?.['Content-Type'] || '', locale) + ']'
      }
    } else if (block.type === 'custom' && block.slotKind === 'instruction') {
      content += '[' + block.prefix + block.value.value + ']'
    } else if (block.type === 'custom' && block.slotKind === 'call') {
      content += '[' + getEnumName(block.value) + ', ' + getEnumName(block.status) + ']'
    }
  }
  return content
}

/** 草稿预览：Sender 词槽 → 纯文本（宿主 `getDraftContent`） */
export function draftPreview(
  draft: SlotConfigType[] | undefined,
  locale: ConversationListLocale,
): string {
  if (!draft?.length) {
    return ''
  }
  return convertSlotConfigToText(draft, locale)
}

/** Sender 词槽 → 纯文本（宿主 `convertSlotConfigToText`） */
export function convertSlotConfigToText(
  slots: SlotConfigType[],
  locale: ConversationListLocale,
): string {
  let result = ''
  for (const slot of slots) {
    result += slotConfigItemToText(slot, locale)
  }
  return result
}

function slotConfigItemToText(slot: SlotConfigType, locale: ConversationListLocale): string {
  switch (slot.type) {
    case 'text':
      return slot.value ?? ''
    case 'input':
    case 'content': {
      const value = slot.props?.defaultValue
      if (value != null && value !== '') {
        return String(value)
      }
      const placeholder = slot.props?.placeholder
      return placeholder ? `[${placeholder}]` : ''
    }
    case 'select': {
      const value = slot.props?.defaultValue
      const options = slot.props?.options as Array<{label?: string; value?: string}> | undefined
      if (value != null && options?.length) {
        const matched = options.find((option) => option.value === value)
        if (matched?.label) {
          return String(matched.label)
        }
      }
      return value != null ? String(value) : ''
    }
    case 'tag':
      return slot.props?.label != null ? String(slot.props.label) : ''
    case 'custom':
      // 只处理"附件"这一种自定义槽（宿主 `customSlotToText` 同款）；其余（点名芯片等）预览不出字
      return customSlotToText(slot, locale)
  }
}

function customSlotToText(
  slot: Extract<SlotConfigType, {type: 'custom'}>,
  locale: ConversationListLocale,
): string {
  const props = slot.props as Record<string, unknown> | undefined
  if (props?.slotKind !== 'files') {
    return ''
  }
  const files = props.defaultValue as Array<{extraHeaders?: Record<string, string>}> | undefined
  if (!files?.length) {
    return ''
  }
  let result = ''
  for (const file of files) {
    result += '[' + fileTypeLabel(file?.extraHeaders?.['Content-Type'] || '', locale) + ']'
  }
  return result
}

/** 附件类型标签（宿主 `fileToTypeLabel`）—— 与 `messagePreview` 里同一套判断 */
function fileTypeLabel(contentType: string, locale: ConversationListLocale): string {
  if (contentType.startsWith('image/')) {
    return locale.fileImage
  }
  if (contentType.startsWith('video/')) {
    return locale.fileVideo
  }
  if (contentType.startsWith('audio/')) {
    return locale.fileAudio
  }
  return locale.fileUnknown
}
