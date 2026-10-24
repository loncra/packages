# `ConversationList` 会话列表底座

IM 与 Agent 会话侧栏的共享底座：受控的树形会话菜单（选中 / 展开 / 重命名编辑位 / 行操作菜单），基于 antd `Menu`。`ImConversationList` / `AgentConversationList` 建立在它之上。

## 何时使用 {#when-to-use}

- 自建会话侧栏：需要"树形分组 + 选中 / 展开受控 + 行尾操作菜单（hover 显隐）+ 重命名编辑位"这套列表行为。
- 一般不直接渲染：优先用 `ImConversationList` / `AgentConversationList`；直接使用时自行喂受控状态。

## 代码演示 {#examples}

```vue
<ConversationList
  v-model:selected-keys="selected"
  v-model:open-keys="open"
  :items="nodes"
  :loading="loading"
  @active="onActive"
>
  <template #actions="{node}">…行操作菜单…</template>
</ConversationList>
```

## 行为 {#behavior}

- **受控**：`items` / `selectedKeys` / `openKeys` 全部由宿主持有，组件只发事件不持有状态。
- **行操作**：`actionsVisible`（默认 true）控制行尾"…"按钮；按钮与下拉内容都会阻断行点击冒泡，下拉内容由 `actions` 插槽提供。
- **重命名编辑位**：节点的 `editing: true` 时 label 区域渲染 `editor` 插槽，且阻断冒泡（编辑中的点击不影响选中 / 展开）。
- **空态 / 加载**：`items` 为空渲染 `Empty`；`loading` 时整树罩 `Spin`。
- 底座 `Menu` 的覆盖样式锚定自有类 + `token.antCls` 动态插值（宿主改 `ConfigProvider` prefixCls 时跟随）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| items | 会话树 | [ConversationNode](#conversationnode)[] | 必填 | - |
| selectedKeys | 选中 key（受控） | string[] | 必填 | - |
| openKeys | 展开分组 key（受控） | string[] | 必填 | - |
| loading | 整树加载罩 | boolean | `false` | - |
| actionsVisible | 行尾"…"操作按钮显隐 | boolean | `true` | - |
| classes | 语义化 DOM 区域表，见下 | [ConversationListClasses](#conversationlistclasses) | - | - |
| styles | 语义化 DOM 样式区域表 | [ConversationListStyles](#conversationliststyles) | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

`class` / `style` 走 attrs 落在根 `Flex`；其余 attrs 透传给根。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:selectedKeys | 选中变化 | `(keys: string[]) => void` | - |
| update:openKeys | 展开变化 | `(keys: string[]) => void` | - |
| active | 点击某个会话 | `(key: string) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| header | 列表头（搜索框等） | `() => any` | - |
| icon | 行图标（编辑中不渲染） | `(node: ConversationNode) => any` | - |
| actions | 行操作菜单内容（Dropdown 内） | `(node: ConversationNode) => any` | - |
| subtitle | 行副标题 | `(node: ConversationNode) => any` | - |
| editor | 重命名编辑位（`editing: true` 时接管 label） | `(node: ConversationNode) => any` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| revealItem | 把树滚动到指定 key 的节点（不在可视区才滚，**顶对齐**；配合宿主先展开祖先目录，内部等一帧再寻址）。节点寻址用自渲染 label 上的 `data-conversation-key`，不依赖 Menu 内部属性 | `(key: string) => Promise<void>` | - |

## 类型 {#types}

从包根导出：`ConversationNode` {#conversationnode} / `ConversationListProps` {#conversationlistprops} / `ConversationListEmits` {#conversationlistemits} / `ConversationListClasses` {#conversationlistclasses} / `ConversationListStyles` {#conversationliststyles}。

### ConversationListClasses {#conversationlistclasses}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| menu | `MenuProps['classes']` | 底座 `Menu` 语义表（`item` / `itemContent` / `subMenu` 与组件固定注入合并，宿主优先） |
| empty | string | 空态容器（`-empty`） |

### ConversationListStyles {#conversationliststyles}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| menu | `MenuProps['styles']` | 底座 `Menu` 样式语义表 |
| empty | CSSProperties | 空态容器 |

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 `Flex`（vertical）：`loncra-conversation-list` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`；`style` 落宿主 `style`；其余 attrs 透传根 |
| body | 滚动区（`-body`，flex: 1 + overflow auto）：空态 `Empty` 或 `Spin` 包裹的 `Menu` |
| menu | 底座 `Menu`：`-menu` 类 + `rootClass` 固定注入 + `classes.menu` / `styles.menu`（`item` / `itemContent` / `subMenu` 与固定注入合并） |
| empty | 空态容器（`-empty`）：`classes.empty` / `styles.empty` |

无落点清单：行内标签节点（`-line` / `-name` / `-side` / `-time` / `-actions` / `-subtitle`）没有独立语义键——定制走 `prefixCls` 起前缀或全局 CSS；行操作阻断冒泡、编辑位阻断选中是固定交互，不提供开关。
