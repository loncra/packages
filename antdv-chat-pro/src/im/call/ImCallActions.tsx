import {defineComponent, ref} from 'vue'
import {Button, Space} from 'antdv-next'
import {CheckOutlined, CloseOutlined, StopOutlined} from '@antdv-next/icons'
import useApp from 'antdv-next/dist/app/useApp'
import {MESSAGE_SERVER_MESSAGE_GROUP} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {useImChatCall} from './useImChatCall.ts'

const ImCallActions = defineComponent({
  name: 'LImCallActions',
  props: {
    callId: {type: Number, required: true},
  },
  setup(props) {
    const session = useImChatCall()
    const locale = useLocale('ImCall')
    const {notification} = useApp()
    const loading = ref(false)

    function dismiss() {
      notification.destroy(`${MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL}_${props.callId}`)
    }

    return () => (
      <Space>
        <Button
          type="link"
          size="small"
          onClick={dismiss}
          v-slots={{icon: () => <StopOutlined />}}
        >
          {locale.value.ignore}
        </Button>
        <Button
          variant="solid"
          color="green"
          size="small"
          loading={loading.value}
          onClick={async () => {
            loading.value = true
            try {
              await session.accept(props.callId)
            } finally {
              loading.value = false
            }
          }}
          v-slots={{icon: () => <CheckOutlined />}}
        >
          {locale.value.accept}
        </Button>
        <Button
          danger
          type="primary"
          size="small"
          loading={loading.value}
          onClick={async () => {
            loading.value = true
            try {
              await session.reject(props.callId)
            } finally {
              loading.value = false
            }
          }}
          v-slots={{icon: () => <CloseOutlined />}}
        >
          {locale.value.rejected}
        </Button>
      </Space>
    )
  },
})

export default ImCallActions
