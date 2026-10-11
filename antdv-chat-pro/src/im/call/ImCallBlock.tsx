import {defineComponent, type PropType} from 'vue'
import {Badge, Space} from 'antdv-next'
import {AudioOutlined, VideoCameraOutlined} from '@antdv-next/icons'
import {getEnumName, getEnumValue, isEnumValue} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_CHAT_CALL_SCENE,
  MESSAGE_SERVER_CHAT_CALL_TYPE,
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
  USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE,
  USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE,
} from '@loncra/client/message'
import type {CallBlock} from '@loncra/chat-core'
import type {ImHost} from '../host.ts'
import ImCallActions from './ImCallActions.tsx'

function badgeStatus(status: CallBlock['status']) {
  const value = getEnumValue(status)
  if (USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE.includes(value)) {
    return 'error' as const
  }
  if (USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE.includes(value)) {
    return 'processing' as const
  }
  if (value === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE) {
    return 'success' as const
  }
  if (value === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.NO_ANSWER) {
    return 'default' as const
  }
  return 'warning' as const
}

const ImCallBlock = defineComponent({
  name: 'LImCallBlock',
  props: {
    block: {type: Object as PropType<CallBlock>, required: true},
    host: {type: Object as PropType<ImHost>, required: true},
  },
  setup(props) {
    return () => {
      const block = props.block
      const TypeIcon = isEnumValue(block.value, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
        ? VideoCameraOutlined
        : AudioOutlined
      const incoming = getEnumValue(block.status) === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING
        && block.caller !== props.host.selfName
        && isEnumValue(block.scene, MESSAGE_SERVER_CHAT_CALL_SCENE.PRIVATE)
      return (
        <Space>
          <Space align="center">
            <Badge status={badgeStatus(block.status)} />
            <TypeIcon />
            <span>{getEnumName(block.status)}</span>
          </Space>
          {incoming ? <ImCallActions callId={block.userChatCallId} /> : null}
        </Space>
      )
    }
  },
})

export default ImCallBlock
