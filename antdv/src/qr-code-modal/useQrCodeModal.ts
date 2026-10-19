import {ref, watch} from 'vue'

interface QrCodeModalSource {
  url: string
  open: boolean
}

export function useQrCodeModal(props: QrCodeModalSource) {
  const copied = ref(false)

  watch(
    () => props.open,
    (open) => {
      if (!open) {
        copied.value = false
      }
    },
  )

  async function copy() {
    await navigator.clipboard.writeText(props.url || '')
    copied.value = true
  }

  return {copied, copy}
}
