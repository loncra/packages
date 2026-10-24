import {computed, defineComponent, nextTick, ref, watch, type PropType} from 'vue'
import {type StreamingOption, XMarkdown} from '@antdv-next/x-markdown'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, useIsDark} from '@loncra/antdv'
import type {MarkdownClasses, MarkdownStyles, MarkdownTheme} from './types'
import useStyle from './style'

import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import '@antdv-next/x-markdown/themes/dark.css'

const Markdown = defineComponent({
  name: 'LMarkdown',
  inheritAttrs: false,
  props: {
    nearBottomPx: {
      type: Number,
      default: 48,
    },
    theme: String as () => MarkdownTheme,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<MarkdownClasses>,
    styles: Object as PropType<MarkdownStyles>,
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

    function isStreaming(): boolean {
      const streaming = attrs.streaming as StreamingOption | boolean | undefined
      if (streaming === true) {
        return true
      }
      if (streaming && typeof streaming === 'object') {
        return streaming.hasNextChunk === true
      }
      return false
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
      if (!el || !isStreaming()) {
        return
      }
      autoStickBottom.value = isNearBottom(el)
    }

    async function maybeAutoScroll() {
      if (!isStreaming() || !autoStickBottom.value) {
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
            `${prefixCls.value}-scroll`,
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.classes?.root,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle as string | Record<string, string> | undefined}
          onScroll={onScroll}
        >
          <XMarkdown
            {...rest}
            class={classNames(themeClass.value, props.classes?.markdown)}
            style={props.styles?.markdown as never}
          />
        </div>
      )
    }
  },
})

export default Markdown
