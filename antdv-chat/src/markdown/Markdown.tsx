import {computed, defineComponent} from 'vue'
import {XMarkdown} from '@antdv-next/x-markdown'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, useIsDark} from '@loncra/antdv'
import type {MarkdownTheme} from './types'
import useStyle from './style'

import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import '@antdv-next/x-markdown/themes/dark.css'

const Markdown = defineComponent({
  name: 'LMarkdown',
  inheritAttrs: false,
  props: {
    theme: String as () => MarkdownTheme,
    prefixCls: String,
    rootClass: String,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('markdown', props.prefixCls ?? 'loncra-markdown'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const isDark = useIsDark()

    const appearance = computed<MarkdownTheme>(
      () => props.theme ?? (isDark.value ? 'dark' : 'light'),
    )
    const themeClass = computed(() =>
      appearance.value === 'dark' ? 'x-markdown-dark' : 'x-markdown-light',
    )

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <XMarkdown
          {...rest}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            themeClass.value,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle as never}
        />
      )
    }
  },
})

export default Markdown
