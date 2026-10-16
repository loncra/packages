# packages 控件开发规范

适用范围：`antdv` / `antdv-pro` / `antdv-chat` / `antdv-chat-pro`。划分依据：控件包专用部分管"组件、类名与样式"；跨包通用部分管"文件与契约"，见 [CONTRIBUTING-PACKAGES.md](./CONTRIBUTING-PACKAGES.md) 第 1–6 节。规则依据与延伸阅读见 [参考文献](#参考文献)。

## 控件包专用

### 7. 控件目录骨架

```
xxx/
  index.ts                 控件出口：default + 类型 re-export
  Xxx.tsx                  主组件：只编排
  XxxRenderer.tsx          可选：按类型分发渲染（见 [3. 一种契约、多种实现](./CONTRIBUTING-PACKAGES.md#3-一种契约多种实现) E 类）
  types.ts                 横跨多文件的类型
  constants.ts             魔法值
  xxxKinds.ts              领域纯逻辑（零框架依赖）
  useXxx.ts                状态与副作用
  _util/                   包内共用基础件（纯函数 + composable）
  <子域>/XxxSub.tsx        领域 UI 子组件
  <子域>/style/index.ts
  style/index.ts           本控件 cssinjs 样式
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
| `xxxKinds.ts` / `_util/` | 纯函数 / composable | 业务逻辑、组件本体 |
| `types.ts` / `constants.ts` | 跨文件类型 / 魔法值 | 组件内联声明（见 [4. 粒度阈值](./CONTRIBUTING-PACKAGES.md#4-粒度阈值) 的审计项） |
| `style/index.ts` | 该控件（或该子域）的 cssinjs 样式 | 内联 `style`、管理端全局 css |

**为什么**：主组件一旦长出请求和业务分支就再也拆不动。状态、判定、展示分开后，任一层都能单独替换或单测。

### 9. 命名与类名

- 组件名一律 `L` 前缀（`LFileEditor`），`inheritAttrs: false`；展示型子控件同样 `L` 前缀。
- 目录名 = 领域名（`tabs` / `conversation` / `panes`），文件名带父级前缀（`FileTabs` / `FileConversation`）。这条**有意偏离** Vue 官方"紧耦合子组件用父名做前缀"的写法（出处见 [参考文献](#参考文献)）：每个子控件要带自己的 `style/index.ts`，摊平会撞名。
- 新增的分发组件不要叫 `XxxHost`。
- 一个文件一个组件。
- 类名挂法：根节点一律用 `class`，不用 `rootClass`；子节点走 `classes.*`。

**为什么**：命名是唯一的"跨文件导航"。前缀统一后，按字母排序相关文件天然相邻，grep 也一次到位。

### 10. 样式

- 一个控件 = 一个 `prefixCls` = 一个 `genStyleHooks`，控件目录自带 `style/index.ts`。控件自己算前缀：

```ts
const prefixCls = computed(() => config.value.getPrefixCls('xxx', 'loncra-xxx'))
const [hashId, cssVarCls] = useStyle(prefixCls)
```

- 控件样式一律经包内工厂 `_util/genStyleLayer.ts` 取 `genStyleHooks`（一个包一个工厂，层名只在这里写一次），不要直接 import `antdv-next/theme/internal`。
- `hashId` / `cssVarCls` 不跨组件用 props 传，子部件要用就自己算一份（`hashId` 是主题级一个值，各处算出来天然一致）。**例外是纯展示子控件**：它不接 config（见 [8. 分层与职责](#8-分层与职责)），只能由父级把 `prefixCls` / `hashId` / `cssVarCls` 一起传进来。
- 同一前缀的内部子部件，不允许把选择器片段导出到别的目录再在父级展开：要么并进同一个 `genStyleHooks`，要么给它独立前缀 + 自己的 `genStyleHooks`。
- 覆盖 antd 交给层序（见 [11. 样式层与覆盖顺序](#11-样式层与覆盖顺序)），控件样式里**不写** `!important`；它只留给层序管不到的地方（未分层的第三方 CSS、必须压过宿主 Tailwind 工具类、宿主没开 layer 模式）。不把"自有类自重复"（`.${componentCls}-item.${componentCls}-item` 凑到 3 个类）当作要求 —— 它有压不过的场景，且与层序无关。
- 公共工具类落在 `antdv/src/globalStyle/style/index.ts`（`GLOBAL_PREFIX = 'loncra-common'`），命名 `loncra-common-[<变体>-]<属性>[-<修饰>][-<方向>]`：属性全拼小写连字符；变体（`after`/`before`/`hover`）放在属性前；方向只用 `t/r/b/l/x/y` 且恒为最后一段；值用 `none` 或 `xs|sm|md|lg|xl`；派生写在同一顶层键里用嵌套 `&-`；与宿主 Tailwind 工具类抢属性且必须赢的加 `!important`（纯尺寸 / 布局 / 结构类不加）。必须有 `GlobalStyleProvider` 渲染在 `ConfigProvider` 内才会生成 CSS。

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
- **公共工具类**（`.loncra-common*`）目前仍经旧工厂注册在 `@layer antd`，其中没带 `!important` 的 `-min-width-xl` / `-scroll` / `-full-spin` 会被宿主 Tailwind 工具类压掉，属预期；切到自有层后升到 `antdv-loncra`（仍低于 `utilities`），结论不变。

**为什么**：层序由一条宿主声明一次定死，比在每个控件里逐条提权可维护；`!important` 退回到"层序管不到的地方"这一种职责。

上面是**目标状态**：还没切到自有层的控件（仍经旧工厂 `_util/genStyle.ts`，样式与 antd 一起落在 `@layer antd`）在切换前依旧要靠 `!important` 压 antd，别提前把它们撤掉。

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

- **表格列名**：属性表与类型表用 `属性 | 说明 | 类型 | 默认值 | 版本`，事件 / 插槽 / 方法表用 `事件 | 说明 | 类型 | 版本`（首列换成 `插槽` / `方法`）。**版本列保留、值一律写 `-`**。
- **锚点**：`API` 下的四个小节用简化锚点（`{#props}` / `{#events}` / `{#slots}` / `{#methods}`），类型用小写类型名（`{#iconselectmodetype}`）；`{#when-to-use}` / `{#examples}` / `{#semantic-dom}` 照上面的骨架。
- **不写** frontmatter、Design Token 表、FAQ，也不要用 `<demo src>` —— 代码演示直接内联 vue / ts 代码块。
- **写清边界**：默认值从哪来、哪些 attrs 透传给哪个子组件、哪个 prop 形式可选而实际必填、多条规则命中时谁优先（范例：`IconSelect` 的 `preview` 优先于 `mode`；`iconRender` 不传则图标位置空白、外壳照常渲染）。
- **「语义化 DOM」要写"拿不到什么"**：根元素是谁、`prefixCls` / `hashId` / `cssVarCls` / `class` / `rootClass` 各落在哪、内部类名清单、弹层（传送到 body）的落点与已知坑（如弹层那一串类不带宿主透传的 `class`）；**没有自有类名的节点显式点出来**，别让下一个人去猜。
- **不写跨包指引**：包 `README.md` 不解释"为什么这样分"，控件说明里不出现"完整清单见某包"。

## 参考文献

- **范例实现**：[`antdv-chat-pro/src/file-editor/`](./antdv-chat-pro/src/file-editor/)（控件目录骨架、分层、渲染分发、四份样式的活样板，对应 [7. 控件目录骨架](#7-控件目录骨架) 与 [8. 分层与职责](#8-分层与职责)）
- **Vue 官方风格指南 Priority B**：*Component files* / *Base component names* / *Tightly coupled component names* —— <https://vuejs.org/style-guide/rules-strongly-recommended.html>（对应 [9. 命名与类名](#9-命名与类名)）
- **antdv-next 组件文档结构规范**（在同级的 `antdv-next` 仓库内）：`docs/src/pages/components/API_STRUCTURE_GUIDE.md` —— 控件说明的分节、锚点与表格列名出处（对应 [12. 控件使用说明的写法](#12-控件使用说明的写法)）
