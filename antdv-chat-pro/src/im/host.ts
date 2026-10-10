import type {Ref} from 'vue'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {IdValueMetadata, TimeProperties} from '@loncra/client/commons'
import type {UserChatMessageResponseBody} from '@loncra/client/message'

export interface ImHost {
  selfName: string
  principalName: (details: PlatformUser | UserMetadata | undefined) => string
}

export interface ImChatHost extends ImHost {
  timeText: (time: number) => string
  messagePreview: (message: UserChatMessageResponseBody) => string
  subscribeReadUpdate: (
    handler: (rows: Array<IdValueMetadata<number, number>>) => void,
  ) => () => void
}

export interface ImChatCallHost extends ImHost {
  closeTimeValue: Ref<TimeProperties>
}
