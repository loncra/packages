# `SystemUserPanel` 系统用户选人面板

从系统用户中按名称搜索并挑选成员的面板：左侧为搜索框 + 按分组列出的用户列表，右侧可选展示已选成员。

## 何时使用

- 需要在 IM 联系人、群成员选择等场景里按名称搜索并挑选系统用户。
- 选中态需要由外部接管（`v-model:value`），或只需要点击事件（`selected={false}`）。

## 代码演示

### 基础用法

```tsx
import {ref} from 'vue'
import {SystemUserPanel, type SystemUserContactItem} from '@loncra/antdv-chat-pro'
import type {PlatformUser} from '@loncra/client/auth'

const contacts: SystemUserContactItem[] = [
  {key: 'u1', label: '张三', data: user1},
  {key: 'u2', label: '李四', data: user2, group: '研发部'},
]
const value = ref<SystemUserContactItem[]>([])

<SystemUserPanel
  v-model:value={value.value}
  dataSource={contacts}
  onSelected={(user: PlatformUser) => console.log(user)}
/>
```

### 单选模式（不展示已选面板）

```tsx
<SystemUserPanel selected={false} hideSelectPanel dataSource={contacts} onSelected={onSelected} />
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| dataSource | 可选项数据源 | `SystemUserContactItem[]` | `[]` | - |
| value | 已选集合，`v-model:value` | `SystemUserContactItem[]` | `[]` | - |
| selected | 是否可多选；`true` 时点击列表项切换选中并写回 `value` | `boolean` | `true` | - |
| filter | 在搜索过滤之后执行的追加过滤 | `(item: SystemUserContactItem) => boolean` | `() => true` | - |
| hideSelectPanel | 隐藏右侧「已选择的成员」面板 | `boolean` | `false` | - |
| hideSearch | 隐藏搜索框 | `boolean` | `false` | - |
| avatarSize | 列表内头像尺寸，经 attrs 透传给 `UserAvatar` → Avatar 的 `size` | `string \| number` | `'large'` | - |
| prefixCls | 自定义前缀类名 | `string` | - | - |
| rootClass | 根类名，并入根节点 `class` | `string` | - | - |
| classes | 语义化 DOM 区域类名，见[语义化 DOM](#semantic-dom) | `SystemUserPanelClasses` | - | - |
| styles | 语义化 DOM 区域样式，见[语义化 DOM](#semantic-dom) | `SystemUserPanelStyles` | - | - |

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| selected | 点击某个联系人时抛出，无论该联系人是否被选中 | `(body: PlatformUser) => void` | - |
| update:value | 已选集合变化（仅本组件写入触发） | `(value: SystemUserContactItem[]) => void` | - |

注意：属性 `selected` 与事件 `selected` 同名不同义——前者是"是否可多选"开关，后者是点击事件。

## 类型

### SystemUserContactItem {#systemusercontactitem}

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| key | 唯一标识，同时是选中/去重的身份 | `string` | - | - |
| label | 展示名 | `string` | - | - |
| data | 用户数据 | `PlatformUser` | - | - |
| disabled | 是否禁用 | `boolean` | - | - |
| group | 分组名，`groupable` 依据它分栏 | `string` | - | - |

索引签名 `[key: string]: unknown` 用于结构上兼容 `@antdv-next/x` 的 `ConversationItemType`。

## 语义化 DOM {#semantic-dom}

类型：`SystemUserPanelClasses` / `SystemUserPanelStyles`，区域一一对应。

| 区域 | 说明 |
| --- | --- |
| root | 最外层 `Flex`；`prefixCls` / `hashId` / `cssVarCls` / `rootClass` / `class` / `style` 及 rest attrs 都落这里 |
| list | 左列容器；有右栏时带 `-list-split`（宽 30%），无右栏时带 `-list-full`（宽 100%） |
| search | 搜索框容器；`Input` 本体未设区域，只能经此容器间接控制 |
| conversations | 列表本体，值为 `Conversations` 的原生语义对象（`root` / `creation` / `group` / `item`）；`item` 上固定注入 `-item`，与宿主合并 |
| selectedPanel | 右侧已选面板容器，仅 `selected` 且未 `hideSelectPanel` 时渲染 |
| selectedDivider | 已选面板标题 `Divider`，值为 Divider 原生 `classes` / `styles` 对象 |
| selectedItem | 单个已选成员项 |
| empty | 空态容器；一个区域覆盖左列空态与已选面板空态两处 |

无落点清单：搜索图标（`-search-icon`）、列表项标题文本（`-label`）只有内部类，不提供区域 key。

其他边界：

- 左右栏宽度固定 30% / 70%，宿主可用 `styles.list` / `styles.selectedPanel` 覆盖。
- 已选面板头像固定 `size: 'large'`、`shape: 'square'`，不随 `avatarSize` 变化。
- `UserAvatar` 未声明 `size` 等 Avatar 透传 props，本组件经 attrs 展开传入；头像本体暂无法从外部定制。
- `selected={false}` 时点击列表项仍抛 `selected` 事件，但不写 `value`、不渲染复选框。
