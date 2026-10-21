import {defineComponent, type PropType, ref, type SetupContext} from 'vue'
import {Form as AntdvForm, type FormInstance, type FormProps} from 'antdv-next'
import {useAntdvConfig} from '../config-provider/useAntdvConfig'
import type {AntdvFormLayout} from '../config-provider/types'

const Form = defineComponent(
  (props: FormProps, {attrs, slots, expose}: SetupContext) => {
    const config = useAntdvConfig()
    const formRef = ref<FormInstance>()

    expose(
      new Proxy({} as Record<string, unknown>, {
        has: (_target, key) =>
          !(typeof key === 'symbol' || key === 'then' || String(key).startsWith('__v_')),
        get: (_target, key) => {
          if (typeof key === 'symbol' || key === 'then' || String(key).startsWith('__v_')) {
            return undefined
          }
          const instance = formRef.value as unknown as
            | Record<string | number | symbol, unknown>
            | undefined
          if (!instance) {
            return () => undefined
          }
          const value = instance[key]
          return typeof value === 'function' ? value.bind(instance) : value
        },
      }),
    )

    return () => (
      <AntdvForm {...attrs} ref={formRef} layout={props.layout ?? config.state.formLayout}>
        {slots.default?.()}
      </AntdvForm>
    )
  },
  {
    name: 'LForm',
    inheritAttrs: false,
    props: {
      layout: {type: String as PropType<AntdvFormLayout>, default: undefined},
    },
  },
)

export default Form
