# `@loncra/antdv-chat`

在 `@antdv-next/x` 之上扩展的聊天控件：表情、可带指令的发送器、Markdown 渲染。

## 安装与引用

peer：`vue`、`antdv-next`、`@antdv-next/icons`、`@antdv-next/x`、`@antdv-next/x-markdown`、`@loncra/antdv`；`dependencies`：`unicode-emoji-json`（`EmojiButton` 的表情数据源）。

| 路径 | 内容 |
| --- | --- |
| `@loncra/antdv-chat` | 三个控件 + `useInstructionSender` + `zhCN` / `enUS` / `Locale` |
| `@loncra/antdv-chat/locale/zh_CN` | 简体中文语言包 |
| `@loncra/antdv-chat/locale/en_US` | 英文语言包 |

```ts
import {Markdown} from '@loncra/antdv-chat'
import zhCN from '@loncra/antdv-chat/locale/zh_CN'
```

## 控件

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `EmojiButton` | 表情选择按钮 | [说明](./src/emoji-button/README.md) |
| `InstructionSender` | 可带指令的发送器（含 `useInstructionSender`） | [说明](./src/instruction-sender/README.md) |
| `Markdown` / `MarkdownCodeRenderer` | Markdown 渲染与代码块渲染器 | [说明](./src/markdown/README.md) |

## 目录

| 目录 | 内容 |
| --- | --- |
| `<控件>/` | 一个控件一个目录。骨架 `index.ts` / 主组件 `.tsx` / `style/index.ts` 见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7 节，`types.ts` 按需 |
| `locale/` | 本包 locale 与 `Locale` 类型 |
| `_util/` | `useLocale`（用 `createUseLocale` 自建，仅包内用，不从根入口导出） |

## 本包的开发规范

- **基础件复用 `@loncra/antdv`，不复制**：`classNames`、`genStyleHooks`、`useIsDark`、`createUseLocale` 都从 `@loncra/antdv` 引；本包的 `useLocale` 是用该工厂自建的，`locale` 与 `Locale` 类型才是本包自己的。
- 写法对标 `antdv-next` 源码：`.tsx` + `defineComponent` + JSX。组件名 `L` 前缀，`inheritAttrs: false`；根节点挂类一律用 `class` 绑定，`rootClass` 只作宿主入参并入 `class`；子节点走 `classes.*`。
- 有自有样式的控件 = 一个 `prefixCls` = 一个 `genStyleHooks`，样式只写在自己目录的 `style/index.ts`。
- 本包 peer 里的 X 生态（`@antdv-next/x`、`@antdv-next/x-markdown`）只在本包内用。
- 控件骨架、命名与类名、样式规则见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7–10 节；跨包通用规则见 [CONTRIBUTING-PACKAGES.md](../CONTRIBUTING-PACKAGES.md)。
