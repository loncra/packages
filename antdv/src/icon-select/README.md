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

`size` 没有在本组件声明，走 attrs 透给 `Avatar`（`preview` 形态的透传口径见下方属性表）。

### 表单里的图标字段（管理端声明式用法）

```ts
{
  key: 'icon',
  component: 'iconSelect',
  props: () => ({
    class: 'w-full',
    mode: ICON_SELECT_MODE.AVATAR,
    iconRender: (type: string) => renderIconFont(type, 'align'),
    options: iconOptions.value,
  }),
}
```

两个要点：`props` **必须是函数形态** —— 图标清单在 `preMounted` 阶段才灌进 `iconOptions`，函数在 `fields` 的 computed 里求值才跟得上；`options` 是 iconfont 导出的 json（[IconfontJson](#iconfontjson)），宿主追加尺寸 / 对齐类要自己包一层，本组件的 `iconRender` 只收 `type`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 值。`avatar` 形态下是带前缀的协议串（`avatar://` / `text://` / `icon://`），不带前缀按 `avatar://` 处理。空 payload 编码成 `''`（空值 = 未选），所以"切到图标形态但还没选图标"这件事**存不进 `value`**，组件用界面态兜住 —— 父级重新挂载会回到默认形态 | string | `''` | - |
| options | 图标库。来自 iconfont 导出的 json；搜索按 `css_prefix_text + font_class` 匹配。**缺省时 `view` 形态基本是空壳**（无 Tab、无图标，仍有搜索框与类名输入框） | [IconfontJson[]](#iconfontjson) | `[]` | - |
| mode | `view` 图标库 / `input` 纯文本 / `avatar` 头像。`avatar` 的三个选项（链接 / 名称 / 图标）文案来自本包 locale，其中「图标」只在 `options` 非空时出现 | [IconSelectModeType](#iconselectmodetype) | `'view'` | - |
| preview | 只读预览：只画头像，不出选择器 | boolean | `false` | - |
| iconRender | **图标唯一的绘制入口**，由宿主渲染；只收 `type` 一个参数。形式上可选，实际必填 | `(type: string) => VNodeChild` | - | - |
| prefixCls | 改前缀。默认值由组件内的 computed 兜底成 `'loncra-icon-select'`，这个非空兜底会**屏蔽 `ConfigProvider` 的 `prefixCls`** | string | - | - |
| rootClass | 追加到根元素的类，与宿主透传的 `class` 同落点 | string | - | - |
| class / style | 未声明，走 attrs：二者在渲染时被取出、落到根元素 | - | - | - |

其余 attrs 按形态分流：`preview` 透给 `Avatar`（如 `size`），`input` 透给 `Input`，`view` / `avatar` 不透传。

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

根元素**随 `mode` 换壳**，所以"根上的类"落在不同的 antd 组件上：

| 形态 | 根元素 | 根元素上的类 |
| --- | --- | --- |
| `preview` | `div` | `loncra-icon-select` + `-preview` |
| `view` | `.ant-tabs` | `loncra-icon-select` |
| `input` | `.ant-space-compact` | `loncra-icon-select` |
| `avatar` | `.ant-flex` | `loncra-icon-select` + `-avatar` |

统一规律：根元素吃**全部** —— `prefixCls` + `hashId` + `cssVarCls` + `rootClass` + 宿主透传的 `class`。

内部类名：

| 类名 | 落在哪 |
| --- | --- |
| `-avatar` | `avatar` 形态的根（`Flex`） |
| `-compact` / `-select` / `-payload` | `avatar` 形态里的 `SpaceCompact` / `Select` / `Input` |
| `-glyph` | 每个图标按钮（`view` 形态与弹层内共用） |
| `-search` | 弹层标题行的 `InputSearch` |
| `-tabs-body` / `-popover-body` | `Tabs` 的内容体（走 `classes.body`），`view` 与弹层各一份 |

`view` 形态里有两处**没有**自定义类名：Tab 标题（含图标数量的 `包名 (n)`）与右侧那一组「包名 + 类名输入框」，别指望用类名覆盖它们。

**弹层**（只在 `mode="avatar"` 且当前是 `icon://` 时出现；未选图标时按钮内是占位图标）传送到 body，挂类分两层：

| 落点 | 来源 |
| --- | --- |
| `.ant-popover`（根） | `class`、`rootClass`、`classes.root` |
| `.ant-popover-content`（内容层） | `classes.content` |

四者传的是**同一串** `prefixCls + hashId + cssVarCls + rootClass`，因为弹层里的规则要拿 `.loncra-icon-select` 当祖先选择器才命中；弹层内的标题行与内容 `div` 也各挂一份。

**但这一串绝不带宿主透传的 `class`**：宿主写的 `w-full` 这类工具类一旦上到 `.ant-popover`，一开弹层整个会被撑成全宽（2026-09-28 踩过）。
