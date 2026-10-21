# ConfigProviderSetting 主题与布局设置面板

antdv 全局配置的设置面板：主题模式 / 紧凑 / 组件尺寸 / 语言 + 按 token 分组的细项调节（颜色 / 尺寸 / 圆角阴影 / 预设色）。内部用 [`Form`](../form/README.md)。

## 何时使用 {#when-to-use}

- 宿主的「界面设置」面板（通常配 `#extra` 放宿主自己的项：侧栏宽度、创建成功后的行为…）。
- **必须挂在 `<l-provider>` 之内**：数据全走 `useAntdvConfig()`，面板外用会直接抛错。

## 代码演示 {#examples}

```vue
<template>
  <l-config-provider-setting :locales="locales">
    <template #extra>
      <!-- 宿主自己的配置项，插在顶部那一排（主题 / 紧凑之后） -->
    </template>
  </l-config-provider-setting>
</template>
```

## 行为

- **数据全走 `useAntdvConfig()`**：谁持有配置由 `LProvider` 决定（宿主传 `:antdv-config` 就用宿主那份）；改任何一项即时生效，**持久化归宿主**（`watch(config.state)` 写回，见 [`Provider`](../config-provider/README.md)）。
- **"当前值" = 覆盖值 ?? 当前生效 token**：面板没改过的项显示的是主题算出来的值（`theme.useToken()`）。
- 切换语言只改配置里的 `state.locale`；**同步 i18n / dayjs 归宿主**（pro 不引 vue-i18n）。
- 颜色页签的**卡头也能直接改主色**（色板挂在 `extra` 上，已阻止冒泡，不会顺带展开 / 收起）。
- token 后缀的**两套命名规则**：尺寸档位是**全大写**后缀（`sizeLG` / `fontSizeSM`），颜色细项是**首字母大写**（`colorPrimaryActive`）—— 别混用。
- 文案里的 `{number}` 是占位替换（pro 的 locale 不做 ICU）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| locales | 语言下拉的数据；不传就不渲染"语言"这一项。切换只改 `state.locale` | `{name: string; value: string}[]` | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom) | `ConfigProviderSettingClasses` | - |
| styles | 同上，值为 antd 语义对象 | `ConfigProviderSettingStyles` | - |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| extra | 宿主自己的配置项，插在顶部那一排（Form 内） |

## 类型 {#types}

`ConfigProviderSettingProps` / `ConfigProviderSettingSlots` / `ConfigProviderSettingClasses` / `ConfigProviderSettingStyles` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是**稳定 `div`**：类名 = `prefixCls`（缺省 `loncra-config-provider-setting`）+ `hashId` + `cssVarCls` + `attrs.class`；`style` 与其余 attrs 落根。内部节点全用语义类：`${prefixCls}-row-label` / `-row-sub` / `-token-input` / `-panel-block`（面板内容块撑满一行），样式见本目录 `style/`。

| classes / styles 键 | 落点 | 值 |
| --- | --- | --- |
| form | 顶部配置表单（本包 [`Form`](../form/README.md)，`classes` / `styles` 经 attrs 落 antd 的 `a-form`） | `FormProps['classes' / 'styles']` |
| tabs | 底部的 token 页签条（antd `Tabs`，原生语义对象原样透传） | `TabsProps['classes' / 'styles']` |

无落点清单：面板内部的 `Select` / `Switch` / `ColorPicker` / `Collapse` / `Checkbox` 不提供语义入口——它们的"定制"本来就是这个面板的功能本身（改的就是主题 token），要调外观走 token 细项或 `#extra`。
