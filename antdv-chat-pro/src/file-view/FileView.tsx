import {computed, defineComponent, ref, type PropType} from 'vue'
import {Splitter, SplitterPanel} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import FileConversation from './conversation/FileConversation'
import FileTabs from './tabs/FileTabs'
import type {FileViewClasses, FileViewProps, FileViewStyles} from './types'
import {useFileView} from './useFileView'
import useStyle from './style'

function readSize(height?: string | number, maxHeight?: string | number): Record<string, string> {
  const sizeStyle: Record<string, string> = {}
  if (height != null && height !== '') {
    const value = typeof height === 'number' ? `${height}px` : height
    sizeStyle.height = value
    sizeStyle.minHeight = value
  }
  if (maxHeight != null && maxHeight !== '') {
    sizeStyle.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
  }
  return sizeStyle
}

const FileView = defineComponent({
  name: 'LFileView',
  inheritAttrs: false,
  props: {
    source: {
      type: Object as PropType<FileViewProps['source']>,
      required: true,
    },
    name: String,
    height: [String, Number],
    maxHeight: [String, Number],
    getIcon: Function as PropType<FileViewProps['getIcon']>,
    confirmClose: Function as PropType<FileViewProps['confirmClose']>,
    dirty: Function as PropType<FileViewProps['dirty']>,
    onDownload: Function as PropType<FileViewProps['onDownload']>,
    toolbarActions: Array as PropType<FileViewProps['toolbarActions']>,
    menuItems: Function as PropType<FileViewProps['menuItems']>,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<FileViewClasses>,
    styles: Object as PropType<FileViewStyles>,
  },
  setup(props, {attrs, slots, expose}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-view', props.prefixCls ?? 'loncra-file-view'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const conversationRef = ref<{revealItem: (key: string) => void}>()
    const model = useFileView({
      source: () => props.source,
      getIcon: () => props.getIcon,
      confirmClose: props.confirmClose,
    })

    function reveal(id: string) {
      model.expandAncestors(id)
      const current = model.state.value.tabs.find((tab) => tab.id === id)
        ?? model.state.value.selected
      if (current?.id === id) {
        model.state.value.selected = current
      }
      void conversationRef.value?.revealItem(id)
    }

    expose({
      reveal,
      reload: model.reload,
      closeTabs: model.closeTabs,
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const sizeStyle = readSize(props.height, props.maxHeight)
      return (
        <div
          {...rest}
          class={hashed(prefixCls.value, props.classes?.root, props.rootClass, attrClass as string)}
          style={[sizeStyle, props.styles?.root, attrStyle] as never}
        >
          <Splitter
            class={hashed(`${prefixCls.value}-splitter`, props.classes?.splitter)}
            style={props.styles?.splitter as never}
          >
            <SplitterPanel
              class={hashed(`${prefixCls.value}-panel`, props.classes?.panel)}
              style={props.styles?.panel as never}
              defaultSize="20%"
              min="10%"
              max="30%"
            >
              <FileConversation
                ref={conversationRef}
                model={model}
                name={props.name}
                toolbarActions={props.toolbarActions}
                menuItems={props.menuItems}
                title={slots.title
                  ? (node) => slots.title?.({node})
                  : undefined}
              />
            </SplitterPanel>
            <SplitterPanel
              class={hashed(`${prefixCls.value}-panel-main`, props.classes?.panelMain)}
              style={props.styles?.panelMain as never}
            >
              <FileTabs
                model={model}
                locate={reveal}
                dirty={props.dirty}
                onDownload={props.onDownload}
                open={(node) => props.source.open(node)}
                tabExtra={slots.tabExtra
                  ? (node) => slots.tabExtra?.({node})
                  : undefined}
                pane={slots.pane
                  ? (node) => slots.pane?.({node})
                  : undefined}
              />
            </SplitterPanel>
          </Splitter>
        </div>
      )
    }
  },
})

export default FileView
