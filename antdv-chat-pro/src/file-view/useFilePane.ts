import {computed, onMounted, onUnmounted, ref, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {buildFilePaneContext, isTextTooLarge, resolveFilePaneKind} from './filePaneKinds'
import type {FileViewNode, FileViewOpenResult} from './types'

export function useFilePane(node: FileViewNode, open: () => Promise<FileViewOpenResult>) {
  const {message} = useApp()
  const context = computed(() => buildFilePaneContext(node))
  const kind = computed(() => resolveFilePaneKind(context.value))
  const src = ref('')
  const content = ref('')
  const loading = ref(false)
  const paneReason: Ref<'unsupported' | 'tooLarge' | undefined> = ref(undefined)
  let objectUrl: string | undefined

  function revokeObjectUrl() {
    if (!objectUrl) {
      return
    }
    URL.revokeObjectURL(objectUrl)
    objectUrl = undefined
  }

  async function load() {
    paneReason.value = undefined
    content.value = ''
    src.value = ''
    revokeObjectUrl()
    if (kind.value.id === 'text' && isTextTooLarge(context.value.size)) {
      paneReason.value = 'tooLarge'
      return
    }
    loading.value = true
    try {
      const result = await open()
      if (kind.value.id !== 'text') {
        src.value = result.type === 'url' ? result.url : URL.createObjectURL(result.blob)
        if (result.type === 'blob') {
          objectUrl = src.value
        }
        return
      }
      if (result.type === 'blob') {
        content.value = await result.blob.text()
        return
      }
      const response = await fetch(result.url)
      if (!response.ok) {
        throw new Error(String(response.status))
      }
      content.value = await response.text()
    } catch (error) {
      paneReason.value = 'unsupported'
      content.value = ''
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  onUnmounted(revokeObjectUrl)

  return {context, kind, src, content, loading, paneReason}
}
