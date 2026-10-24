# `Markdown` Markdown 渲染

`@antdv-next/x-markdown` 的 `XMarkdown` 外壳：滚动容器 + 自动吸底 + 明暗主题跟随 + 代码块渲染器。**0.3.0 起支持流式布尔预设**（增量分节 + 打字机）。

## 何时使用 {#when-to-use}

- 聊天 / Agent 气泡里渲染模型输出的 Markdown，流式输出时需要自动吸底。
- 需要代码块高亮、行号、复制按钮，`mermaid` 代码块自动转图。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'

const content = ref('# hi')
const streaming = ref(true)
</script>

<template>
  <Markdown :content="content" :streaming="streaming" />
</template>
```

## 行为 {#behavior}

- **主题**：不传 `theme` 时跟随系统暗色（`useIsDark`），`x-markdown-light/dark` 主题类挂 XMarkdown 本体；三份主题 CSS 由组件自行引入。
- **自动吸底**：`streaming` 表示流进行中时，内容更新自动滚到底部；用户往上滚离底部超过 `nearBottomPx`（默认 48px）后暂停吸底，再滚回底部恢复。`streaming` 支持**两种形态**：布尔预设（0.3.0 的 `streaming: true/false`，自动开启增量分节 + 打字机）与对象形式 `{hasNextChunk}`——吸底逻辑两者都兼容。
- **0.3.0 布尔预设**：`streaming: true` = 流进行中，自动开启 hasNextChunk + 增量分节（按顶层标题切分，只重渲染最后一个增长中的分节）+ 半成品 Markdown 立即成型 + 打字机（按句淡入）；`streaming: false` = 流结束。对象形式行为与 0.2.0 完全一致。**agent 等长回答场景建议切布尔预设**（渲染性能显著提升），视觉上多出打字机动画，切换前先过产品验收。
- **代码渲染器**：`MarkdownCodeRenderer` 供 `components: {code}` 注入——行内代码渲染为 `code`；块级代码按语言分发：`mermaid` 走 `Mermaid` 组件转图，其余走 `CodeHighlighter`（行号 + 复制按钮），明暗跟随。
- 底座 props（`components`、`streaming`、增量 / 打字机选项等）经 attrs **全量透传**给 XMarkdown。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| content | Markdown 内容（透传 XMarkdown） | string | - | - |
| streaming | 流式状态；布尔预设或对象形式，语义见上 | `boolean \| StreamingOption` | - | - |
| nearBottomPx | 距底部多少像素内算"贴底" | number | `48` | - |
| theme | 主题；不传跟随系统暗色 | `'light' \| 'dark'` | - | - |
| classes | 语义化 DOM 区域表，见下 | [MarkdownClasses](#markdownclasses) | - | - |
| styles | 语义化 DOM 样式区域表 | [MarkdownStyles](#markdownstyles) | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

`class` / `style` 走 attrs 落在滚动根 div；其余 attrs（`components` / 增量选项等）透传给 XMarkdown。~~scrollClass~~ 已删除（无消费方，滚动容器定制走 `classes.root`）。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| default | 透传 XMarkdown 默认插槽 | `() => any` | - |

## 类型 {#types}

从包根导出：`MarkdownProps` {#markdownprops} / `MarkdownSlots` {#markdownslots} / `MarkdownTheme` {#markdowntheme} / `MarkdownClasses` {#markdownclasses} / `MarkdownStyles` {#markdownstyles} / `MarkdownCodeRendererProps` {#markdowncoderendererprops}。

### MarkdownClasses {#markdownclasses}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| root | string | 滚动容器根（`-scroll`） |
| markdown | string | XMarkdown 本体（与固定的 `x-markdown-light/dark` 主题类合并） |

### MarkdownStyles {#markdownstyles}

同构：`root` / `markdown`（`CSSProperties`）。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 滚动容器 div：`-scroll`（overflow auto，常挂）+ `loncra-markdown` + `hashId` + `cssVarCls` + `classes.root` + `rootClass` + 宿主 `class`；`onScroll` 吸底判定在此层 |
| markdown | XMarkdown 本体：`x-markdown-light/dark` 主题类 + `classes.markdown`；0.3.0 的 XMarkdown 无语义 DOM，`markdown` 区域值退化为 `string` |

- 代码块内部样式（高亮器内边距 / `pre code` 空白策略）用 `!important` 覆盖 x-markdown 主题，锚定**自有根 + 底座高亮器类名**；高亮器类名经 `token.antCls` 动态插值（宿主改 `ConfigProvider` prefixCls 时跟随，不写死），`.x-markdown` 主题类是 x-markdown 包自有前缀（不属 antd prefix 体系）按字面写。
- `MarkdownCodeRenderer` 接受 `class`，会挂到它渲染的输出节点（`CodeHighlighter` / `Mermaid` / 行内 `code`）；底座传入的 `data-block` / `data-lang` / `language-*` 等属性是分发依据，不透传到输出。
