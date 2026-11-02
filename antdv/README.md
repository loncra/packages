# `@loncra/antdv`

在 `antdv-next` 之上扩展的管理端公共控件。

## 安装与引用

peer：`vue`、`antdv-next`、`@antdv-next/icons`。

| 路径 | 内容 |
| --- | --- |
| `@loncra/antdv` | 全部控件 + 基础件（`classNames` / `genStyleHooks` / `createStyleHooks` / `useLocale` / `createUseLocale` / `fillLocale` / `useIsDark` / `useFormItemTrigger` / `useTwoWayModel`）+ 共享样式片段（`genFullSpinStyle` / `genScrollAreaStyle` / `SPIN_KEYFRAMES` / `JUMP_KEYFRAMES`）+ locale 默认包 + 类型；完整清单以 `src/index.ts` 为准 |
| `@loncra/antdv/locale/zh_CN` | 简体中文语言包 |
| `@loncra/antdv/locale/en_US` | 英文语言包 |

```ts
import {IconSelect} from '@loncra/antdv'
import zhCN from '@loncra/antdv/locale/zh_CN'
```

## 控件

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `TooltipValidationFormItem` | 把表单项的校验信息收进 `Tooltip`，长表单不占纵向空间 | [说明](./src/tooltip-validation-form-item/README.md) |
| `QrCodeModal` | 二维码弹窗 | [说明](./src/qr-code-modal/README.md) |
| `BasicImage` | 图片展示，取不到图时回退包内自带占位图 | [说明](./src/basic-image/README.md) |
| `IconSelect` | 图标选择：图标库 / 纯文本 / 头像三形态，外加只读预览 | [说明](./src/icon-select/README.md) |
| `KeyValueTable` | 键值表格，行内可编辑，提交前收敛编辑态 | [说明](./src/key-value-table/README.md) |

## 目录

| 目录 | 内容 |
| --- | --- |
| `<控件>/` | 一个控件一个目录。骨架 `index.ts` / 主组件 `.tsx` / `types.ts` / `style/index.ts` 见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7 节 |
| `locale/` | 本包 locale 与 `Locale` 类型 |
| `_util/` | 共用基础件：纯函数 `classNames`、`genStyleHooks`，依赖 vue / antdv-next 的 composable（`useFormItemTrigger` / `useTwoWayModel`，以及 `context/` 下的 `useLocale` / `createUseLocale` / `fillLocale` / `useIsDark` / `useIconFontRender`），样式机制与共享片段在 `style/`（工厂 `createStyleHooks`、`genFullSpinStyle`、`genScrollAreaStyle`、`SPIN_KEYFRAMES` / `JUMP_KEYFRAMES`） |

## iconFontRender 契约 {#icon-font-render}

包内控件不持有 iconfont 资源，"按图标名渲染图标"这件事由宿主注入：

- **契约**：`IconFontRenderFn = (type: string, attrs?: Record<string, unknown>) => VNodeChild`；`attrs` 是开放对象，常见键 `class` / `style` / `spin` / `rotate`，渲染方按需取用。
- **注入**：`provideIconFontRender(render)`。标准挂点是 `antdv-pro` 的 `<l-provider icon-font-render="...">`，宿主不直接调它。
- **消费**：`useIconFontRender()` 返回渲染函数，未注入时安全返回 `null`（不抛错）。
- **对齐责任**：iconfont 与文字的基线对齐由宿主负责——渲染闭包里统一加基类、按图标名维护覆盖表；契约只透传 `attrs`，不承载样式语义。
- **回落**：`IconSelect` 的 `iconRender` prop 未传时自动回落到注入的渲染器。

## 本包的开发规范

- **写法对标 `antdv-next` 源码**：`.tsx` + `defineComponent` + JSX，不写管理端 SFC。
- **图标渲染归宿主**：包内不解析宿主的全局 `IconFont`、不渲染宿主的图标字体。要画图标的地方一律经 [`iconFontRender` 契约](#icon-font-render)由宿主注入 —— 组件 setup 里 `useIconFontRender()` 取用；`IconSelect` 的 `iconRender` prop 仍可显式传入、优先于注入。包内自带外观只用官方 `@antdv-next/icons`。

命名、类名挂法、样式与层的规则见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 9–11 节。
