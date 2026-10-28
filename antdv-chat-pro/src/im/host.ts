import type {Ref} from 'vue'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {IdValueMetadata, TimeProperties} from '@loncra/client/commons'
import type {UserChatConversationResponseBody} from '@loncra/client/message'

export interface ImHost {
  self: PlatformUser | (UserMetadata & {systemName: string})
}

export interface ImChatHost extends ImHost {
  timeText: (unix?: number) => string
  messagePreview: (
    message: UserChatConversationResponseBody['lastUserMessage'] | undefined,
    conversation?: UserChatConversationResponseBody,
  ) => string
  roomUploadPrefix: (roomId: number) => string
  subscribeReadUpdate: (
    handler: (rows: Array<IdValueMetadata<number, number>>) => void,
  ) => () => void
}

export interface ImChatCallHost extends ImHost {
  closeTimeValue: Ref<TimeProperties>
}

export interface ImPageHost extends ImChatHost {
  draftPreview: (draft: UserChatConversationResponseBody['draft']) => string
  unreadCount: (id: string) => number
  refreshUnread: () => Promise<void>
}
