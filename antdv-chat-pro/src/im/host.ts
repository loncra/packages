import type {Ref} from 'vue'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {TimeProperties} from '@loncra/client/commons'

export interface ImHost {
  self: PlatformUser | (UserMetadata & {systemName: string})
}

export interface ImChatHost extends ImHost {
  timeText: (unix?: number) => string
  subscribe: (event: string, handler: (payload: unknown) => void) => () => void
  roomUploadPrefix: (roomId: number) => string
}

export interface ImChatCallHost extends ImHost {
  closeTimeValue: Ref<TimeProperties>
}

export interface ImPageHost extends ImChatHost {
  unreadCount: (id: string) => number
  refreshUnread: () => Promise<void>
}
