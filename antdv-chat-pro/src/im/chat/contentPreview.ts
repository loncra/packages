import {h, type VNode} from 'vue'
import {Avatar, AvatarGroup} from 'antdv-next'
import type {AvatarSize} from 'antdv-next/dist/avatar/AvatarContext'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {UserAvatar} from '@loncra/antdv-pro'
import {AuthServerService, type PlatformUser, type UserMetadata} from '@loncra/client/auth'
import {AttachmentService, type FileObject, type ObjectWriteResult} from '@loncra/client/resource'
import type {UserChatConversationResponseBody, UserChatMessageEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale.ts'

export function createUserAvatarNode(
  user: UserMetadata | PlatformUser,
  size: AvatarSize = 'medium',
): VNode {
  return h(
    UserAvatar,
    {
      user,
      size,
    },
  )
}

export function createAvatarNode(
  cover: FileObject[],
  defaultLabel: string,
  size: AvatarSize = 'medium',
  groupClass: string = '',
): VNode {
  const avatars: VNode[] = []
  for (const c of cover) {
    avatars.push(
      h(Avatar, {src: AttachmentService.query(c.bucketName, c.objectName), size}),
    )
  }
  if (avatars.length > 0) {
    return h(
      AvatarGroup,
      {
        max: {count: 3},
        size,
        class: groupClass ? groupClass : undefined,
      },
      {default: () => avatars},
    )
  }
  return h(Avatar, {size}, {default: () => defaultLabel.substring(0, 1)})
}

export function useImContentPreview(options: {principal: () => string | undefined}) {
  const locale = useLocale('ImChat')

  function isCurrentPrincipal(principal: string): boolean {
    return principal != null && principal === options.principal()
  }

  function messagePreview(lastUserMessage: UserChatMessageEntity | undefined, conversation?: UserChatConversationResponseBody): string {
    if (!lastUserMessage) {
      return ''
    }
    let content = ''
    if (conversation && getEnumValue(conversation.room.type) === MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT && (lastUserMessage as unknown as {participant?: {metadata: {details: UserMetadata}}}).participant) {
      const p = (lastUserMessage as unknown as {participant: {metadata: {details: UserMetadata}}}).participant
      content += '[' + AuthServerService.getPrincipalNameByUserDetails(p.metadata.details) + ']: '
    }
    if (getEnumValue(lastUserMessage.undo)) {
      if (isCurrentPrincipal(lastUserMessage.principal)) {
        content += locale.value.selfUndo
      } else {
        content += locale.value.undoMessage
      }

      return content
    }
    for (const block of lastUserMessage.content) {
      if (block.type === 'text') {
        content += block.value || ''
      } else if (block.type === 'custom' && block.slotKind === 'files') {
        const labels: PreviewLabels = {
          previewImage: locale.value.previewImage,
          previewVideo: locale.value.previewVideo,
          previewAudio: locale.value.previewAudio,
          previewFile: locale.value.previewFile,
        }
        for (const file of block.value || []) {
          const contentType = file?.extraHeaders?.['Content-Type'] || ''
          if (contentType.startsWith('image/')) {
            content += labels.previewImage
          } else if (contentType.startsWith('video/')) {
            content += labels.previewVideo
          } else if (contentType.startsWith('audio/')) {
            content += labels.previewAudio
          } else {
            content += labels.previewFile
          }
        }
      } else if (block.type === 'custom' && block.slotKind === 'instruction') {
        content += '[' + block.prefix + block.value.value + ']'
      } else if (block.type === 'custom' && block.slotKind === 'call') {
        content += '[' + getEnumName(block.value) + ', ' + getEnumName(block.status) + ']'
      }
    }
    return content
  }

  function draftPreview(draft: SlotConfigType[] | undefined): string {
    if (!draft?.length) {
      return ''
    }
    const labels: PreviewLabels = {
      previewImage: locale.value.previewImage,
      previewVideo: locale.value.previewVideo,
      previewAudio: locale.value.previewAudio,
      previewFile: locale.value.previewFile,
    }
    return convertSlotConfigToText(draft, labels)
  }

  return {messagePreview, draftPreview}
}

export function convertSlotConfigToText(slots: SlotConfigType[], labels: PreviewLabels): string {
  let result = ''
  for (const slot of slots) {
    result += slotConfigItemToText(slot, labels)
  }
  return result
}

function slotConfigItemToText(slot: SlotConfigType, labels: PreviewLabels): string {
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
        const matched = options.find((o) => o.value === value)
        if (matched?.label) {
          return String(matched.label)
        }
      }
      return value != null ? String(value) : ''
    }
    case 'tag':
      return slot.props?.label != null ? String(slot.props.label) : ''
    case 'custom':
      return customSlotToText(slot, labels)
  }
}

function customSlotToText(slot: Extract<SlotConfigType, {type: 'custom'}>, labels: PreviewLabels): string {
  const props = slot.props as Record<string, unknown> | undefined
  const slotKind = props?.slotKind
  if (slotKind === 'files') {
    const files = props?.defaultValue as UploadFile<ObjectWriteResult>[] | undefined
    return filesToTypeLabels(files, labels)
  }
  if (slotKind === 'instruction') {
    const defaultValue = props?.defaultValue as {value?: unknown} | undefined
    const prefix = typeof props?.prefix === 'string' ? props.prefix : ''
    const text = defaultValue?.value == null ? '' : String(defaultValue.value)
    return prefix + text
  }
  return ''
}

interface PreviewLabels {
  previewImage: string
  previewVideo: string
  previewAudio: string
  previewFile: string
}

function filesToTypeLabels(
  files: Array<ObjectWriteResult | UploadFile<ObjectWriteResult>> | undefined,
  labels: PreviewLabels,
): string {
  if (!files?.length) {
    return ''
  }
  let result = ''
  for (const file of files) {
    result += fileToTypeLabel(file, labels)
  }
  return result
}

function fileToTypeLabel(
  file: ObjectWriteResult | UploadFile<ObjectWriteResult> | undefined,
  labels: PreviewLabels,
): string {
  const contentType =
    (file as ObjectWriteResult)?.extraHeaders?.['Content-Type'] ??
    (file as UploadFile<ObjectWriteResult>)?.type ??
    (file as UploadFile<ObjectWriteResult>)?.originFileObj?.type ??
    ''
  if (contentType.startsWith('image/')) {
    return labels.previewImage
  }
  if (contentType.startsWith('video/')) {
    return labels.previewVideo
  }
  if (contentType.startsWith('audio/')) {
    return labels.previewAudio
  }
  return labels.previewFile
}
