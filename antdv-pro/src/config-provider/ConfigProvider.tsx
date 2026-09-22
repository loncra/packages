import {defineComponent, type PropType} from 'vue'
import {ConfigProvider as AntdvNextConfigProvider} from 'antdv-next'
import {XProvider} from '@antdv-next/x'
import ClientProvider, {type ClientProviderProps} from '../client-provider'
import CrudConfigProvider, {type CrudConfigProviderProps} from '../crud-config-provider'
import {createAntdvConfig, provideAntdvConfig} from './useAntdvConfig'
import type {AntdvConfig} from './types'

/**
 * 统一入口：一层顶原来的「客户端配置 + antdv 主题 + CRUD 配置」。
 *
 * 分工与旧件一一对应：
 * - `ClientProvider`（setup 里同步 `configureClient`）——HTTP / 运行时；
 * - `XProvider`（`@antdv-next/x`）——locale / componentSize / theme（与宿主原来的 `ax-provider` 同源）；
 * - `CrudConfigProvider`——权限 / i18n / 标题 / 跳转 / 字段组件表。
 *
 * antdv 配置（主题 / 语言 / 尺寸 / token / formLayout / detailLayout）来自 `antdvConfig`：
 * 宿主传自己初始化的那份（就能自己决定从哪读、往哪存），不传就用内部默认实例。
 */
const AntdvConfigProvider = defineComponent({
  name: 'LProvider',
  inheritAttrs: false,
  props: {
    // ── 客户端（ClientProvider） ──
    http: {type: Object as PropType<ClientProviderProps['http']>, required: true},
    runtimeMode: {type: String as PropType<ClientProviderProps['runtimeMode']>, required: true},
    getAccessToken: Function as PropType<ClientProviderProps['getAccessToken']>,
    resourcePath: String,
    openAttachmentUrl: Function as PropType<ClientProviderProps['openAttachmentUrl']>,
    formValueConvert: Function as PropType<ClientProviderProps['formValueConvert']>,
    uploadBlockSize: Number,
    // ── CRUD 配置（CrudConfigProvider） ──
    hasPermission: Function as PropType<CrudConfigProviderProps['hasPermission']>,
    i18nResolver: Function as PropType<CrudConfigProviderProps['i18nResolver']>,
    resolveDefaultTitle: Function as PropType<CrudConfigProviderProps['resolveDefaultTitle']>,
    onNavigate: Function as PropType<CrudConfigProviderProps['onNavigate']>,
    fieldComponents: Object as PropType<CrudConfigProviderProps['fieldComponents']>,
    formatters: Object as PropType<CrudConfigProviderProps['formatters']>,
    dateFormat: String,
    dateTimeFormat: String,
    // ── antdv 配置 ──
    antdvConfig: Object as PropType<AntdvConfig>,
    /** antdv 的 locale 对象（宿主从自己的 i18n 里取；pro 不猜 i18n） */
    localeMessage: Object as PropType<object>,
  },
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
            <XProvider locale={props.localeMessage} theme={config.themeConfig.value}>
              {/*
                `componentSize` 只有 antdv 的 `ConfigProvider` 认（`XProvider` 的 props 里没有它，
                宿主原来把 `:component-size` 传给它其实是空转）⇒ 里面再套一层，尺寸才真正生效。
              */}
              <AntdvNextConfigProvider
                // antdv 的 locale 对象由宿主保证形状（`localeMessage` 声明成 `object`，
                // 免得把 antdv 的 Locale 类型透进宿主的 i18n 层）
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
            </XProvider>
          ),
        }}
      </ClientProvider>
    )
  },
})

export default AntdvConfigProvider
