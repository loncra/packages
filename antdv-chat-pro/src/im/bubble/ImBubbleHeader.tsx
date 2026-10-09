import {defineComponent, type PropType} from 'vue'
import {Typography} from 'antdv-next'
import {isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'

const ImBubbleHeader = defineComponent({
  name: 'LImBubbleHeader',
  props: {
    role: {type: String, required: true},
    roomType: {
      type: [Number, Object] as PropType<number | NameValueEnumMetadata<number>>,
      default: undefined,
    },
    details: {type: Object as PropType<PlatformUser | UserMetadata | undefined>, default: undefined},
    principalName: {
      type: Function as PropType<(details: PlatformUser | UserMetadata | undefined) => string>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (props.role !== 'ai' || !isEnumValue(props.roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT)) {
        return null
      }
      return <Typography.Text>{props.principalName(props.details)}</Typography.Text>
    }
  },
})

export default ImBubbleHeader
