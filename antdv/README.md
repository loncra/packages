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
| `_util/` | 共用基础件：纯函数 `classNames`、`genStyleHooks`，依赖 vue / antdv-next 的 composable（`useFormItemTrigger` / `useTwoWayModel`，以及 `context/` 下的 `useLocale` / `createUseLocale` / `fillLocale` / `useIsDark`），样式机制与共享片段在 `style/`（工厂 `createStyleHooks`、`genFullSpinStyle`、`genScrollAreaStyle`、`SPIN_KEYFRAMES` / `JUMP_KEYFRAMES`） |

## 本包的开发规范

- **写法对标 `antdv-next` 源码**：`.tsx` + `defineComponent` + JSX，不写管理端 SFC。
- **图标渲染归宿主**：包内不解析宿主的全局 `IconFont`、不渲染宿主的图标字体。要画图标的地方一律由宿主注入 —— `IconSelect` 的 `iconRender`、`KeyValueTable` 的 `#title` 插槽；包内自带外观只用官方 `@antdv-next/icons`。

命名、类名挂法、样式与层的规则见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 9–11 节。
