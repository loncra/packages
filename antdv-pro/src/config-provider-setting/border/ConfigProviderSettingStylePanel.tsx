import {defineComponent} from 'vue'
import {BlockOutlined, BorderOutlined} from '@antdv-next/icons'
import {Collapse, CollapsePanel, Input, Space} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import {useTokenSetting} from '../useTokenSetting'
import ConfigProviderSettingRow from '../panes/ConfigProviderSettingRow'
import ConfigProviderSettingScalePanel from '../panes/ConfigProviderSettingScalePanel'

const ConfigProviderSettingStylePanel = defineComponent({
  name: 'LConfigProviderSettingStylePanel',
  props: {
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('ConfigProviderSetting')
    const {tokenValue, setToken} = useTokenSetting()

    const panelBlockCls = classNames(
      props.hashId,
      props.cssVarCls,
      `${props.prefixCls}-panel-block`,
    )

    return () => (
      <Collapse>
        <CollapsePanel key="borderRadius" header={locale.value.border.radius} extra={<BorderOutlined />}>
          <ConfigProviderSettingScalePanel
            prefixCls={props.prefixCls}
            hashId={props.hashId}
            cssVarCls={props.cssVarCls}
            base="borderRadius"
            steps={['sm', 'lg', 'xs']}
            defaultLabel={`${locale.value.defaultText}${locale.value.border.radius}`}
          />
        </CollapsePanel>
        <CollapsePanel key="boxShadow" header={locale.value.border.shadow} extra={<BlockOutlined />}>
          <Space orientation="vertical" class={panelBlockCls}>
            {(
              [
                {key: 'boxShadow', label: `${locale.value.defaultText}${locale.value.border.shadow}`},
                {key: 'boxShadowSecondary', label: locale.value.border.shadowSecondary},
                {key: 'boxShadowTertiary', label: locale.value.border.shadowTertiary},
              ] as const
            ).map((item) => (
              <ConfigProviderSettingRow
                key={item.key}
                prefixCls={props.prefixCls}
                hashId={props.hashId}
                cssVarCls={props.cssVarCls}
                label={item.label}
              >
                <Input
                  class={classNames(props.hashId, props.cssVarCls, `${props.prefixCls}-token-input`)}
                  value={String(tokenValue(item.key) ?? '')}
                  onChange={(event) => setToken(item.key, (event.target as HTMLInputElement).value)}
                />
              </ConfigProviderSettingRow>
            ))}
          </Space>
        </CollapsePanel>
      </Collapse>
    )
  },
})

export default ConfigProviderSettingStylePanel
