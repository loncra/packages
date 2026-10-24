# `Markdown` Markdown 渲染

`@antdv-next/x-markdown` 的 `XMarkdown` 直通外壳：明暗主题跟随 + 代码块渲染器。**滚动容器由宿主负责**（组件不做滚动与吸底——聊天场景的滚动/吸底在 `BubbleList` 层实现）。

## 何时使用 {#when-to-use}

- 渲染模型输出的 Markdown，需要代码块高亮、行号、复制按钮，`mermaid` 代码块自动转图。
- 明暗主题自动跟随，不关心主题类怎么挂。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {Markdown} from '@loncra/antdv-chat'

const content = ref('# hi')
</script>

<template>
  <Markdown :content="content" />
</template>
```

## 行为 {#behavior}

- **主题**：不传 `theme` 时跟随系统暗色（`useIsDark`），`x-markdown-light/dark` 主题类挂 XMarkdown 本体；三份主题 CSS 由组件自行引入。
- **流式**：底座 props 经 attrs 全量透传。0.3.0 的 `streaming: true` 布尔预设（增量分节 + 打字机）与对象形式 `{hasNextChunk}` 都直接可用；**滚动 / 吸底由宿主的外层容器实现**（聊天场景在 `BubbleList` 层）。
- **代码渲染器**：`MarkdownCodeRenderer` 供 `components: {code}` 注入——行内代码渲染为 `code`；块级代码按语言分发：`mermaid` 走 `Mermaid` 组件转图，其余走 `CodeHighlighter`（行号 + 复制按钮），明暗跟随。
- **样式覆盖**：代码高亮器的内边距 / 空白策略用 `!important` 覆盖 x-markdown 主题——`@antdv-next/x-markdown` 的主题 CSS **未分层**，未分层规则恒赢所有层（spec 107 场景②），删掉即失效；高亮器类名经 `token.antCls` 动态插值（宿主改 `ConfigProvider` prefixCls 时跟随），`.x-markdown` 主题类是 x-markdown 包自有前缀按字面写。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| content | Markdown 内容（透传 XMarkdown） | string | - | - |
| streaming | 流式状态（透传 XMarkdown，0.3.0 起支持布尔预设） | `boolean \| StreamingOption` | - | - |
| theme | 主题；不传跟随系统暗色 | `'light' \| 'dark'` | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

`class` / `style` 走 attrs 直达 XMarkdown 本体（**仅根可定制**——组件只有这一个节点，不设 `classes` / `styles` 区域表）；其余 attrs（`components` / 增量选项等）透传给 XMarkdown。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| default | 透传 XMarkdown 默认插槽 | `() => any` | - |

## 类型 {#types}

从包根导出：`MarkdownProps` {#markdownprops} / `MarkdownSlots` {#markdownslots} / `MarkdownTheme` {#markdowntheme} / `MarkdownCodeRendererProps` {#markdowncoderendererprops}。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | XMarkdown 本体（组件唯一根）：`loncra-markdown` + `hashId` + `cssVarCls` + `x-markdown-light/dark` + `rootClass` + 宿主 `class`；宿主 `style` 同落于此 |

- 无第二个可定制节点 ⇒ `classes` / `styles` 只有 `markdown` 一个键；宿主也可以直接用 `class` / `style`。
- 代码块内部样式（高亮器内边距 / `pre code` 空白策略）锚定**自有根 + 底座高亮器类名**；高亮器类名经 `token.antCls` 动态插值（宿主改 `ConfigProvider` prefixCls 时跟随），`.x-markdown` 主题类是 x-markdown 包自有前缀（不属 antd prefix 体系）按字面写。
- `MarkdownCodeRenderer` 接受 `class`，会挂到它渲染的输出节点（`CodeHighlighter` / `Mermaid` / 行内 `code`）；底座传入的 `data-block` / `data-lang` / `language-*` 等属性是分发依据，不透传到输出。
- 滚动 / 自动吸底：不在本组件（宿主外层容器负责；聊天场景在 `BubbleList`）。
