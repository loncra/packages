import {computed, defineComponent, type PropType, provide} from 'vue'
import type {RestResult} from '@loncra/client/commons'
import {CRUD_CONFIG_KEY, type CrudConfig} from './types'

export interface CrudConfigProviderProps extends CrudConfig {}

export interface CrudConfigProviderSlots {
  default?: () => unknown
}

const CrudConfigProvider = defineComponent({
  name: 'LCrudConfigProvider',
  inheritAttrs: false,
  props: {
    hasPermission: Function as PropType<(permission: string) => boolean>,
    resolveDefaultTitle: Function as PropType<() => {title?: string; icon?: string}>,
    onExported: Function as PropType<(result: RestResult<void>) => void>,
  },
  setup(props, {slots}) {
    provide(
      CRUD_CONFIG_KEY,
      computed<CrudConfig>(() => ({
        hasPermission: props.hasPermission,
        resolveDefaultTitle: props.resolveDefaultTitle,
        onExported: props.onExported,
      })),
    )
    return () => slots.default?.()
  },
})

export default CrudConfigProvider
