import {computed, onMounted, ref, type Ref} from 'vue'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import useApp from 'antdv-next/dist/app/useApp'
import {uploadFile} from '../_util/uploadFile'
import {buildFilePaneContext, isTextTooLarge, resolveFilePaneKind} from './filePaneKinds'
import type {FilePaneProps} from './types'

export function useFilePane(props: FilePaneProps) {
  const {message} = useApp()

  const context = computed(() => buildFilePaneContext(props.item))
  const kind = computed(() => resolveFilePaneKind(context.value))
  const src = computed(() => AttachmentService.query(props.bucket, props.item.objectName))
  const content = ref('')
  const dirty = ref(false)
  const loading = ref(false)
  const paneReason: Ref<'unsupported' | 'tooLarge' | undefined> = ref(undefined)

  function updateContent(value: string) {
    content.value = value
    if (!loading.value) {
      dirty.value = true
    }
  }

  async function loadText() {
    paneReason.value = undefined
    dirty.value = false
    content.value = ''
    if (kind.value.id !== 'text') {
      return
    }
    if (isTextTooLarge(context.value.size)) {
      paneReason.value = 'tooLarge'
      return
    }
    loading.value = true
    try {
      const response = await fetch(src.value)
      if (!response.ok) {
        throw new Error(String(response.status))
      }
      content.value = await response.text()
      dirty.value = false
    } catch (e) {
      paneReason.value = 'unsupported'
      content.value = ''
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  function objectPrefix() {
    const objectName = props.item.objectName
    const slash = objectName.lastIndexOf('/')
    if (slash >= 0) {
      return objectName.slice(0, slash + 1)
    }
    return props.rootPath
  }

  async function save() {
    if (props.readonly || kind.value.id !== 'text' || !dirty.value) {
      return
    }
    const filename = context.value.name
    const file = new File([content.value], filename, {type: 'text/plain'})
    loading.value = true
    try {
      await uploadFile(
        {
          uid: props.item.id,
          name: filename,
          originFileObj: file,
          size: file.size,
        } as UploadFile,
        props.bucket,
        {
          postFilename: 'file',
          promiseLimit: 1,
          param: {
            prefix: objectPrefix(),
            randomName: false,
          },
        },
      )
      dirty.value = false
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadText()
  })

  return {
    context,
    kind,
    src,
    content,
    dirty,
    loading,
    paneReason,
    updateContent,
    save,
  }
}
