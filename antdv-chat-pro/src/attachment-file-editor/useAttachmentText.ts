import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import useApp from 'antdv-next/dist/app/useApp'
import {uploadFile} from '@loncra/antdv-pro'
import {AttachmentService} from '@loncra/client/resource'
import {buildFilePaneContext, isTextTooLarge, resolveFilePaneKind, type FileViewNode} from '../file-view'
import {readExtra} from './useAttachmentSource'
import type {FileEditorNode, TextEditorEntry} from './types'

export function canEditText(node: FileViewNode, readonly: boolean): boolean {
  if (readonly || node.dir) {
    return false
  }
  const kind = resolveFilePaneKind(buildFilePaneContext(node))
  return kind.id === 'text' && !isTextTooLarge(node.size || 0)
}

export function useAttachmentText(options: {
  node: () => FileEditorNode
  bucket: () => string
  register: (id: string, entry: TextEditorEntry | undefined) => void
}) {
  const {message} = useApp()
  const content = ref('')
  const dirty = ref(false)
  const loading = ref(true)
  const ready = ref(false)
  const failed = ref(false)
  const context = computed(() => buildFilePaneContext(options.node()))

  async function load() {
    loading.value = true
    dirty.value = false
    failed.value = false
    try {
      const response = await fetch(AttachmentService.query(options.bucket(), readExtra(options.node()).objectName))
      if (!response.ok) {
        throw new Error(String(response.status))
      }
      content.value = await response.text()
      dirty.value = false
    } catch (error) {
      content.value = ''
      failed.value = true
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  async function save() {
    if (!dirty.value) {
      return
    }
    const filename = context.value.name
    const file = new File([content.value], filename, {type: 'text/plain'})
    const objectName = readExtra(options.node()).objectName
    const slash = objectName.lastIndexOf('/')
    const prefix = slash >= 0 ? objectName.slice(0, slash + 1) : ''
    loading.value = true
    try {
      await uploadFile(
        {uid: options.node().id, name: filename, originFileObj: file, size: file.size} as UploadFile,
        options.bucket(),
        {postFilename: 'file', promiseLimit: 1, param: {prefix, randomName: false}},
      )
      dirty.value = false
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  function publish() {
    options.register(options.node().id, {dirty: dirty.value, save})
  }

  watch(dirty, publish)

  onMounted(() => {
    publish()
    void load()
  })

  onUnmounted(() => {
    options.register(options.node().id, undefined)
  })

  return {
    content,
    dirty,
    loading,
    ready,
    failed,
    context,
    setContent(value: string) {
      content.value = value
      if (!loading.value) {
        dirty.value = true
      }
    },
  }
}
