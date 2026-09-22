import {computed, defineComponent, type PropType, ref, type VNodeChild} from 'vue'
import {
  Col,
  Collapse,
  CollapsePanel,
  ColorPicker,
  Flex,
  Form,
  FormItem,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  SpaceAddon,
  SpaceCompact,
  Switch,
  Tabs,
  theme,
  TypographyText,
} from 'antdv-next'
import {
  BgColorsOutlined,
  BlockOutlined,
  BorderOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  EyeOutlined,
  FontSizeOutlined,
  FormatPainterOutlined,
  LayoutOutlined,
  LineHeightOutlined,
  SettingOutlined,
} from '@antdv-next/icons'
import {useLocale} from '../_util/useLocale'
import {useAntdvConfig} from '../config-provider/useAntdvConfig'
import type {AntdvThemeMode} from '../config-provider'
import type {ConfigProviderSettingProps} from './types'

/** 面板里的控件都占满一行 */
const FULL_WIDTH = {width: '100%'} as const

/** `{number}` 这类占位替换（pro 的 locale 不做 ICU，与 `withCount` 一个路子） */
function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)}/g, (_match, key: string) => String(params[key] ?? ''))
}

/**
 * antdv 全局配置面板：主题模式 / 紧凑 / 组件尺寸 / 语言，以及 token 分组的细项调节。
 *
 * - 数据全走 `useAntdvConfig()`（谁持有配置由 `LProvider` 决定；持久化在宿主）；
 * - "当前值" = 配置里的覆盖值 ?? 当前生效 token（`theme.useToken()` ⇒ 面板必须挂在 `LProvider` 之内）；
 * - 文案走 pro 的 locale（`ConfigProviderSetting.*`），图标用 `@antdv-next/icons`；
 * - 宿主自己的项（侧栏宽度、创建成功后的行为…）走 `#extra` 插槽。
 */
const ConfigProviderSetting = defineComponent({
  name: 'LConfigProviderSetting',
  inheritAttrs: false,
  props: {
    locales: Array as PropType<ConfigProviderSettingProps['locales']>,
  },
  setup(props, {slots}) {
    const locale = useLocale('ConfigProviderSetting')
    const config = useAntdvConfig()
    const {token} = theme.useToken()
    const activeTab = ref('color')

    const themeOptions = computed(() => [
      {name: locale.value.theme.system, value: 'system'},
      {name: locale.value.theme.dark, value: 'dark'},
      {name: locale.value.theme.light, value: 'light'},
    ])
    const componentSizeOptions = computed(() => [
      {name: locale.value.size.large, value: 'large'},
      {name: locale.value.size.middle, value: 'middle'},
      {name: locale.value.size.small, value: 'small'},
    ])
    const tabItems = computed(() => [
      {key: 'color', label: locale.value.tabs.color, icon: <BgColorsOutlined />},
      {key: 'size', label: locale.value.tabs.size, icon: <FontSizeOutlined />},
      {key: 'style', label: locale.value.tabs.style, icon: <FormatPainterOutlined />},
      {key: 'other', label: locale.value.tabs.other, icon: <SettingOutlined />},
    ])

    /** 覆盖值优先，否则用当前生效的 token 值 */
    function tokenValue(key: string): string | number | boolean | undefined {
      const fallback = (
        token.value as unknown as Record<string, string | number | boolean | undefined>
      )[key]
      return config.state.token[key] ?? fallback
    }

    const numberValue = (key: string): number | undefined =>
      tokenValue(key) == null ? undefined : Number(tokenValue(key))

    const colorValue = (key: string): string | undefined =>
      tokenValue(key) == null ? undefined : String(tokenValue(key))

    const booleanValue = (key: string): boolean => Boolean(tokenValue(key))

    function setToken(key: string, value: unknown): void {
      config.setTokenValue(key, value as string | number | boolean)
    }

    /** 尺寸档位的文案（`size.lg` / `size.md` …） */
    const sizeLabel = (step: string): string =>
      step ? locale.value.size[step as keyof typeof locale.value.size] : ''

    /** 标签 + 控件一行（标签**不许被控件挤换行**：长 label 如"2 级元素阴影"） */
    function row(label: VNodeChild, control: VNodeChild): VNodeChild {
      return (
        <Flex justify="space-between" align="center" gap={8}>
          <TypographyText strong style={{whiteSpace: 'nowrap'}}>
            {label}
          </TypographyText>
          {control}
        </Flex>
      )
    }

    function numberRow(label: string, key: string): VNodeChild {
      return row(
        label,
        <InputNumber value={numberValue(key)} onChange={(value) => setToken(key, value)} />,
      )
    }

    function colorPicker(key: string): VNodeChild {
      return (
        <ColorPicker
          size="large"
          value={colorValue(key)}
          onChange={(color) => setToken(key, color.toHexString())}
        />
      )
    }

    /**
     * 颜色细项：标题 + 一句说明。
     *
     * ⚠️ **inline style 里的数字尺寸必须自己带单位**：Vue 的 `setStyle` 对数字不补 `px`
     * （`style.fontSize = 12` ⇒ `font-size: 12` 非法 ⇒ 被浏览器直接丢掉），所以写
     * `` `${token.value.fontSizeSM}px` `` 而不是裸数字。（`0` 这种除外，`"0"` 本身合法。）
     */
    function colorRow(item: {title: string; subTitle: string}, key: string): VNodeChild {
      return row(
        <Flex vertical gap={2}>
          <TypographyText strong style={{whiteSpace: 'nowrap'}}>
            {item.title}
          </TypographyText>
          <TypographyText type="secondary" style={{ fontSize: `${token.value.fontSizeSM}px`,}}
          >
            {item.subTitle}
          </TypographyText>
        </Flex>,
        colorPicker(key),
      )
    }

    /** 预设色板一行（只有名字，没有说明） */
    function presetColorRow(label: string, key: string): VNodeChild {
      return row(
        <TypographyText strong style={{whiteSpace: 'nowrap'}}>
          {label}
        </TypographyText>,
        colorPicker(key),
      )
    }

    /**
     * 一组"默认值 + 若干档位"的数值 token（`size` / `fontSize` / `margin` / `borderRadius`…）。
     *
     * ⚠️ 尺寸档位是**全大写**后缀：`sizeLG` / `marginLG` / `fontSizeSM` / `lineHeightSM`
     * （antdv-next 的 `interface/maps/size.d.ts` / `font.d.ts` / `alias.d.ts`）。
     * 与颜色细项那套（`colorPrimaryActive`，**首字母大写**）不是同一套规则，别混用。
     */
    function scalePanel(base: string, steps: readonly string[], defaultLabel?: string): VNodeChild {
      return (
        <Space orientation="vertical" style={FULL_WIDTH}>
          {numberRow(defaultLabel ?? locale.value.defaultText, base)}
          {steps.map((step) => numberRow(sizeLabel(step), base + step.toUpperCase()))}
        </Space>
      )
    }

    /** 颜色页签：每个色系一块（激活 / 背景 / 边框 / 文字等细项） */
    function colorPanel(): VNodeChild {
      /**
       * token 后缀 ↔ locale 键：**两套命名规则不同** ——
       * token 是首字母大写（`colorPrimary` + `Active` = `colorPrimaryActive`），
       * locale 键沿用宿主那套（`colorText` / `colorTextActive` / `colorTextHover`）。
       */
      const rows = [
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
      return (
        <Collapse>
          {keys.map((key) => (
            <CollapsePanel
              key={key}
              header={locale.value.color[key]}
              // 卡头也能直接改主色；阻止冒泡免得顺带展开/收起
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
              <Space orientation="vertical" style={FULL_WIDTH}>
                {rows.map((item) => colorRow(locale.value.color[item.key], key + item.suffix))}
              </Space>
            </CollapsePanel>
          ))}
        </Collapse>
      )
    }

    function sizePanel(): VNodeChild {
      const steps = ['lg', 'md', 'sm', 'xl', 'xs', 'xxl', 'xxs'] as const
      return (
        <Collapse>
          <CollapsePanel key="size" header={locale.value.size.common} extra={<ColumnHeightOutlined />}>
            {scalePanel('size', steps)}
          </CollapsePanel>
          <CollapsePanel key="fontSize" header={locale.value.font.text} extra={<FontSizeOutlined />}>
            <Space orientation="vertical" style={FULL_WIDTH}>
              {scalePanel('fontSize', ['sm', 'lg', 'xl'] as const)}
              {Array.from({length: 5}, (_, index) =>
                numberRow(
                  fill(locale.value.font.heading, {number: index + 1}),
                  `fontSizeHeading${index + 1}`,
                ),
              )}
            </Space>
          </CollapsePanel>
          <CollapsePanel key="lineHeight" header={locale.value.lineHeight.text} extra={<LineHeightOutlined />}>
            <Space orientation="vertical" style={FULL_WIDTH}>
              {scalePanel('lineHeight', ['sm', 'lg'] as const)}
              {Array.from({length: 5}, (_, index) =>
                numberRow(
                  fill(locale.value.lineHeight.heading, {number: index + 1}),
                  `lineHeightHeading${index + 1}`,
                ),
              )}
            </Space>
          </CollapsePanel>
          <CollapsePanel key="margin" header={locale.value.margin} extra={<ColumnWidthOutlined />}>
            {scalePanel('margin', steps)}
          </CollapsePanel>
          <CollapsePanel key="padding" header={locale.value.padding} extra={<LayoutOutlined />}>
            {scalePanel('padding', ['lg', 'md', 'sm', 'xl', 'xs', 'xxs'] as const)}
          </CollapsePanel>
        </Collapse>
      )
    }

    function shadowRow(label: string, key: string): VNodeChild {
      return row(
        label,
        <Input
          // 阴影值是长串（`0 6px 16px 0 rgba(…)`），窄了看不清（数字要带单位，见 colorRow 的注释）
          style={{width: '420px'}}
          value={String(tokenValue(key) ?? '')}
          onChange={(event) => setToken(key, (event.target as HTMLInputElement).value)}
        />,
      )
    }

    function stylePanel(): VNodeChild {
      return (
        <Collapse>
          <CollapsePanel key="borderRadius" header={locale.value.border.radius} extra={<BorderOutlined />}>
            {scalePanel(
              'borderRadius',
              ['sm', 'lg', 'xs'] as const,
              // 与宿主一致：「默认圆角」
              `${locale.value.defaultText}${locale.value.border.radius}`,
            )}
          </CollapsePanel>
          <CollapsePanel key="boxShadow" header={locale.value.border.shadow} extra={<BlockOutlined />}>
            <Space orientation="vertical" style={FULL_WIDTH}>
              {shadowRow(`${locale.value.defaultText}${locale.value.border.shadow}`, 'boxShadow')}
              {shadowRow(locale.value.border.shadowSecondary, 'boxShadowSecondary')}
              {shadowRow(locale.value.border.shadowTertiary, 'boxShadowTertiary')}
            </Space>
          </CollapsePanel>
        </Collapse>
      )
    }

    function otherPanel(): VNodeChild {
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
      return (
        <Space orientation="vertical" style={FULL_WIDTH}>
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
              <Space orientation="vertical" style={FULL_WIDTH}>
                {presetColors.map((color) => presetColorRow(locale.value.color.other[color], color))}
              </Space>
            </CollapsePanel>
            <CollapsePanel key="transparency" header={locale.value.transparency.text} extra={<EyeOutlined />}>
              <Space orientation="vertical" style={FULL_WIDTH}>
                {numberRow(locale.value.transparency.loading, 'opacityLoading')}
                {numberRow(locale.value.transparency.image, 'opacityImage')}
              </Space>
            </CollapsePanel>
          </Collapse>
        </Space>
      )
    }

    function renderTab(key: unknown): VNodeChild {
      if (key === 'color') {
        return colorPanel()
      }
      if (key === 'size') {
        return sizePanel()
      }
      if (key === 'style') {
        return stylePanel()
      }
      return otherPanel()
    }

    return () => (
      <>
        <Form layout={config.state.formLayout}>
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
          activeKey={activeTab.value}
          items={tabItems.value}
          onChange={(key) => {
            activeTab.value = String(key)
          }}
          v-slots={{
            contentRender: (arg: {item?: {key?: unknown}}) => renderTab(arg.item?.key),
          }}
        />
      </>
    )
  },
})

export default ConfigProviderSetting
