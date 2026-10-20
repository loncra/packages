import {computed, defineComponent} from 'vue'
import {CheckOutlined, CopyOutlined} from '@antdv-next/icons'
import {Button, Flex, Input, Modal, QRCode, SpaceCompact, theme} from 'antdv-next'
import {useLocale} from '../_util/context/useLocale'
import {QRCODE_SIZE_RATIO} from './constants'
import {useQrCodeModal} from './useQrCodeModal'

const QrCodeModal = defineComponent({
  name: 'LQrCodeModal',
  inheritAttrs: false,
  props: {
    url: {
      type: String,
      required: true,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:open'],
  setup(props, { emit, slots, attrs }) {
    const locale = useLocale('QrCodeModal')
    const { token } = theme.useToken()
    const qrSize = computed(() => token.value.sizeLG * QRCODE_SIZE_RATIO)
    const { copied, copy } = useQrCodeModal(props)

    function onCancel() {
      emit('update:open', false)
    }

    return () => (
      <Modal
        {...attrs}
        open={props.open}
        title={locale.value.share}
        footer={null}
        onCancel={onCancel}
      >
        <Flex vertical gap="middle" align="center">
          <QRCode value={props.url} size={qrSize.value} />
          <SpaceCompact block>
            <Input disabled value={props.url} />
            <Button
              variant="outlined"
              color={copied.value ? 'cyan' : 'default'}
              onClick={copy}
              v-slots={{
                icon: () =>
                  slots.copyIcon?.({ copied: copied.value }) ??
                  (copied.value ? <CheckOutlined /> : <CopyOutlined />),
              }}
            >
              {locale.value.copy}
            </Button>
          </SpaceCompact>
        </Flex>
      </Modal>
    )
  },
})

export default QrCodeModal
