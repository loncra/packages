import {computed, defineComponent, type PropType} from 'vue'
import {Avatar} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AuthServerService} from '@loncra/client/auth'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import {AttachmentService} from '@loncra/client/resource'

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

const UserAvatar = defineComponent({
  name: 'LUserAvatar',
  inheritAttrs: false,
  props: {
    user: Object as PropType<PlatformUser | UserMetadata>,
    fallback: String,
    prefixCls: String,
    rootClass: String,
  },
  setup(props, {slots, attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('user-avatar', props.prefixCls ?? 'loncra-user-avatar'),
    )

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const src = AttachmentService.getAvatarUrlIfNotNull(props.user?.avatar) || props.fallback
      const letter = AuthServerService.getPrincipalNameByUserDetails(props.user).substring(0, 1)
      return (
        <Avatar
          {...rest}
          src={src}
          class={classNames(prefixCls.value, props.rootClass, attrClass)}
          style={attrStyle as never}
        >
          {slots.text?.() ?? letter}
        </Avatar>
      )
    }
  },
})

export default UserAvatar
