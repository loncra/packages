# `EmojiButton` emoji 选择按钮

一个笑脸图标按钮，点击弹出按分组 Tabs 展示的 emoji 面板，点选后向外抛出选中的 emoji 字符。

## 何时使用 {#when-to-use}

- 聊天输入框旁的"选择表情"入口。
- 任何"点开面板、选一个 emoji 字符"的场景（面板内容来自 `unicode-emoji-json`，按分组懒渲染）。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {EmojiButton} from '@loncra/antdv-chat'

const text = ref('')
</script>

<template>
  <div>
    <l-emoji-button @selected="(emoji) => (text += emoji)" />
    <span>{{ text }}</span>
  </div>
</template>
```

## 行为 {#behavior}

- 数据源是 `unicode-emoji-json` 的 `data-by-group.json`（包依赖，非运行时接口）。
- **默认排除三个分组**：`people_body` / `symbols` / `flags`（常量 `EMOJI_DEFAULT_HIDDEN_SLUGS`，可用 `hidden-slugs` 整体覆盖）。
- 分组名显示优先取包内 locale（`EmojiButton` 键下的分组 slug），没有该键时退回数据源自带英文名。
- 面板为 Popover 弹层，**Teleport 到 body**——它不在根元素子树内。
- 选中一个 emoji 后面板自动收起并 `emit('selected', emoji)`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 无（非受控组件，选中走事件） | - | - | - |
| type | 触发按钮形态，同 antd `Button` 的 `type` | `'default' \| 'primary' \| 'dashed' \| 'link' \| 'text'` | `default` | - |
| disabled | 禁用 | boolean | `false` | - |
| hiddenSlugs | 不展示的分组 slug 列表（**整体覆盖**默认排除项，不是追加） | string[] | `['people_body', 'symbols', 'flags']` | - |
| prefixCls | 改根前缀 | string | -（组件内兜底 `loncra-emoji-button`） | - |
| rootClass | 追加到触发按钮 | string | - | - |

`class` / `style` 未声明，走 attrs，二者落在触发按钮上；其余 attrs 透传给内部 antd `Button`。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| selected | 选中一个 emoji，面板同时收起 | `(emoji: string) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| icon | 自定义触发按钮图标，不传用 `SmileOutlined` | `() => any` | - |

## 类型 {#types}

从包根导出：`EmojiButtonProps` {#emojibuttonprops} / `EmojiButtonEmits` {#emojibuttonemits} / `EmojiButtonSlots` {#emojibuttonslots}；常量 `EMOJI_DEFAULT_HIDDEN_SLUGS` 从 `./constants` 定义（未从包根导出，属于内部默认值）。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 触发按钮（antd `Button`）：`loncra-emoji-button` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`；`style` 落宿主 `style`；其余 attrs 透传 `Button` |
| panel | Popover 弹层内容最外层 div：`-panel`（宽度 = `controlHeightLG × 10`），**Teleport 到 body**，不在 root 子树内 |
| body | 每个 tab 的内容包裹 div：`-body`（滚动区域，`genScrollAreaStyle`，最大高度 8 个单位） |
| cell | 单个 emoji 格子（antd `CardGrid`）：`-cell` |
| emoji | 格子里的 emoji 字符 `span`：`-emoji` |

- **没有 `classes` / `styles` 语义键**：以上区域类名是固定的自有类，宿主要定制用 `prefixCls` 起自己的前缀，或全局 CSS 按类名覆盖。
- 弹层面板在 body 上，写覆盖样式时不要写成 root 的后代选择器。
