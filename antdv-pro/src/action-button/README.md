# `ActionButton` 动作按钮

把一份**已解析的动作**（`ResolvedAction[]`）画成按钮：单个动作直接出按钮，多个动作收进下拉。

## 何时使用 {#when-to-use}

- **行内动作列**：`QueryTable` 的「操作」列、`QueryCardGrid` 的卡片右上角 —— 动作来自当前记录（`resolveRecordActions(record)`）。
- **工具栏 / 批量动作**：`BasicCrudQuery` 的 `extra` 槽缺省值就是它，动作来自整批数据（`resolveToolbarActions`）。
- **自己拿动作数组**：宿主已经有 `ResolvedAction[]`，只想要这套渲染。

本控件**不做**权限、可见性、可用性判定 —— 那是 resolver 在解析阶段做完的，结果已经落在 `disabled` / `danger` / `run` 上。⚠️ 因此 `actions` **只能传 resolver 的产物**：动作定义的 `label` / `icon` 是函数，直接塞进来会被当 VNode 渲染。

## 代码演示 {#examples}

### 行内动作列（`QueryTable`）

```tsx
<ActionButton
  size="small"
  actions={basic.value?.resolveRecordActions(record) ?? []}
  onAction={(id: string) => basic.value?.onRecordAction(id, record)}
/>
```

### 卡片右上角，永远收起（`QueryCardGrid`）

```tsx
<ActionButton
  size="small"
  type="text"
  alwaysDropdown
  actions={slot.itemActions}
  onAction={(id: string) => base.value?.onRecordAction(id, slot.record)}
/>
```

`alwaysDropdown` 让「只有 1 个动作」也走下拉 —— 卡片里位置固定，宁可多点一次，也不要卡片宽窄随动作个数跳动。外面套一层 `<div onClick={(e) => e.stopPropagation()}>` 避免点动作时触发卡片自身的点击。

### 工具栏（`BasicCrudQuery` 的 `extra` 槽缺省值）

```tsx
slots.extra ? slots.extra() : <ActionButton actions={toolbarActions.value} />
```

### 动作从哪来

```ts
import {buildRecordActionContext, useActionAuth, useActionResolver} from '@loncra/antdv-pro'

const auth = useActionAuth()
const {resolveRecordActions} = useActionResolver()
const actions = resolveRecordActions(defs, buildRecordActionContext({record, app}), auth)
```

`app` 是 `{message, modal, collection}`，由持有数据的组件用 `App.useApp()` 拿到后自己拼；`resolve*` 已按权限、`visible`、`enabled` 过滤并算出 `disabled` / `loading`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| actions | 已解析的动作。判定顺序见[语义化 DOM](#semantic-dom)；为空**且未开** `alwaysDropdown` 时不渲染任何东西（宿主透传的 `class` / `style` 也没地方落） | [ResolvedAction](#resolvedaction)[] | `[]` | - |
| size | 透给 `Button`：单按钮分支影响按钮本体，下拉分支只影响触发按钮，**菜单项字号不跟随** | `ButtonSize` | `'small'` | - |
| alwaysDropdown | 收进下拉。`false` 时要多于 1 个动作才走下拉；`true` 时**一个动作、甚至零个动作**也走下拉（零个会渲染出一个只有空菜单的可悬停按钮） | boolean | `false` | - |
| type | 透给 `Button` 的 `type`（`'text'` / `'primary'` 等），下拉分支同样生效 | `ButtonProps['type']` | - | - |
| rootClass | 并入根元素（`Button`）的类名，位置在宿主 `class` 之前 | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`button` / `dropdown` | `ActionButtonClasses` | - | - |
| styles | 同上区域的样式表 | `ActionButtonStyles` | - | - |
| class / style | 未声明，走 attrs：与 `rootClass` 一起落在根元素 `Button` 上 | - | - | - |

其余 attrs（`title`、`aria-label`、`data-*` 等）同样整体落在内部 `Button` 上 —— 本控件是纯包装控件，没有自己的外壳。

三个同名 attrs 的优先级**两个分支不一样**：

| attrs | 单按钮分支 | 下拉分支 |
| --- | --- | --- |
| `disabled` / `loading` / `onClick` | 被动作自己的值覆盖（attrs 展开在显式属性之前），宿主传了无效 | 组件没设这几个属性 ⇒ 宿主的生效（`disabled` 会让触发按钮真的点不开） |

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| action | 某个动作被点击，回传裸 `id`（`BasicCrudQuery` 的同名事件回传的是 `{id, context}`，别混）。**先执行动作的 `run()`、再抛事件**；返回 Promise 时**不等待**；`run` 抛错本控件不接住，宿主自己 catch。`disabled` 的动作点了什么都不发生 | `(id: string) => void` | - |

## 类型 {#types}

`size` 直接用 antdv-next 的 `ButtonSize`（`'small' | 'medium' | 'middle' | 'large'`，其中 `middle` 已弃用、官方推荐 `medium`），本包不另立别名。

`ActionButtonProps` / `ActionButtonClasses` / `ActionButtonStyles` / `ActionButtonEmits` 从包根 `@loncra/antdv-pro` 导出。

### ResolvedAction {#resolvedaction}

> 从包根 `@loncra/antdv-pro` 取。由 `useActionResolver()` 的 `resolveToolbarActions` / `resolveRecordActions` 产出，是本控件唯一的数据输入。下表**未标可选**的字段为必填。

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| id | 动作标识，也是下拉项的 `key` 与 `action` 事件回传的值。**重复 id 只会派发第一个**，且菜单里会出现重复 `key`（Vue 会告警） | string | - | - |
| label | 单动作时是按钮文字（包一层 `<span>`），多动作时是菜单项文字。resolver 缺省兜成 `''` ⇒ 会出空按钮 | string | - | - |
| icon | 单动作时进按钮的图标槽，多动作时进菜单项；不传则图标位置为空 | `VNode \| null` | - | - |
| danger | 进菜单项；**非第一项**的 `danger` 动作前面会插一条分隔线 | boolean | - | - |
| disabled | 必填。单动作时落成按钮的 `disabled`，多动作时落成菜单项的 `disabled` | boolean | - | - |
| loading | 只影响单动作的按钮；下拉分支不表达加载态 | boolean | - | - |
| run | 动作本体，点击时调用。resolver 对 `disabled` 的动作**直接不给 `run`**（传进来也不执行） | `() => void \| Promise<void>` | - | - |

## 语义化 DOM {#semantic-dom}

**没有自有类名**：本控件不取 `prefixCls`、不注册 cssinjs 样式，因此既不产出 `hashId` / `cssVarCls`，也没有 `loncra-*` 的类。要改外观只能覆盖 antd 的 `.ant-btn` / `.ant-dropdown-menu-item` 等类名。

| 区域 | 说明 |
| --- | --- |
| root | **稳定根是 `Button`**：两个渲染分支都把宿主的 `class` / `style` / 其余 attrs 落在这一个 `Button` 上，类名顺序是 `rootClass` → 宿主 `class`；没有自己的包裹元素 |
| button | `Button` 的语义键原样透传（`classes.button` / `styles.button`） |
| dropdown | `Dropdown` 的语义键原样透传（`classes.dropdown` / `styles.dropdown`），只在下拉分支存在；菜单项在弹层里，`root` / `item` / `itemTitle` / `itemIcon` / `itemContent` 都可定制 |

判定顺序固定为**先下拉、后单按钮**：

| 分支 | 触发条件 | 原地根元素 | attrs 落点 |
| --- | --- | --- | --- |
| 下拉 | `actions.length > 1` 或 `alwaysDropdown` | `button.ant-btn.ant-dropdown-trigger`（`Dropdown` 给的 `-trigger` 类合并到按钮本身，没有包裹元素） | 这个按钮 |
| 单按钮 | `actions.length === 1` 且没开 `alwaysDropdown` | `button.ant-btn` | 这个按钮 |
| 不渲染 | `actions` 为空且没开 `alwaysDropdown` | —（返回 `null`） | 无处落，`class` / `style` / `rootClass` 被丢弃 |

几处容易踩的：

- **弹层不在原地**：菜单渲染到 body 的 `.ant-dropdown` 下，**不吃宿主透传的 `class`**，要改菜单项用 `classes.dropdown.item` 这类语义键，或写 `.ant-dropdown-menu-item` 全局类名。`placement` 固定 `bottomRight`；触发方式没设，走 `Dropdown` 的默认值 **hover**（`trigger` 没有传，`@v-c/dropdown` 的默认是 `['hover']`），所以点一下不会展开菜单。
- 菜单项 `key` 就是 `action.id`，分隔线是独立项、`key` 为 `<action.id>-divider`；`action` 事件按 `String(key)` 反查，所以某个动作的 `id` 若恰好叫 `xxx-divider`，会与分隔线撞名。
- 触发按钮只有省略号图标，`aria-label` 默认取 `Crud.action`（zh「操作」/ en「Action」）；宿主通过 attrs 传 `aria-label` 时以宿主的为准。
- 单按钮分支的文字外面固定有一层 `<span>`；`label` 为空时按钮是空的。
