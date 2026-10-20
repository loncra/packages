# packages 控件开发规范

适用范围：`antdv` / `antdv-pro` / `antdv-chat` / `antdv-chat-pro`。划分依据：控件包专用部分管"组件、类名与样式"；跨包通用部分管"文件与契约"，见 [CONTRIBUTING-PACKAGES.md](./CONTRIBUTING-PACKAGES.md) 第 1–6 节。规则依据与延伸阅读见 [参考文献](#参考文献)。

## 控件包专用

### 7. 控件目录骨架

```
xxx/
  index.ts                 控件出口：default + 类型 re-export
  Xxx.tsx                  主组件：只编排
  XxxRenderer.tsx          可选：按类型分发渲染（见 [3. 一种契约、多种实现](./CONTRIBUTING-PACKAGES.md#3-一种契约多种实现) E 类）
  types.ts                 横跨多文件的类型（含 Props / Emits / Slots / Expose）
  constants.ts             魔法值
  xxxKinds.ts              领域纯逻辑（零框架依赖）
  useXxx.ts                状态与副作用
  _util/                   包内共用基础件（纯函数 / composable / 样式机制与片段）
  <子域>/XxxSub.tsx        领域 UI 子组件
  <子域>/style/index.ts
  style/index.ts           本控件 cssinjs 样式
  README.md                控件用法（见 [12. 控件使用说明的写法](#12-控件使用说明的写法)）
```

**为什么**：位置固定后找东西不用靠记忆，新代码有既定落点，不必每次重新决定放哪。不是每个目录都要凑齐所有文件，但**出现某个文件就必须落在它对应的层**（见 [8. 分层与职责](#8-分层与职责)）。

### 8. 分层与职责

| 层 | 放什么 | 不允许放 |
|---|---|---|
| 主组件 `Xxx.tsx` | 取 prefixCls、挂样式、把 composable 的结果投给子组件 | 请求、业务分支、领域判定 |
| 分发组件 `XxxRenderer.tsx` | 按类型选实现、统一对外契约、公共外壳（判据见 [3.1 E 类（渲染分发）的附加判据](./CONTRIBUTING-PACKAGES.md#31-e-类渲染分发的附加判据)） | 请求、领域判定、实现细节 |
| 子控件（`panes/` 这类） | 纯展示：props 只有 `prefixCls/hashId/cssVarCls` + 自己的数据 | 业务、请求、自己的 prefixCls |
| 子域 UI（`tabs/`、`conversation/`） | 领域交互，读传入的状态、调回调 | 自己再起一套重复状态 |
| `useXxx.ts` | 状态 + 副作用 | JSX |
| `xxxKinds.ts` / `_util/` | 纯函数 / composable / 样式机制与片段 | 业务逻辑、组件本体 |
| `types.ts` / `constants.ts` | 跨文件类型 / 魔法值 | 组件内联声明（见 [4. 粒度阈值](./CONTRIBUTING-PACKAGES.md#4-粒度阈值) 的审计项） |
| `style/index.ts` | 该控件（或该子域）的 cssinjs 样式 | 内联 `style`、管理端全局 css |

**为什么**：主组件一旦长出请求和业务分支就再也拆不动。状态、判定、展示分开后，任一层都能单独替换或单测。

### 9. 命名与类名

- 组件名一律 `L` 前缀（`LFileEditor`），`inheritAttrs: false`；展示型子控件同样 `L` 前缀。
- 目录名 = 领域名（`tabs` / `conversation` / `panes`），文件名带父级前缀（`FileTabs` / `FileConversation`）。这条**有意偏离** Vue 官方"紧耦合子组件用父名做前缀"的写法（出处见 [参考文献](#参考文献)）：每个子控件要带自己的 `style/index.ts`，摊平会撞名。
- 新增的分发组件不要叫 `XxxHost`。
- 一个文件一个组件。
- 类名挂法：组件内部挂类用 `class` 绑定；`rootClass` 只是宿主入参，最终并入 `class`；子节点走 `classes.*`。
- `inheritAttrs: false` 之后 attrs 固定这样处理：取出 `class` / `style` 并入根节点的类与样式，其余 `{...rest}` 下推给内部真正承担该职责的组件，不得丢弃；内部节点需要的参数一律声明成显式 props。只有纯包装控件（见 [10. 样式](#10-样式)）才整体 `{...attrs}` 展开，且必须放在显式属性**之前** —— 让本组件的 `title` / `footer` / `onCancel` 覆盖宿主的同名 attrs。
- **根节点契约**：一个控件一个稳定根 —— 同一形态下，所有渲染分支（空态、加载、错误、预览）的最外层都是同一个元素 / 组件，宿主的 `class` / `style` 只落它。形态 prop（`plain` / `mode` 这类确实要换壳的）允许每个形态各有根，但**挂类与 attrs 契约必须完全一致**（`prefixCls` / `rootClass` / `classes.root` / rest attrs 的落点规则不变），README 按形态列出根元素。分支不许改根的身份，`class` / `style` 与 rest attrs 的落点也不能随分支变化。
- **根类名**：顺序固定 `prefixCls → hashId → cssVarCls → props.rootClass → attrs.class`。没有 `useStyle` 的控件（无自有样式）跳过 `hashId` / `cssVarCls`，不许随机少片段。
- **根 style**：一律取 `attrs.style`；需要内置默认值时写成 `{...defaultStyle, ...attrs.style}`（宿主优先）。数组 / 函数形态的 `style` 必须原样透传，不许丢。
- **rest attrs**：拆出 `class` / `style` 之后必须 `{...rest}` 展开（`id` / `data-*` / `aria-*` 不能吞）。
- **容器**：只在"这一层不承担布局与样式职责"时才省略自造容器；`Flex` / `Space` 这类有职责的容器保留，但只能当根内部的区域，不能自己充当某一分支的根。
- **并列节点**：表格 + 分页这类并列结构不算根 —— attrs 只落最外层，其余并列节点只吃自有类名；禁止返回 Fragment 多根。
- **不产生 DOM 的控件**（`ClientProvider` / `ConfigProvider` / `CrudConfigProvider` 这类纯插槽转发）不接收 `class` / `style`，在 README 里写明；不要 `inheritAttrs: false` 之后静默丢弃。
- **语义化 DOM 透传**：组合了多个 antd 组件、且有不止一个可定制节点的控件，必须声明 `classes` / `styles` 两个 props —— 这是本包对 antd 语义化 DOM 的统一入口。两者各是一张**区域表**：区域映射到 antd 组件就写该组件的类型（`SelectProps['classes']`、`TabsProps['styles']`…，函数形态随之继承），是我们自己的节点就写 `string` / `CSSProperties`；不手写 antd 已有的键名。
- **语义键 = 区域名**：小写 camelCase，只描述位置，不带控件名前缀（`select`，不是 `iconSelectSelect`），并与类名后缀一一对应（`-select` ↔ `select`）—— 看类名就知道 key。
- **区域就是一个 antd 组件时，值是该组件的原生语义对象**：原样透传，不改名、不翻译、不拍平（`classes.select` 直接喂给 `<Select classes>`）。该组件没有语义 DOM（如 `Avatar`）时值退化为 `string`，README 标注"仅根可定制"。
- **同一个 antd 组件出现多次**：用父区域嵌套区分（`popover.tabs`），与 antd 自己的 `classes.popup` 同一套习惯。
- **`root` 的归属**：`classes.root` / `styles.root` 只指本控件的稳定根，与内部 antd 组件的 `root` 不混用；我们自己的状态修饰类（`-preview` / `-avatar`）不是宿主入口，宿主要定制走对应区域 key。
- **合并而不是二选一**：内部固定注入的类 / 样式必须与宿主的合并（类用 `classNames(hashId, cssVarCls, 自有类, 宿主类)`，样式用 `{...自有, ...宿主}`）；宿主给的是函数形态（`(info) => 对象`）时先求值再合并。不要为了合并去深路径引 antdv-next 的内部 `_util`（不是公开出口）。
- **裸节点要带 hash**：语义类挂到裸节点时必须同时挂 `hashId` —— 顶层键编译成 `:where(.css-hash).<类名>`，没有 hash 的元素不命中（见 [10. 样式](#10-样式)）。
- **没有落点就不给 key**：纯逻辑分组不提供语义键；README 列"无落点清单"，避免"给了 key 没效果"。

**为什么**：命名是唯一的"跨文件导航"。前缀统一后，按字母排序相关文件天然相邻，grep 也一次到位。根节点与语义键同理 —— 宿主能覆盖什么必须是可预期的：同一个控件换个 `props` 就换一套选择器，等于没有覆盖 API。

### 10. 样式

- **有自有样式的控件** = 一个 `prefixCls` = 一个 `genStyleHooks`，控件目录自带 `style/index.ts`。纯包装控件（只把 antd 组件包一层、没有自有类名与样式，如 `QrCodeModal` / `TooltipValidationFormItem`）不建 `prefixCls`、不建 `style/index.ts`，也不写空的 `genStyleHooks`。控件自己算前缀：

```ts
const prefixCls = computed(() => config.value.getPrefixCls('xxx', 'loncra-xxx'))
const [hashId, cssVarCls] = useStyle(prefixCls)
```

- 控件样式一律经包内工厂 `_util/genStyleLayer.ts` 取 `genStyleHooks`（一个包一个工厂，层名只在这里写一次），`LoncraStyleToken` 也从这里取；不要直接 import `_util/style/factory`，也不要直接 import `antdv-next/theme/internal`。
- `createStyleHooks` 只给需要自己工厂的包（`antdv-pro` / `antdv-chat`）从包出口取。
- 其他包与宿主只从包出口取，不深路径 import `_util/`（见 [2. 文件角色](./CONTRIBUTING-PACKAGES.md#2-文件角色)）。
- `hashId` / `cssVarCls` 不跨组件用 props 传，子部件要用就自己算一份（`hashId` 是主题级一个值，各处算出来天然一致）。**例外是纯展示子控件**：它不接 config（见 [8. 分层与职责](#8-分层与职责)），只能由父级把 `prefixCls` / `hashId` / `cssVarCls` 一起传进来。
- 同一前缀的内部子部件，不允许把选择器片段导出到别的目录再在父级展开：要么并进同一个 `genStyleHooks`，要么给它独立前缀 + 自己的 `genStyleHooks`。
- 覆盖 antd 交给层序（见 [11. 样式层与覆盖顺序](#11-样式层与覆盖顺序)），控件样式里**不写** `!important`；它只留给层序管不到的地方（未分层的第三方 CSS、必须压过宿主 Tailwind 工具类、宿主没开 layer 模式）。不把"自有类自重复"（`.${componentCls}-item.${componentCls}-item` 凑到 3 个类）当作要求 —— 它有压不过的场景，且与层序无关。
- **需要跨控件共享的样式写成参数化片段**：放在 `_util/style/fragments.ts` 这类共享位置，签名 `(token, ...)`、键用 `token.componentCls` 拼，由各控件的 `genStyleHooks` 自己展开（形态对齐 `antdv-next/dist/style` 的 `genCompactItemStyle` / `getArrowStyle`）。片段可以跨包 import；**不许**从一个控件目录导出给另一个控件用（见上一条）。没有消费方的片段随定义一起删。
- **包内不提供全局工具类**：间距、边框、宽度这类普通布局宿主用 Tailwind、包内写 `${componentCls}-xxx`；"宿主也要用"的样式（如全高容器）由宿主在自己的层里写，不从包里要。
- **顶层键会与主题 hashId 复合**：写 `` [`${componentCls}-xxx`] `` 这种顶层键时，cssinjs 生成的是 `:where(.css-hash).<类名>`（`@antdv-next/cssinjs` 的 `injectSelectorHash`）⇒ **挂这个类的元素自己必须带 `css-hash`**。antd 组件根（`a-spin` / `a-divider` / `a-flex` / `a-menu`）带；裸 `<div>`、以及 `classes.container` / `classes.title` 这类弹层内部节点只拿到我们的 class ⇒ 不命中。
- **嵌套键同样受 hashId 约束**：`[componentCls]: { '&-xxx': … }` 的编译结果是 `:where(.css-hash).<componentCls>-xxx` —— 父选择器已经带上 hash 前缀，所以挂 `-xxx` 的元素**自己也要带 `css-hash`**。挂在 antd 组件根上能命中（它们自带同一个主题 hash）；挂在裸 `<div>` 上不命中。
- **弹层（传送到 body）的样式**：弹层内容不在控件祖先下，写在 `[componentCls]` 里的规则一律不命中。按弹层组件提供的能力二选一：① 弹层根是 antd 组件 ⇒ 用"顶层键 + antd 根"，规则独立写在 `[componentCls]` 之外；② 弹层提供 `rootClass` / `classes.root` ⇒ 把 `prefixCls + hashId + cssVarCls` 组成的作用域串挂到弹层根与内容层，再用祖先选择器区分子域。第 ② 种**不把宿主透传的 `class` 放进这串**：`w-full` 这类工具类会把整个弹层撑满。

**为什么**：样式"谁调 `useStyle` 谁生成"，所以前缀与注册点必须归控件自己所有；压过 antd 归层序管，`!important` 只补层序管不到的地方。

### 11. 样式层与覆盖顺序

四个包各有自己的顶层 CSS 层：`antdv-loncra`（`antdv`）/ `antdv-loncra-pro` / `antdv-loncra-chat` / `antdv-loncra-chat-pro`。**层序由宿主声明**，写在宿主顶层 CSS 的首行：

```css
@layer theme, base, antd, antdx, antdv-loncra, antdv-loncra-pro, antdv-loncra-chat, antdv-loncra-chat-pro, components, utilities;
```

越靠后越优先。`antd` / `antdx` 分别是 `antdv-next` 与 `@antdv-next/x` 的层，`components` / `utilities` 是宿主 Tailwind 的层。包内**只写层名、不发声明**：工厂里写 `layer: {name: 'antdv-loncra-pro'}`，不写 `dependencies`。新增控件包时必须同步宿主那一行。

- **覆盖关系（甲）**：我们 > `antd` / `antdx` ⇒ 与 antd 抢同一个属性**不需要 `!important`**；宿主 `components` / `utilities` > 我们 ⇒ 宿主用 `w-full` / `size-full` 这类工具类**可以覆盖我们**，这是有意保留的。
- **前提是 cssinjs 单实例**：宿主的 `resolve.dedupe` 必须含 `@antdv-next/cssinjs`，否则本仓解析到的是第二份副本（`StyleContext` 是模块级 Symbol），工厂的 `layer` 被**静默忽略**、样式退回非分层。判据：自有规则被 `@layer antdv-loncra*` 包裹（DevTools 里筛 `CSSLayerBlockRule`）。**不需要**把 `@antdv-next/cssinjs` 写进任何 `dependencies`。
- **`order` 只在退化场景有意义**：宿主没打开 `<a-style-provider layer>` 时，cssinjs 只在 `StyleContext.layer` 为真时才采用工厂的 `layer` ⇒ 这时样式不进任何层、`prepend` 回到 `'queue'`、priority 重新参与插入排序。包级 `order` 固定 `antdv` = 1 / `-pro` = 2 / `-chat` = 3 / `-chat-pro` = 4。
- **宿主不声明那四个层名时**，层序退回"层名首次出现"的顺序：我们的层块在有 layer 时被追加到 `<head>` 末尾 ⇒ 反而变成最强（能压宿主工具类）。这不是我们承诺的语义，所以那一行属于宿主契约。
- **`!important` 只剩三种场合**：① 宿主没开 layer 模式；② 压**未分层**的第三方 CSS（`antdv-next-tiptap` 的 UnoCSS 产物、`@antdv-next/x-markdown` 的 `.x-markdown-*`）——未分层的规则恒赢所有层；③ 必须压过宿主 Tailwind 工具类（甲之下它们比我们强）。
- 包内不发全局类：跨控件共享走参数化片段（见 [10. 样式](#10-样式)），全高容器这类"宿主也要用"的样式由宿主写在自己的 `components` 层里，它比我们的层强，属预期。

**为什么**：层序由一条宿主声明一次定死，比在每个控件里逐条提权可维护；`!important` 退回到"层序管不到的地方"这一种职责。

包内不要为了提权另开一层；控件的样式也不要落到宿主的全局 css 里（见 [10. 样式](#10-样式)）。

### 12. 控件使用说明的写法

控件说明落在控件自己的目录：`src/<控件>/README.md`。只给**宿主直接使用的控件**单独建文件；套件内部件在包 `README.md` 的控件表里列一行；`_util/*` 只列名。样板：[`antdv/src/icon-select/README.md`](./antdv/src/icon-select/README.md)。

分节、标题与锚点固定如下，没有的部分直接不写：

```markdown
# `Xxx` 中文名

一句话说清这个控件给谁用、解决什么问题。

## 何时使用 {#when-to-use}

## 代码演示 {#examples}

## API

### 属性 {#props}

### 事件 {#events}

### 插槽 {#slots}

### 方法 {#methods}

## 类型 {#types}

### XxxType {#xxxtype}

## 语义化 DOM {#semantic-dom}
```

- **表格列名**：属性表与类型表用 `属性 | 说明 | 类型 | 默认值 | 版本`，事件 / 插槽 / 方法表用 `事件 | 说明 | 类型 | 版本`（首列换成 `插槽` / `方法`）。**版本列保留、值一律写 `-`**。`classes` / `styles` 这类共用一个区域表的类型不单独建类型节：在「语义化 DOM」开头点明类型名即可。
- **锚点**：`API` 下的四个小节用简化锚点（`{#props}` / `{#events}` / `{#slots}` / `{#methods}`），类型用小写类型名（`{#iconselectmodetype}`）；`{#when-to-use}` / `{#examples}` / `{#semantic-dom}` 照上面的骨架。
- **不写** frontmatter、Design Token 表、FAQ，也不要用 `<demo src>` —— 代码演示直接内联 vue / ts 代码块。
- **写清边界**：默认值从哪来、哪些 attrs 透传给哪个子组件、哪个 prop 形式可选而实际必填、多条规则命中时谁优先（范例：`IconSelect` 的 `preview` 优先于 `mode`；`iconRender` 不传则图标位置空白、外壳照常渲染）。
- **「语义化 DOM」按区域写**：一张 `区域 | 说明` 表，每个区域一句“是什么元素、能定制什么”，口径对齐 antdv-next 组件文档（`docs/src/pages/components/*/demo/_semantic.vue` 的 Semantic DOM）。`root` 行写清 `prefixCls` / `hashId` / `cssVarCls` / `class` / `style` / `rootClass` / `classes.root` 落在哪；弹层写传送位置与已知坑（如弹层那一串类不带宿主透传的 `class`）。一个 key 覆盖多个同义节点、没有语义 DOM 的区域、**拿不到的区域**（纯逻辑分组不给 key）都在说明里点出来，别让下一个人去猜。
- **不写跨包指引**：包 `README.md` 不解释"为什么这样分"，控件说明里不出现"完整清单见某包"。

#### 包 `README.md`

必备四节，标题按包类型取用；确有包内专属内容时可再增补一节：

```markdown
# `@loncra/xxx`

一句话说清这个包的边界。

## 安装与引用

## 控件

## 目录

## 本包的开发规范
```

- **第二节**：控件包用 `控件`，有套件内部件的用 `控件与套件`；`client` / `chat-core` 用 `模块` 或 `模块分层`。
- **`目录`**：可选，纯服务包可以没有。
- **增补节**：只写本包专属内容（例：`client` 的 `启动`、`chat-core` 的 `词槽标准的组合方式`）。
- **`本包的开发规范`**：只写本包**独有**的约定；通用规则引用而不复制 —— 控件规则见本文件第 7–12 节，跨包规则见 [CONTRIBUTING-PACKAGES.md](./CONTRIBUTING-PACKAGES.md) 第 1–6 节。

## 参考文献

- **范例实现**：[`antdv-chat-pro/src/file-editor/`](./antdv-chat-pro/src/file-editor/)（控件目录骨架、分层、渲染分发、四份样式的活样板，对应 [7. 控件目录骨架](#7-控件目录骨架) 与 [8. 分层与职责](#8-分层与职责)）
- **Vue 官方风格指南 Priority B**：*Component files* / *Base component names* / *Tightly coupled component names* —— <https://vuejs.org/style-guide/rules-strongly-recommended.html>（对应 [9. 命名与类名](#9-命名与类名)）
- **antdv-next 组件文档结构规范**（在同级的 `antdv-next` 仓库内）：`docs/src/pages/components/API_STRUCTURE_GUIDE.md` —— 控件说明的分节、锚点与表格列名出处（对应 [12. 控件使用说明的写法](#12-控件使用说明的写法)）
