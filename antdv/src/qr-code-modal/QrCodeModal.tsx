import {computed, defineComponent, type PropType} from 'vue'
import {CheckOutlined, CopyOutlined} from '@antdv-next/icons'
import {Button, Flex, Input, Modal, QRCode, SpaceCompact, theme} from 'antdv-next'
import {useLocale} from '../_util/context/useLocale'
import {QRCODE_SIZE_RATIO} from './constants'
import {useQrCodeModal} from './useQrCodeModal'
import type {QrCodeModalProps} from './types'

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
    classes: Object as PropType<QrCodeModalProps['classes']>,
    styles: Object as PropType<QrCodeModalProps['styles']>,
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
        classes={props.classes?.modal}
        styles={props.styles?.modal}
        onCancel={onCancel}
      >
        <Flex
          vertical
          gap="middle"
          align="center"
          class={props.classes?.content}
          style={props.styles?.content}
        >
          <QRCode
            value={props.url}
            size={qrSize.value}
            classes={props.classes?.qrcode}
            styles={props.styles?.qrcode}
          />
          <SpaceCompact block>
            <Input
              disabled
              value={props.url}
              classes={props.classes?.urlInput}
              styles={props.styles?.urlInput}
            />
            <Button
              variant="outlined"
              color={copied.value ? 'cyan' : 'default'}
              classes={props.classes?.copyButton}
              styles={props.styles?.copyButton}
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
