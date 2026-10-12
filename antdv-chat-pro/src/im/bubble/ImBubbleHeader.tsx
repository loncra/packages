import {defineComponent, type PropType} from 'vue'
import {Typography} from 'antdv-next'
import {isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import {AuthServerService, type PlatformUser, type UserMetadata} from '@loncra/client/auth'
import {CHAT_BUBBLE_TYPE} from '@loncra/client/ai'

const ImBubbleHeader = defineComponent({
  name: 'LImBubbleHeader',
  props: {
    role: {type: String, required: true},
    roomType: {
      type: [Number, Object] as PropType<number | NameValueEnumMetadata<number>>,
      default: undefined,
    },
    details: {type: Object as PropType<PlatformUser | UserMetadata | undefined>, default: undefined},
  },
  setup(props) {
    return () => {
      if (props.role !== CHAT_BUBBLE_TYPE.AI || !isEnumValue(props.roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT)) {
        return null
      }
      return <Typography.Text>{AuthServerService.getPrincipalNameByUserDetails(props.details)}</Typography.Text>
    }
  },
})

export default ImBubbleHeader
