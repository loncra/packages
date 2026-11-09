import {computed, defineComponent, type PropType} from 'vue'
import {Spin} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import AudioPane from './panes/audio/AudioPane'
import ImagePane from './panes/image/ImagePane'
import TextPane from './panes/text/TextPane'
import UnsupportedPane from './panes/unsupported/UnsupportedPane'
import VideoPane from './panes/video/VideoPane'
import useStyle from './panes/style'
import {useFilePane} from './useFilePane'
import type {FilePaneKindId, FilePaneRendererProps} from './types'

interface PaneShared {
  prefixCls: string
  hashId: string
  cssVarCls: string | undefined
}

interface PaneRenderContext {
  pane: ReturnType<typeof useFilePane>
  shared: PaneShared
}

const PANE_RENDERERS = {
  image: (ctx: PaneRenderContext) => (
    <ImagePane src={ctx.pane.src.value} alt={ctx.pane.context.value.name} {...ctx.shared} />
  ),
  video: (ctx: PaneRenderContext) => <VideoPane src={ctx.pane.src.value} {...ctx.shared} />,
  audio: (ctx: PaneRenderContext) => <AudioPane src={ctx.pane.src.value} {...ctx.shared} />,
  text: (ctx: PaneRenderContext) => (
    <TextPane
      ext={ctx.pane.context.value.ext}
      readonly
      modelValue={ctx.pane.content.value}
      {...ctx.shared}
    />
  ),
  fallback: (ctx: PaneRenderContext) => <UnsupportedPane reason="unsupported" {...ctx.shared} />,
} satisfies Record<FilePaneKindId, (ctx: PaneRenderContext) => unknown>

const FilePaneRenderer = defineComponent({
  name: 'LFilePaneRenderer',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<FilePaneRendererProps['node']>,
      required: true,
    },
    open: {
      type: Function as PropType<FilePaneRendererProps['open']>,
      required: true,
    },
  },
  setup(props) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-pane', 'loncra-file-pane'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const pane = useFilePane(props.node, () => props.open())
    const showViewer = computed(
      () => pane.kind.value.id !== 'text' || !pane.loading.value || !!pane.paneReason.value,
    )

    return () => {
      const shared: PaneShared = {
        prefixCls: prefixCls.value,
        hashId: hashId.value,
        cssVarCls: cssVarCls.value,
      }
      const viewer = !showViewer.value
        ? null
        : pane.paneReason.value
          ? <UnsupportedPane reason={pane.paneReason.value} {...shared} />
          : (PANE_RENDERERS[pane.kind.value.id]?.({pane, shared}) ?? null)
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

export default FilePaneRenderer
