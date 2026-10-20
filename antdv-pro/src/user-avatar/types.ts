import type {PlatformUser, UserMetadata} from '@loncra/client/auth'

export interface UserAvatarProps {
  user?: PlatformUser | UserMetadata
  fallback?: string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface UserAvatarSlots {
  text?: () => unknown
}
