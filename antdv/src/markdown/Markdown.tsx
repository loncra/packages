import {computed, defineComponent, nextTick, ref, watch} from 'vue'
import {type StreamingOption, XMarkdown, type XMarkdownProps} from '@antdv-next/x-markdown'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '../_util/classNames'
import {useIsDark} from '../_util/useIsDark'
import useStyle from './style'

import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import '@antdv-next/x-markdown/themes/dark.css'

export type MarkdownTheme = 'light' | 'dark'

export interface MarkdownProps extends XMarkdownProps {
  scrollClass?: string
  nearBottomPx?: number
  theme?: MarkdownTheme
  prefixCls?: string
  class?: unknown
  rootClass?: string
}

export interface MarkdownSlots {
  default?: () => unknown
}

const Markdown = defineComponent({
  name: 'LMarkdown',
  inheritAttrs: false,
  props: {
    scrollClass: String,
    nearBottomPx: {
      type: Number,
      default: 48,
    },
    theme: String as () => MarkdownTheme,
    prefixCls: String,
    rootClass: String,
  },
  setup(props, { attrs }) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('markdown', props.prefixCls ?? 'loncra-markdown'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const isDark = useIsDark()
    const scrollEl = ref<HTMLElement | null>(null)
    const autoStickBottom = ref(true)

    const appearance = computed<MarkdownTheme>(
      () => props.theme ?? (isDark.value ? 'dark' : 'light'),
    )
    const themeClass = computed(() =>
      appearance.value === 'dark' ? 'x-markdown-dark' : 'x-markdown-light',
    )

    function streamingOption(): StreamingOption | undefined {
      return attrs.streaming as StreamingOption | undefined
    }

    function isNearBottom(el: HTMLElement): boolean {
      return el.scrollHeight - el.scrollTop - el.clientHeight <= props.nearBottomPx
    }

    function scrollToBottom() {
      const el = scrollEl.value
      if (!el || el.scrollHeight <= el.clientHeight) {
        return
      }
      el.scrollTo({ top: el.scrollHeight })
    }

    function onScroll() {
      const el = scrollEl.value
      if (!el || !streamingOption()?.hasNextChunk) {
        return
      }
      autoStickBottom.value = isNearBottom(el)
    }

    async function maybeAutoScroll() {
      if (!streamingOption()?.hasNextChunk || !autoStickBottom.value) {
        return
      }
      await nextTick()
      scrollToBottom()
    }

    watch(
      () => attrs.content,
      () => {
        void maybeAutoScroll()
      },
    )

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      return (
        <div
          ref={scrollEl}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.scrollClass ? `${prefixCls.value}-scroll` : undefined,
            props.scrollClass,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle as string | Record<string, string> | undefined}
          onScroll={onScroll}
        >
          <XMarkdown {...rest} class={themeClass.value} />
        </div>
      )
    }
  },
})

export default Markdown
