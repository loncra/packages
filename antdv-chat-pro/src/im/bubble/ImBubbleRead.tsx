import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Button, Flex, Popover, Tooltip, Typography} from 'antdv-next'
import {CheckOutlined, EyeInvisibleOutlined, EyeOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import type {ImChatBubble} from '@loncra/chat-core'
import {useLocale} from '../../_util/useLocale.ts'
import ImMessageReadTable from './ImMessageReadTable.tsx'
import useStyle, {IM_BUBBLE_PREFIX} from './style/index.ts'
import type {ImChatHost} from '../host.ts'

const ImBubbleRead = defineComponent({
  name: 'LImBubbleRead',
  props: {
    item: {type: Object as PropType<ImChatBubble>, required: true},
    roomType: {
      type: [Number, Object] as PropType<number | NameValueEnumMetadata<number>>,
      default: undefined,
    },
    host: {type: Object as PropType<ImChatHost>, required: true},
  },
  setup(props) {
    const locale = useLocale('ImBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-bubble', IM_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    return () => {
      const item = props.item
      if (isEnumValue(props.roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.PRIVATE_CHAT) && item.role === 'user') {
        const unread = item.readableCount === 1
        return (
          <div class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
            <div class={`${prefixCls.value}-read`}>
              <Tooltip title={unread ? locale.value.unread : locale.value.read}>
                <Typography.Text type={unread ? 'success' : 'secondary'}>
                  {unread ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </Typography.Text>
              </Tooltip>
            </div>
          </div>
        )
      }
      if (!isEnumValue(props.roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT) || !item.participant || item.id == null) {
        return null
      }
      const pending = Math.abs(item.readableCount - item.readCount)
      const done = pending >= item.readCount
      return (
        <div class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
          <div class={`${prefixCls.value}-read`}>
            <Popover
            placement={item.role === 'user' ? 'left' : 'right'}
            trigger="click"
            v-slots={{
              content: () => <ImMessageReadTable messageId={Number(item.id)} host={props.host} />,
            }}
          >
            <Button
              color={done ? 'lime' : undefined}
              size="small"
              variant={done ? 'filled' : undefined}
              type="dashed"
              v-slots={done ? {icon: () => <CheckOutlined />} : undefined}
            >
              {done
                ? null
                : (
                  <Flex align="center" gap="small">
                    <Badge status="processing" />
                    {pending} / {item.readCount}
                  </Flex>
                )}
            </Button>
            </Popover>
          </div>
        </div>
      )
    }
  },
})

export default ImBubbleRead
