import {computed, type ComputedRef, inject} from 'vue'
import type {ClientConfig} from '@loncra/client'
import {CLIENT_CONFIG_KEY} from './types'

export function useClient(): ComputedRef<ClientConfig | undefined> {
  const injected = inject(CLIENT_CONFIG_KEY, undefined)
  return computed(() => injected?.value)
}
