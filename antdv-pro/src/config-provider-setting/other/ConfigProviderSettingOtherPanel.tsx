import {computed, defineComponent} from 'vue'
import {BgColorsOutlined, EyeOutlined} from '@antdv-next/icons'
import {
    Collapse,
    CollapsePanel,
    ColorPicker,
    Flex,
    InputNumber,
    Select,
    Space,
    Switch,
    TypographyText
} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import {useAntdvConfig} from '../../config-provider/useAntdvConfig'
import {useTokenSetting} from '../useTokenSetting'
import ConfigProviderSettingRow from '../panes/ConfigProviderSettingRow'

const ConfigProviderSettingOtherPanel = defineComponent({
  name: 'LConfigProviderSettingOtherPanel',
  props: {
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('ConfigProviderSetting')
    const config = useAntdvConfig()
    const {booleanValue, colorValue, numberValue, setToken} = useTokenSetting()

    const panelBlockCls = classNames(
      props.hashId,
      props.cssVarCls,
      `${props.prefixCls}-panel-block`,
    )

    const componentSizeOptions = computed(() => [
      {name: locale.value.size.large, value: 'large'},
      {name: locale.value.size.middle, value: 'middle'},
      {name: locale.value.size.small, value: 'small'},
    ])

    const presetColors = [
      'blue',
      'purple',
      'cyan',
      'red',
      'orange',
      'yellow',
      'green',
      'magenta',
      'pink',
      'volcano',
      'geekblue',
      'lime',
      'gold',
    ] as const

    return () => (
      <Space orientation="vertical" class={panelBlockCls}>
        <Flex justify="space-between" align="center">
          <TypographyText strong>{locale.value.componentSize}</TypographyText>
          <Select
            value={config.state.componentSize}
            options={componentSizeOptions.value}
            fieldNames={{label: 'name'}}
            onChange={(value) => config.setComponentSize(value as never)}
          />
        </Flex>
        <Flex justify="space-between" align="center">
          <TypographyText strong>{locale.value.wireframe}</TypographyText>
          <Switch
            checked={booleanValue('wireframe')}
            checkedChildren={locale.value.open}
            unCheckedChildren={locale.value.close}
            onChange={(value: boolean) => setToken('wireframe', value)}
          />
        </Flex>
        <Collapse>
          <CollapsePanel key="presetColor" header={locale.value.color.prepare} extra={<BgColorsOutlined />}>
            <Space orientation="vertical" class={panelBlockCls}>
              {presetColors.map((color) => (
                <ConfigProviderSettingRow
                  key={color}
                  prefixCls={props.prefixCls}
                  hashId={props.hashId}
                  cssVarCls={props.cssVarCls}
                  label={locale.value.color.other[color]}
                >
                  <ColorPicker
                    size="large"
                    value={colorValue(color)}
                    onChange={(next) => setToken(color, next.toHexString())}
                  />
                </ConfigProviderSettingRow>
              ))}
            </Space>
          </CollapsePanel>
          <CollapsePanel key="transparency" header={locale.value.transparency.text} extra={<EyeOutlined />}>
            <Space orientation="vertical" class={panelBlockCls}>
              <ConfigProviderSettingRow
                prefixCls={props.prefixCls}
                hashId={props.hashId}
                cssVarCls={props.cssVarCls}
                label={locale.value.transparency.loading}
              >
                <InputNumber
                  value={numberValue('opacityLoading')}
                  onChange={(value) => setToken('opacityLoading', value)}
                />
              </ConfigProviderSettingRow>
              <ConfigProviderSettingRow
                prefixCls={props.prefixCls}
                hashId={props.hashId}
                cssVarCls={props.cssVarCls}
                label={locale.value.transparency.image}
              >
                <InputNumber
                  value={numberValue('opacityImage')}
                  onChange={(value) => setToken('opacityImage', value)}
                />
              </ConfigProviderSettingRow>
            </Space>
          </CollapsePanel>
        </Collapse>
      </Space>
    )
  },
})

export default ConfigProviderSettingOtherPanel
