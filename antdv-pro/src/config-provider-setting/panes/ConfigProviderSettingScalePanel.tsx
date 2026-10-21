import {defineComponent, type PropType} from 'vue'
import {InputNumber, Space} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import {useTokenSetting} from '../useTokenSetting'
import ConfigProviderSettingRow from './ConfigProviderSettingRow'

const ConfigProviderSettingScalePanel = defineComponent({
  name: 'LConfigProviderSettingScalePanel',
  props: {
    base: {type: String, required: true},
    steps: {type: Array as PropType<readonly string[]>, required: true},
    defaultLabel: String,
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('ConfigProviderSetting')
    const {numberValue, setToken} = useTokenSetting()

    const sizeLabel = (step: string): string =>
      step ? locale.value.size[step as keyof typeof locale.value.size] : ''

    const panelBlockCls = classNames(
      props.hashId,
      props.cssVarCls,
      `${props.prefixCls}-panel-block`,
    )

    return () => (
      <Space orientation="vertical" class={panelBlockCls}>
        <ConfigProviderSettingRow
          prefixCls={props.prefixCls}
          hashId={props.hashId}
          cssVarCls={props.cssVarCls}
          label={props.defaultLabel ?? locale.value.defaultText}
        >
          <InputNumber
            value={numberValue(props.base)}
            onChange={(value) => setToken(props.base, value)}
          />
        </ConfigProviderSettingRow>
        {props.steps.map((step) => (
          <ConfigProviderSettingRow
            key={step}
            prefixCls={props.prefixCls}
            hashId={props.hashId}
            cssVarCls={props.cssVarCls}
            label={sizeLabel(step)}
          >
            <InputNumber
              value={numberValue(props.base + step.toUpperCase())}
              onChange={(value) => setToken(props.base + step.toUpperCase(), value)}
            />
          </ConfigProviderSettingRow>
        ))}
      </Space>
    )
  },
})

export default ConfigProviderSettingScalePanel
