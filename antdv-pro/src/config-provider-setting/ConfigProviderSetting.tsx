import {computed, defineComponent, type PropType, ref, type SlotsType} from 'vue'
import {Col, FormItem, Row, Select, SpaceAddon, SpaceCompact, Switch, Tabs, theme} from 'antdv-next'
import {BgColorsOutlined, FontSizeOutlined, FormatPainterOutlined, SettingOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../_util/useLocale'
import Form from '../form'
import {useAntdvConfig} from '../config-provider/useAntdvConfig'
import type {AntdvThemeMode} from '../config-provider'
import type {ConfigProviderSettingProps, ConfigProviderSettingSlots} from './types'
import useStyle from './style'
import ConfigProviderSettingColorPanel from './color/ConfigProviderSettingColorPanel'
import ConfigProviderSettingSizePanel from './size/ConfigProviderSettingSizePanel'
import ConfigProviderSettingStylePanel from './border/ConfigProviderSettingStylePanel'
import ConfigProviderSettingOtherPanel from './other/ConfigProviderSettingOtherPanel'

const ConfigProviderSetting = defineComponent({
  name: 'LConfigProviderSetting',
  inheritAttrs: false,
  props: {
    locales: Array as PropType<ConfigProviderSettingProps['locales']>,
    classes: Object as PropType<ConfigProviderSettingProps['classes']>,
    styles: Object as PropType<ConfigProviderSettingProps['styles']>,
  },
  slots: Object as SlotsType<ConfigProviderSettingSlots>,
  setup(props, {attrs, slots}) {
    const locale = useLocale('ConfigProviderSetting')
    const config = useAntdvConfig()
    const {token} = theme.useToken()
    const antdConfig = useConfig()
    const prefixCls = computed(() =>
      antdConfig.value.getPrefixCls('config-provider-setting', 'loncra-config-provider-setting'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const activeTab = ref('color')

    const themeOptions = computed(() => [
      {name: locale.value.theme.system, value: 'system'},
      {name: locale.value.theme.dark, value: 'dark'},
      {name: locale.value.theme.light, value: 'light'},
    ])
    const tabItems = computed(() => [
      {key: 'color', label: locale.value.tabs.color, icon: <BgColorsOutlined />},
      {key: 'size', label: locale.value.tabs.size, icon: <FontSizeOutlined />},
      {key: 'style', label: locale.value.tabs.style, icon: <FormatPainterOutlined />},
      {key: 'other', label: locale.value.tabs.other, icon: <SettingOutlined />},
    ])

    const panelProps = computed(() => ({
      prefixCls: prefixCls.value,
      hashId: hashId.value,
      cssVarCls: cssVarCls.value,
    }))

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <div
          {...rest}
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, attrClass)}
          style={attrStyle}
        >
          <Form classes={props.classes?.form} styles={props.styles?.form}>
            <Row gutter={[Number(token.value.marginMD), Number(token.value.marginMD)]}>
              {props.locales?.length ? (
                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                  <FormItem label={locale.value.lang}>
                    <Select
                      value={config.state.locale}
                      options={props.locales}
                      fieldNames={{label: 'name'}}
                      onChange={(value) => config.setLocale(String(value))}
                    />
                  </FormItem>
                </Col>
              ) : null}
              <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                <FormItem label={locale.value.theme.text}>
                  <SpaceCompact block>
                    <Select
                      value={config.state.mode}
                      options={themeOptions.value}
                      fieldNames={{label: 'name'}}
                      onChange={(value) => config.setMode(value as AntdvThemeMode)}
                    />
                    <SpaceAddon>{locale.value.compact} :</SpaceAddon>
                    <SpaceAddon>
                      <Switch
                        size="small"
                        checked={config.state.compact}
                        checkedChildren={locale.value.open}
                        unCheckedChildren={locale.value.close}
                        onChange={(value: boolean) => config.setCompact(value)}
                      />
                    </SpaceAddon>
                  </SpaceCompact>
                </FormItem>
              </Col>
            </Row>
            {slots.extra?.()}
          </Form>
          <Tabs
            centered
            classes={props.classes?.tabs}
            styles={props.styles?.tabs}
            activeKey={activeTab.value}
            items={tabItems.value}
            onChange={(key) => {
              activeTab.value = String(key)
            }}
            v-slots={{
              contentRender: (arg: {item?: {key?: unknown}}) => {
                const key = String(arg.item?.key ?? activeTab.value)
                if (key === 'color') {
                  return <ConfigProviderSettingColorPanel {...panelProps.value} />
                }
                if (key === 'size') {
                  return <ConfigProviderSettingSizePanel {...panelProps.value} />
                }
                if (key === 'style') {
                  return <ConfigProviderSettingStylePanel {...panelProps.value} />
                }
                return <ConfigProviderSettingOtherPanel {...panelProps.value} />
              },
            }}
          />
        </div>
      )
    }
  },
})

export default ConfigProviderSetting
