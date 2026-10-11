import {computed, defineComponent, useAttrs, type PropType} from 'vue'
import {Button, Dropdown, type MenuItemType} from 'antdv-next'
import type {MenuInfo} from 'antdv-next'
import {AudioOutlined, PhoneOutlined, VideoCameraOutlined} from '@antdv-next/icons'
import useApp from 'antdv-next/dist/app/useApp'
import {fillLocale} from '@loncra/antdv'
import {ChatCallService, MESSAGE_SERVER_CHAT_CALL_TYPE, type ChatCallType} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {useImChatCall} from './useImChatCall.ts'

const ImCallButton = defineComponent({
  name: 'LImCallButton',
  inheritAttrs: false,
  props: {
    roomId: {type: Number, required: true},
    peerName: {type: String, required: true},
    principals: {type: Array as PropType<string[]>, required: true},
  },
  setup(props) {
    const attrs = useAttrs()
    const locale = useLocale('ImCall')
    const session = useImChatCall()
    const {message} = useApp()
    const items = computed<MenuItemType[]>(() => [
      {
        key: MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO,
        label: locale.value.videoAction,
        icon: () => <VideoCameraOutlined />,
      },
      {
        key: MESSAGE_SERVER_CHAT_CALL_TYPE.VOICE,
        label: locale.value.voiceAction,
        icon: () => <AudioOutlined />,
      },
    ])

    async function start(type: ChatCallType) {
      if (!navigator.mediaDevices?.getUserMedia) {
        message.error(locale.value.unsupported)
        return
      }
      try {
        const calling = props.principals.filter((name) => name !== session.host.selfName)
        const created = await ChatCallService.create(props.roomId, type, calling)
        if (!created.data) {
          return
        }
        const template = type === MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO
          ? locale.value.videoTitle
          : locale.value.voiceTitle
        await session.open(fillLocale(template, {user: props.peerName}), created.data)
      } catch (error) {
        console.error(error)
      }
    }

    return () => (
      <Dropdown
        menu={{items: items.value}}
        trigger={['click']}
        arrow
        placement="topRight"
        onMenuClick={(info: MenuInfo) => {
          const type = Number(info.key)
          if (type === MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO || type === MESSAGE_SERVER_CHAT_CALL_TYPE.VOICE) {
            void start(type)
          }
        }}
      >
        <Button {...attrs} v-slots={{icon: () => <PhoneOutlined />}} />
      </Dropdown>
    )
  },
})

export default ImCallButton
