import {computed, defineComponent, isVNode, Text, type VNode} from 'vue'
import {CodeHighlighter, Mermaid} from '@antdv-next/x'
import {useIsDark} from '../_util/useIsDark'

export interface MarkdownCodeRendererProps {
  class?: unknown
}

function toText(nodes: unknown): string {
  if (nodes == null) {
    return ''
  }
  if (typeof nodes === 'string' || typeof nodes === 'number') {
    return String(nodes)
  }
  if (Array.isArray(nodes)) {
    return nodes.map(toText).join('')
  }
  if (!isVNode(nodes)) {
    return ''
  }
  const vnode = nodes as VNode
  if (vnode.type === Text) {
    return typeof vnode.children === 'string' ? vnode.children : ''
  }
  const textProp = (vnode.props as { text?: unknown } | null)?.text
  if (typeof textProp === 'string') {
    return textProp
  }
  if (typeof vnode.children === 'string') {
    return vnode.children
  }
  if (Array.isArray(vnode.children)) {
    return toText(vnode.children)
  }
  if (vnode.children && typeof vnode.children === 'object' && 'default' in vnode.children) {
    const slot = (vnode.children as { default?: () => unknown }).default
    return toText(slot?.())
  }
  return ''
}

const MarkdownCodeRenderer = defineComponent({
  name: 'LMarkdownCodeRenderer',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const isDark = useIsDark()
    const highlighterTheme = computed(() => (isDark.value ? 'dark' : 'light'))

    function getCodeText(): string {
      return toText(slots.default?.())
    }

    const isBlock = computed(() => {
      const dataBlock = attrs['data-block']
      const dataBlockCamel = attrs.dataBlock
      const block = attrs.block
      return (
        dataBlock === 'true' ||
        dataBlock === true ||
        dataBlockCamel === 'true' ||
        dataBlockCamel === true ||
        block === 'true' ||
        block === true
      )
    })

    const language = computed(() => {
      const dataLang = typeof attrs['data-lang'] === 'string' ? attrs['data-lang'] : ''
      const langAttr = typeof attrs.lang === 'string' ? attrs.lang : ''
      const className = typeof attrs.class === 'string' ? attrs.class : ''
      const classLang = className.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? ''
      return dataLang || langAttr || classLang
    })

    return () => {
      if (!isBlock.value) {
        return <code>{getCodeText()}</code>
      }
      if (language.value === 'mermaid') {
        return (
          <Mermaid
            content={getCodeText()}
            codeHighlighterProps={{ theme: highlighterTheme.value }}
          />
        )
      }
      return (
        <CodeHighlighter
          content={getCodeText()}
          language={language.value}
          theme={highlighterTheme.value}
          showLineNumbers
          showCopyButton
        />
      )
    }
  },
})

export default MarkdownCodeRenderer
