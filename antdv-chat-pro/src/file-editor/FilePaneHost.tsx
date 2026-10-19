import {computed, defineComponent, type PropType, watch} from 'vue'
import {Spin} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {ObjectItemInfo} from '@loncra/client/resource'
import AudioPane from './panes/audio/AudioPane'
import ImagePane from './panes/image/ImagePane'
import TextPane from './panes/text/TextPane'
import UnsupportedPane from './panes/unsupported/UnsupportedPane'
import VideoPane from './panes/video/VideoPane'
import useStyle from './panes/style'
import {useFilePane} from './useFilePane'

const FilePaneHost = defineComponent({
  name: 'LFilePaneHost',
  inheritAttrs: false,
  props: {
    item: {
      type: Object as PropType<ObjectItemInfo>,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      required: true,
    },
    rootPath: {
      type: String,
      required: true,
    },
  },
  emits: {
    dirtyChange: (_dirty: boolean) => true,
  },
  setup(props, {emit, expose}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-pane', 'loncra-file-pane'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const pane = useFilePane(props)

    const showViewer = computed(
      () => pane.kind.value.id !== 'text' || !pane.loading.value || !!pane.paneReason.value,
    )

    watch(
      pane.dirty,
      (value) => emit('dirtyChange', value),
      {immediate: true},
    )

    expose({
      dirty: pane.dirty,
      save: pane.save,
      kind: pane.kind,
    })

    return () => {
      const shared = {
        prefixCls: prefixCls.value,
        hashId: hashId.value,
        cssVarCls: cssVarCls.value,
      }
      let viewer: unknown = null
      if (showViewer.value) {
        if (pane.paneReason.value) {
          viewer = <UnsupportedPane reason={pane.paneReason.value} {...shared} />
        } else if (pane.kind.value.id === 'image') {
          viewer = <ImagePane src={pane.src.value} alt={pane.context.value.name} {...shared} />
        } else if (pane.kind.value.id === 'video') {
          viewer = <VideoPane src={pane.src.value} {...shared} />
        } else if (pane.kind.value.id === 'audio') {
          viewer = <AudioPane src={pane.src.value} {...shared} />
        } else if (pane.kind.value.id === 'text') {
          viewer = (
            <TextPane
              ext={pane.context.value.ext}
              readonly={props.readonly}
              modelValue={pane.content.value}
              onUpdate:modelValue={pane.updateContent}
              {...shared}
            />
          )
        } else {
          viewer = <UnsupportedPane reason="unsupported" {...shared} />
        }
      }
      return (
        <Spin
          spinning={pane.loading.value}
          class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-full-spin`)}
        >
          <div class={classNames(hashId.value, `${prefixCls.value}-pane`)}>{viewer}</div>
        </Spin>
      )
    }
  },
})

export default FilePaneHost
