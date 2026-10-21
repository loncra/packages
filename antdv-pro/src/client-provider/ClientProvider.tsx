import {computed, defineComponent, type PropType, provide, type SlotsType, watchEffect} from 'vue'
import type {ClientConfig, FormValueConvert, HttpClient, RuntimeMode} from '@loncra/client'
import {configureClient} from '@loncra/client'
import {CLIENT_CONFIG_KEY, type ClientProviderSlots} from './types'

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
  slots: Object as SlotsType<ClientProviderSlots>,
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
