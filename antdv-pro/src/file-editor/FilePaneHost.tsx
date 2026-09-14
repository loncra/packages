import {computed, defineComponent, type PropType, watch} from 'vue'
import {Spin} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {ObjectItemInfo} from '@loncra/client/resource'
import AudioPane from './panes/AudioPane'
import ImagePane from './panes/ImagePane'
import TextPane from './panes/TextPane'
import UnsupportedPane from './panes/UnsupportedPane'
import VideoPane from './panes/VideoPane'
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
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    dirtyChange: (_dirty: boolean) => true,
  },
  setup(props, {emit, expose}) {
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
        prefixCls: props.prefixCls,
        hashId: props.hashId,
        cssVarCls: props.cssVarCls,
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
          class={classNames(
            props.hashId,
            props.cssVarCls,
            `${props.prefixCls}-spin`,
            `${props.prefixCls}-pane`,
          )}
        >
          <div class={classNames(props.hashId, `${props.prefixCls}-pane`)}>{viewer}</div>
        </Spin>
      )
    }
  },
})

export default FilePaneHost
