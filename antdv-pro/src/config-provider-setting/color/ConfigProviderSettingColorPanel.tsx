import {defineComponent} from 'vue'
import {Collapse, CollapsePanel, ColorPicker, Space} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import {useTokenSetting} from '../useTokenSetting'
import ConfigProviderSettingRow from '../panes/ConfigProviderSettingRow'

const ConfigProviderSettingColorPanel = defineComponent({
  name: 'LConfigProviderSettingColorPanel',
  props: {
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('ConfigProviderSetting')
    const {colorValue, setToken} = useTokenSetting()

    const panelBlockCls = classNames(
      props.hashId,
      props.cssVarCls,
      `${props.prefixCls}-panel-block`,
    )

    const items = [
      {suffix: 'Active', key: 'active'},
      {suffix: 'Bg', key: 'bg'},
      {suffix: 'BgHover', key: 'bgHover'},
      {suffix: 'Border', key: 'border'},
      {suffix: 'BorderHover', key: 'borderHover'},
      {suffix: 'Hover', key: 'hover'},
      {suffix: 'Text', key: 'colorText'},
      {suffix: 'TextActive', key: 'colorTextActive'},
      {suffix: 'TextHover', key: 'colorTextHover'},
    ] as const
    const keys = ['colorPrimary', 'colorSuccess', 'colorError', 'colorWarning'] as const

    return () => (
      <Collapse>
        {keys.map((key) => (
          <CollapsePanel
            key={key}
            header={locale.value.color[key]}
            extra={
              <span onClick={(event: MouseEvent) => event.stopPropagation()}>
                <ColorPicker
                  size="small"
                  value={colorValue(key)}
                  onChange={(color) => setToken(key, color.toHexString())}
                />
              </span>
            }
          >
            <Space orientation="vertical" class={panelBlockCls}>
              {items.map((item) => {
                const meta = locale.value.color[item.key]
                return (
                  <ConfigProviderSettingRow
                    key={item.suffix}
                    prefixCls={props.prefixCls}
                    hashId={props.hashId}
                    cssVarCls={props.cssVarCls}
                    label={meta.title}
                    sub={meta.subTitle}
                  >
                    <ColorPicker
                      size="large"
                      value={colorValue(key + item.suffix)}
                      onChange={(color) => setToken(key + item.suffix, color.toHexString())}
                    />
                  </ConfigProviderSettingRow>
                )
              })}
            </Space>
          </CollapsePanel>
        ))}
      </Collapse>
    )
  },
})

export default ConfigProviderSettingColorPanel
