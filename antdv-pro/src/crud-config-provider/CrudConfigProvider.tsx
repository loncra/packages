import {computed, defineComponent, type PropType, provide, type VNodeChild} from 'vue'
import type {FieldComponentSpec, ValueFormatter} from '../crud-page/types'
import {CRUD_CONFIG_KEY, type CrudConfig, type CrudNavigateTarget} from './types'

export interface CrudConfigProviderProps extends CrudConfig {}

export interface CrudConfigProviderSlots {
  default?: () => unknown
}

const CrudConfigProvider = defineComponent({
  name: 'LCrudConfigProvider',
  inheritAttrs: false,
  props: {
    hasPermission: Function as PropType<(permission: string) => boolean>,
    i18nResolver: Function as PropType<
      (key: string, named?: Record<string, unknown>) => string
    >,
    resolveDefaultTitle: Function as PropType<() => VNodeChild>,
    onNavigate: Function as PropType<(target: CrudNavigateTarget) => void>,
    fieldComponents: Object as PropType<Record<string, FieldComponentSpec>>,
    formatters: Object as PropType<Record<string, ValueFormatter>>,
    dateFormat: String,
    dateTimeFormat: String,
  },
  setup(props, {slots}) {
    provide(
      CRUD_CONFIG_KEY,
      computed<CrudConfig>(() => ({
        hasPermission: props.hasPermission,
        i18nResolver: props.i18nResolver,
        resolveDefaultTitle: props.resolveDefaultTitle,
        onNavigate: props.onNavigate,
        fieldComponents: props.fieldComponents,
        formatters: props.formatters,
        dateFormat: props.dateFormat,
        dateTimeFormat: props.dateTimeFormat,
      })),
    )
    return () => slots.default?.()
  },
})

export default CrudConfigProvider
