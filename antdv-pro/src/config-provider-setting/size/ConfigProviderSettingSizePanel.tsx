import {defineComponent} from 'vue'
import {
    ColumnHeightOutlined,
    ColumnWidthOutlined,
    FontSizeOutlined,
    LayoutOutlined,
    LineHeightOutlined,
} from '@antdv-next/icons'
import {Collapse, CollapsePanel, InputNumber, Space} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import {useTokenSetting} from '../useTokenSetting'
import ConfigProviderSettingRow from '../panes/ConfigProviderSettingRow'
import ConfigProviderSettingScalePanel from '../panes/ConfigProviderSettingScalePanel'

const ConfigProviderSettingSizePanel = defineComponent({
  name: 'LConfigProviderSettingSizePanel',
  props: {
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('ConfigProviderSetting')
    const {numberValue, setToken} = useTokenSetting()

    const panelBlockCls = classNames(
      props.hashId,
      props.cssVarCls,
      `${props.prefixCls}-panel-block`,
    )

    /** `{number}` 这类占位替换（pro 的 locale 不做 ICU，与 `withCount` 一个路子） */
    function fill(template: string, params: Record<string, string | number>): string {
      return template.replace(/\{(\w+)}/g, (_match, key: string) => String(params[key] ?? ''))
    }

    const steps = ['lg', 'md', 'sm', 'xl', 'xs', 'xxl', 'xxs'] as const

    return () => (
      <Collapse>
        <CollapsePanel key="size" header={locale.value.size.common} extra={<ColumnHeightOutlined />}>
          <ConfigProviderSettingScalePanel
            prefixCls={props.prefixCls}
            hashId={props.hashId}
            cssVarCls={props.cssVarCls}
            base="size"
            steps={steps}
          />
        </CollapsePanel>
        <CollapsePanel key="fontSize" header={locale.value.font.text} extra={<FontSizeOutlined />}>
          <Space orientation="vertical" class={panelBlockCls}>
            <ConfigProviderSettingScalePanel
              prefixCls={props.prefixCls}
              hashId={props.hashId}
              cssVarCls={props.cssVarCls}
              base="fontSize"
              steps={['sm', 'lg', 'xl']}
            />
            {Array.from({length: 5}, (_, index) => (
              <ConfigProviderSettingRow
                key={index}
                prefixCls={props.prefixCls}
                hashId={props.hashId}
                cssVarCls={props.cssVarCls}
                label={fill(locale.value.font.heading, {number: index + 1})}
              >
                <InputNumber
                  value={numberValue(`fontSizeHeading${index + 1}`)}
                  onChange={(value) => setToken(`fontSizeHeading${index + 1}`, value)}
                />
              </ConfigProviderSettingRow>
            ))}
          </Space>
        </CollapsePanel>
        <CollapsePanel key="lineHeight" header={locale.value.lineHeight.text} extra={<LineHeightOutlined />}>
          <Space orientation="vertical" class={panelBlockCls}>
            <ConfigProviderSettingScalePanel
              prefixCls={props.prefixCls}
              hashId={props.hashId}
              cssVarCls={props.cssVarCls}
              base="lineHeight"
              steps={['sm', 'lg']}
            />
            {Array.from({length: 5}, (_, index) => (
              <ConfigProviderSettingRow
                key={index}
                prefixCls={props.prefixCls}
                hashId={props.hashId}
                cssVarCls={props.cssVarCls}
                label={fill(locale.value.lineHeight.heading, {number: index + 1})}
              >
                <InputNumber
                  value={numberValue(`lineHeightHeading${index + 1}`)}
                  onChange={(value) => setToken(`lineHeightHeading${index + 1}`, value)}
                />
              </ConfigProviderSettingRow>
            ))}
          </Space>
        </CollapsePanel>
        <CollapsePanel key="margin" header={locale.value.margin} extra={<ColumnWidthOutlined />}>
          <ConfigProviderSettingScalePanel
            prefixCls={props.prefixCls}
            hashId={props.hashId}
            cssVarCls={props.cssVarCls}
            base="margin"
            steps={steps}
          />
        </CollapsePanel>
        <CollapsePanel key="padding" header={locale.value.padding} extra={<LayoutOutlined />}>
          <ConfigProviderSettingScalePanel
            prefixCls={props.prefixCls}
            hashId={props.hashId}
            cssVarCls={props.cssVarCls}
            base="padding"
            steps={['lg', 'md', 'sm', 'xl', 'xs', 'xxs']}
          />
        </CollapsePanel>
      </Collapse>
    )
  },
})

export default ConfigProviderSettingSizePanel
