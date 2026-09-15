import type {ComputedRef, InjectionKey} from 'vue'
import type {ClientConfig} from '@loncra/client'

export const CLIENT_CONFIG_KEY: InjectionKey<ComputedRef<ClientConfig>> = Symbol('loncraClientConfig')
