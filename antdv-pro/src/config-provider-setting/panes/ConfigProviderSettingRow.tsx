import {defineComponent} from 'vue'
import {Flex, TypographyText} from 'antdv-next'
import {classNames} from '@loncra/antdv'

const ConfigProviderSettingRow = defineComponent({
  name: 'LConfigProviderSettingRow',
  props: {
    label: {type: [String, Number, Object, Array], required: true},
    sub: String,
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props, {slots}) {
    const labelCls = classNames(props.hashId, props.cssVarCls, `${props.prefixCls}-row-label`)
    return () => (
      <Flex justify="space-between" align="center" gap={8}>
        <Flex vertical gap={2}>
          <TypographyText strong class={labelCls}>
            {props.label}
          </TypographyText>
          {props.sub ? (
            <TypographyText
              type="secondary"
              class={classNames(props.hashId, props.cssVarCls, `${props.prefixCls}-row-sub`)}
            >
              {props.sub}
            </TypographyText>
          ) : null}
        </Flex>
        {slots.default?.()}
      </Flex>
    )
  },
})

export default ConfigProviderSettingRow
