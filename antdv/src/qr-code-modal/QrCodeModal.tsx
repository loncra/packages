import {computed, defineComponent, ref, watch} from 'vue'
import {CheckOutlined, CopyOutlined} from '@antdv-next/icons'
import {Button, Flex, Input, Modal, type ModalProps, QRCode, SpaceCompact, theme,} from 'antdv-next'
import {useLocale} from '../_util/useLocale'

export interface QrCodeModalProps {
  url: string
  open?: boolean
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: ModalProps['classes']
  styles?: ModalProps['styles']
}

export interface QrCodeModalEmits {
  'update:open': (open: boolean) => void
}

export interface QrCodeModalSlots {
  copyIcon?: (ctx: { copied: boolean }) => unknown
}

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
    const copied = ref(false)
    const qrSize = computed(() => token.value.sizeLG * 10)

    watch(
      () => props.open,
      (open) => {
        if (!open) {
          copied.value = false
        }
      },
    )

    async function onCopy() {
      await navigator.clipboard.writeText(props.url || '')
      copied.value = true
    }

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
              onClick={onCopy}
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
