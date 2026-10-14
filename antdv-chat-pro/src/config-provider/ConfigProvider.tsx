import {defineComponent} from 'vue'
import {XProvider} from '@antdv-next/x'
import {antdvConfigProviderProps, createAntdvConfig, Provider as LProvider,} from '@loncra/antdv-pro'

const Provider = defineComponent({
  name: 'LChatProvider',
  inheritAttrs: false,
  props: {...antdvConfigProviderProps},
  setup(props, {slots}) {
    const config = props.antdvConfig ?? createAntdvConfig()

    return () => (
      <XProvider locale={props.localeMessage} theme={config.themeConfig.value}>
        <LProvider {...props} antdvConfig={config}>
          {slots.default?.()}
        </LProvider>
      </XProvider>
    )
  },
})

export default Provider
