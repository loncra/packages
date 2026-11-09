import {computed, defineComponent, onMounted, onUnmounted, ref, type PropType, watch} from 'vue'
import {Spin} from 'antdv-next'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import useApp from 'antdv-next/dist/app/useApp'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {uploadFile} from '@loncra/antdv-pro'
import {AttachmentService} from '@loncra/client/resource'
import TextPane from '../file-view/panes/text/TextPane'
import UnsupportedPane from '../file-view/panes/unsupported/UnsupportedPane'
import useStyle from '../file-view/panes/style'
import {buildFilePaneContext} from '../file-view'
import {readExtra} from './useAttachmentSource'
import type {FileEditorNode, TextEditorEntry} from './types'

const AttachmentTextPane = defineComponent({
  name: 'LAttachmentTextPane',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<FileEditorNode>,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    register: {
      type: Function as PropType<(id: string, entry: TextEditorEntry | undefined) => void>,
      required: true,
    },
  },
  setup(props) {
    const {message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('file-pane', 'loncra-file-pane'))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const content = ref('')
    const dirty = ref(false)
    const loading = ref(true)
    const ready = ref(false)
    const failed = ref(false)
    const context = buildFilePaneContext(props.node)

    async function load() {
      loading.value = true
      dirty.value = false
      failed.value = false
      try {
        const response = await fetch(AttachmentService.query(props.bucket, readExtra(props.node).objectName))
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
      const filename = context.name
      const file = new File([content.value], filename, {type: 'text/plain'})
      const objectName = readExtra(props.node).objectName
      const slash = objectName.lastIndexOf('/')
      const prefix = slash >= 0 ? objectName.slice(0, slash + 1) : ''
      loading.value = true
      try {
        await uploadFile(
          {uid: props.node.id, name: filename, originFileObj: file, size: file.size} as UploadFile,
          props.bucket,
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
      props.register(props.node.id, {dirty: dirty.value, save})
    }

    watch(dirty, publish)

    onMounted(() => {
      publish()
      void load()
    })

    onUnmounted(() => {
      props.register(props.node.id, undefined)
    })

    return () => (
      <Spin
        spinning={loading.value}
        class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-full-spin`)}
      >
        <div class={classNames(hashId.value, `${prefixCls.value}-pane`)}>
          {!ready.value ? null : failed.value ? (
            <UnsupportedPane
              reason="unsupported"
              prefixCls={prefixCls.value}
              hashId={hashId.value}
              cssVarCls={cssVarCls.value}
            />
          ) : (
            <TextPane
              ext={context.ext}
              readonly={false}
              modelValue={content.value}
              prefixCls={prefixCls.value}
              hashId={hashId.value}
              cssVarCls={cssVarCls.value}
              onUpdate:modelValue={(value: string) => {
                content.value = value
                if (!loading.value) {
                  dirty.value = true
                }
              }}
            />
          )}
        </div>
      </Spin>
    )
  },
})

export default AttachmentTextPane
