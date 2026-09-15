import {computed, type ComputedRef, inject} from 'vue'
import type {ClientConfig} from '@loncra/client'
import {CLIENT_CONFIG_KEY} from './types'

/** 读取 LClientProvider 注入的客户端配置；未包裹时为 undefined */
export function useClient(): ComputedRef<ClientConfig | undefined> {
  const injected = inject(CLIENT_CONFIG_KEY, undefined)
  return computed(() => injected?.value)
}
