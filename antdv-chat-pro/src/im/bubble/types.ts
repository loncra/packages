import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {UserChatMessageResponseBody} from '@loncra/client/message'

export interface ImBubbleHost {
  timeText: (time: number) => string
  principalName: (details: PlatformUser | UserMetadata | undefined) => string
  selfName: string
  messagePreview: (message: UserChatMessageResponseBody) => string
  subscribeReadUpdate: (
    handler: (rows: Array<IdValueMetadata<number, number>>) => void,
  ) => () => void
}
