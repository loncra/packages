import {computed, defineComponent, type PropType, provide, watchEffect} from 'vue'
import type {ClientConfig, FormValueConvert, HttpClient, RuntimeMode} from '@loncra/client'
import {configureClient} from '@loncra/client'
import {CLIENT_CONFIG_KEY} from './types'

export interface ClientProviderProps extends ClientConfig {}

export interface ClientProviderSlots {
  default?: () => unknown
}

/**
 * HTTP / 运行时配置 Provider。
 *
 * 与 CrudConfigProvider 分层：本组件只负责客户端配置（http、runtimeMode、token、
 * 附件路径、上传分片等），权限 / 标题 / 导出仍由 CrudConfigProvider 负责。
 *
 * setup 中即完成配置，因此早于应用内任何请求；props 变更（如切换企业）会自动重配。
 */
const ClientProvider = defineComponent({
  name: 'LClientProvider',
  inheritAttrs: false,
  props: {
    http: {type: Object as PropType<HttpClient>, required: true},
    runtimeMode: {type: String as PropType<RuntimeMode>, required: true},
    getAccessToken: Function as PropType<ClientConfig['getAccessToken']>,
    resourcePath: String,
    openAttachmentUrl: Function as PropType<ClientConfig['openAttachmentUrl']>,
    formValueConvert: Function as PropType<FormValueConvert>,
    uploadBlockSize: Number,
  },
  setup(props, {slots}) {
    const toConfig = (): ClientConfig => ({
      http: props.http,
      runtimeMode: props.runtimeMode,
      getAccessToken: props.getAccessToken,
      resourcePath: props.resourcePath,
      openAttachmentUrl: props.openAttachmentUrl,
      formValueConvert: props.formValueConvert,
      uploadBlockSize: props.uploadBlockSize,
    })

    watchEffect(() => configureClient(toConfig()))
    provide(
      CLIENT_CONFIG_KEY,
      computed<ClientConfig>(() => toConfig()),
    )
    return () => slots.default?.()
  },
})

export default ClientProvider
