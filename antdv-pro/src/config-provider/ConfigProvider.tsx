import {defineComponent, type PropType, type SlotsType} from 'vue'
import {ConfigProvider as AntdvNextConfigProvider} from 'antdv-next'
import ClientProvider, {type ClientProviderProps} from '../client-provider'
import CrudConfigProvider, {type CrudConfigProviderProps} from '../crud-config-provider'
import {createAntdvConfig, provideAntdvConfig} from './useAntdvConfig'
import type {AntdvConfig, AntdvConfigProviderSlots} from './types'

export const antdvConfigProviderProps = {
  http: {type: Object as PropType<ClientProviderProps['http']>, required: true as const},
  runtimeMode: {type: String as PropType<ClientProviderProps['runtimeMode']>, required: true as const},
  getAccessToken: Function as PropType<ClientProviderProps['getAccessToken']>,
  resourcePath: String,
  openAttachmentUrl: Function as PropType<ClientProviderProps['openAttachmentUrl']>,
  formValueConvert: Function as PropType<ClientProviderProps['formValueConvert']>,
  uploadBlockSize: Number,
  hasPermission: Function as PropType<CrudConfigProviderProps['hasPermission']>,
  i18nResolver: Function as PropType<CrudConfigProviderProps['i18nResolver']>,
  resolveDefaultTitle: Function as PropType<CrudConfigProviderProps['resolveDefaultTitle']>,
  onNavigate: Function as PropType<CrudConfigProviderProps['onNavigate']>,
  fieldComponents: Object as PropType<CrudConfigProviderProps['fieldComponents']>,
  formatters: Object as PropType<CrudConfigProviderProps['formatters']>,
  dateFormat: String,
  dateTimeFormat: String,
  antdvConfig: Object as PropType<AntdvConfig>,
  localeMessage: Object as PropType<object>,
}

const AntdvConfigProvider = defineComponent({
  name: 'LProvider',
  inheritAttrs: false,
  props: antdvConfigProviderProps,
  slots: Object as SlotsType<AntdvConfigProviderSlots>,
  setup(props, {slots}) {
    const config = props.antdvConfig ?? createAntdvConfig()
    provideAntdvConfig(config)

    return () => (
      <ClientProvider
        http={props.http}
        runtimeMode={props.runtimeMode}
        getAccessToken={props.getAccessToken}
        resourcePath={props.resourcePath}
        openAttachmentUrl={props.openAttachmentUrl}
        formValueConvert={props.formValueConvert}
        uploadBlockSize={props.uploadBlockSize}
      >
        {{
          default: () => (
            <AntdvNextConfigProvider
              locale={props.localeMessage as never}
              theme={config.themeConfig.value}
              componentSize={config.state.componentSize}
            >
              <CrudConfigProvider
                hasPermission={props.hasPermission}
                i18nResolver={props.i18nResolver}
                resolveDefaultTitle={props.resolveDefaultTitle}
                onNavigate={props.onNavigate}
                fieldComponents={props.fieldComponents}
                formatters={props.formatters}
                dateFormat={props.dateFormat}
                dateTimeFormat={props.dateTimeFormat}
              >
                {slots.default?.()}
              </CrudConfigProvider>
            </AntdvNextConfigProvider>
          ),
        }}
      </ClientProvider>
    )
  },
})

export default AntdvConfigProvider
