# `IconSelect` 图标选择

给一个业务对象挑图标、头像或一段标识：图标库浏览、纯文本、头像三种形态，外加只读预览。

## 何时使用 {#when-to-use}

- **只读展示**（列表项、卡片、详情）：传 `preview`，只画头像，不出选择器。
- **表单里选图标**：走 `antdv-pro` 的 crud-page 注册表 `component: 'iconSelect'` —— 值绑定与 label 归 pro，这里只给组件自己的 `props`。
- **裸组件用法**：`mode="view"` 图标库（按包分 Tab、可搜索、也可直接手输类名）、`mode="avatar"` 头像（图片链接 / 名称首字 / 图标）、`mode="input"` 纯文本。

两条优先规则：`preview` 优先于 `mode`（命中即返回）；图标**不由本组件绘制**，必须由宿主传 `iconRender`，不传则图标位置空白 —— 但外壳照常渲染，`avatar://`（图片）与 `text://`（首字）两种协议也不受影响。

## 代码演示 {#examples}

### 只读预览（管理端 `Logo.vue`）

```vue
<l-icon-select
  size="large"
  preview
  :icon-render="renderIconFont"
  :value="currentItem.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + currentItem.name"
/>
```

### 表单里的图标字段（管理端声明式用法）

```ts
{
  key: 'icon',
  component: 'iconSelect',
  props: () => ({
    class: 'w-full',
    mode: ICON_SELECT_MODE.AVATAR,
    iconRender: (type: string) => renderIconFont(type),
    options: iconOptions.value,
  }),
}
```

两个要点：`props` **必须是函数形态** —— 图标清单在 `preMounted` 阶段才灌进 `iconOptions`，函数在 `fields` 的 computed 里求值才跟得上；`options` 是 iconfont 导出的 json（[IconfontJson](#iconfontjson)），宿主追加尺寸 / 对齐类要自己包一层，本组件的 `iconRender` 只收 `type`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 值。`avatar` 形态下是带前缀的协议串（`avatar://` / `text://` / `icon://`），不带前缀按 `avatar://` 处理。空 payload 编码成 `''`（空值 = 未选），所以"切到图标形态但还没选图标"这件事**存不进 `value`**，组件用界面态兜住 —— 父级重新挂载会回到默认形态。反过来，直接把 `value` 设成空 payload 的 `icon://` **不会**让选择器切到「图标」—— 形态是界面态，只有用户点选才变 | string | `''` | - |
| options | 图标库。来自 iconfont 导出的 json；搜索按 `css_prefix_text + font_class` 匹配。**缺省时 `view` 形态基本是空壳**（无 Tab、无图标，仍有搜索框与类名输入框） | [IconfontJson[]](#iconfontjson) | `[]` | - |
| mode | `view` 图标库 / `input` 纯文本 / `avatar` 头像。`avatar` 的三个选项（链接 / 名称 / 图标）文案来自本包 locale，其中「图标」只在 `options` 非空时出现 | [IconSelectModeType](#iconselectmodetype) | `'view'` | - |
| preview | 只读预览：只画头像，不出选择器 | boolean | `false` | - |
| iconRender | **图标唯一的绘制入口**，由宿主渲染；只收 `type` 一个参数。形式上可选，实际必填 | `(type: string) => VNodeChild` | - | - |
| prefixCls | 改前缀。默认值由组件内的 computed 兜底成 `'loncra-icon-select'`，这个非空兜底会**屏蔽 `ConfigProvider` 的 `prefixCls`** | string | - | - |
| rootClass | 追加到根元素的类，与宿主透传的 `class` 同落点；它同时进弹层作用域串，`.ant-popover` 上也会出现一次 | string | - | - |
| classes | 语义化 DOM 类名表，区域见 [语义化 DOM](#semantic-dom) | `IconSelectClasses` | - | - |
| styles | 语义化 DOM 样式表，区域与 `classes` 相同 | `IconSelectStyles` | - | - |
| size | 头像尺寸，`preview` 与 `avatar` 形态传给 `Avatar`；`view` / `input` 形态忽略 | `AvatarSize`（`number \| 'small' \| 'medium' \| 'middle' \| 'large' \| 'default'`） | - | - |
| class / style | 未声明，走 attrs：二者在渲染时被取出、落到根元素 | - | - | - |

除 `class` / `style` 之外的 attrs 一律落在根元素（`size` 是 prop，不走这条）。代价要说清：**`input` 形态的 `placeholder` / `maxlength` / `onBlur` 不再进输入框**，写到根上无效；`view` / `avatar` 形态原本被吞掉的 attrs 现在开始生效。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:value | 值变化 | `(value: string) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| afterAvatar | `preview` 时画在头像右侧 | `() => any` | - |

## 类型 {#types}

### IconfontJson {#iconfontjson}

> 一个图标包（iconfont 导出 json 的一项）

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| name | 包名，`view` 形态下是 Tab 标题 | string | - | - |
| css_prefix_text | 类名前缀，与 `font_class` 拼成完整类名 | string | - | - |
| description | 描述 | string | - | - |
| glyphs | 包内图标 | [IconfontGlyph[]](#iconfontglyph) | - | - |

### IconfontGlyph {#iconfontglyph}

> iconfont 导出的单个图标，字段原样使用

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| font_class | 类名后缀 | string | - | - |
| name | 图标名 | string | - | - |
| icon_id | 图标 id | string | - | - |
| unicode | 字符编码 | string | - | - |
| unicode_decimal | 编码的十进制 | number | - | - |

### IconSelectModeType {#iconselectmodetype}

> `'view' | 'input' | 'avatar'`，常量 `ICON_SELECT_MODE`

```ts
mode: ICON_SELECT_MODE.AVATAR
```

### IconSelectAvatarModeValueType {#iconselectavatarmodevaluetype}

> `'icon://' | 'avatar://' | 'text://'`，常量 `ICON_SELECT_AVATAR_MODE_VALUE`；`AVATAR_SCHEMES` 是这三者的数组，用于解析值

```ts
value: ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name // 没图标时退化为名称首字
```

## 语义化 DOM {#semantic-dom}

`classes` / `styles` 的类型分别是 `IconSelectClasses` / `IconSelectStyles`，两者共用下面这张区域表。

| 区域 | 说明 |
| --- | --- |
| root | 根元素（包含下面所有区域）：一个稳定 `div`，四个形态共用；`prefixCls` / `hashId` / `cssVarCls` / `rootClass` / `class` / `style` 与其余 attrs 全落它，形态修饰类 `-preview` / `-avatar` 也挂这里（不走 `classes.root`） |
| tabs | `view` 形态的 `Tabs` 根；内容体走 `classes.body`，已被 `-tabs-body` 占用 |
| search | `view` 形态左上的搜索框 |
| packName | `view` 形态右上的只读包名 |
| codeInput | `view` 形态右上的类名输入框 |
| glyph | 图标按钮；`view` 形态与弹层共用这一个 key |
| avatar | 头像；`preview` 与 `avatar` 形态共用 |
| compact | `SpaceCompact` 外壳；`input` 与 `avatar` 形态各一处 |
| select | `avatar` 形态的链接 / 名称 / 图标选择器 |
| payload | `avatar` 形态的值输入框 |
| input | `input` 形态的输入框 |
| popover | 弹层：根 `.ant-popover` 与内容层 `.ant-popover-content`；额外带 `tabs` / `search` 两个子键 |

值口径：区域是 antd 组件时，`classes` / `styles` 原样透传给该组件；`packName` / `compact` / `avatar` 没有语义 DOM，分别是 `string` 与 `CSSProperties`，只到根、内部结构没有入口。

`popover.tabs` / `popover.search` 是 `popover` 的**子键**（`classes.popover.tabs`），不是同级 key；`tabs` / `popover.tabs` 的 `body` 已分别被 `-tabs-body` / `-popover-body` 占用，类的同名 key 与它拼接、样式的同名 key 宿主优先。

**弹层**（只在 `mode="avatar"` 且当前是 `icon://` 时出现）在 body 下：作用域串 `prefixCls + hashId + cssVarCls + rootClass` 挂到 `.ant-popover` 与 `.ant-popover-content`，弹层里的规则靠 `.loncra-icon-select` 当祖先才命中。两条坑：`Popover` 的 `class` 到不了弹层根（`Trigger` 是 `Fragment`），只能靠 `rootClass` / `classes.popover`，这串也绝不带宿主 `class`（`w-full` 会把整个弹层撑满）；`.ant-popover-title` 与内容层是兄弟，`popover.search` 靠根当祖先命中。

**已知边界**：

- 搜索态只有一份：`view` 与弹层共用关键词，弹层里搜完切回 `view` 仍是过滤态。
- 按包过滤、不剔除空包：0 命中的包仍留一个 Tab，标题显示 `包名 (0)`。
- `value` 与 `options` 不匹配时右上只读包名空白；`view` / `input` 形态不解析 `text://` / `icon://`，协议串会原样进类名输入框。
- 尺寸写死：`view` 的图标按钮 `size="large"`、弹层搜索框 `size="small"`。
- 没有落点的节点：弹层触发器 `Button`、图标按钮外层的 `Space`、弹层标题行的 `Flex`、`afterAvatar` 插槽、`view` 形态右上那组的外层 `SpaceCompact`。
- 区域值可以是函数形态（`(info) => 对象`），合并时先求值。
