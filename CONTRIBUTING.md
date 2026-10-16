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

- `hashId` / `cssVarCls` 不跨组件用 props 传，子部件要用就自己算一份（`hashId` 是主题级一个值，各处算出来天然一致）。**例外是纯展示子控件**：它不接 config（见 [8. 分层与职责](#8-分层与职责)），只能由父级把 `prefixCls` / `hashId` / `cssVarCls` 一起传进来。
- 同一前缀的内部子部件，不允许把选择器片段导出到别的目录再在父级展开：要么并进同一个 `genStyleHooks`，要么给它独立前缀 + 自己的 `genStyleHooks`。
- 覆盖 antd 时用 `!important`。不把"自有类自重复"（`.${componentCls}-item.${componentCls}-item` 凑到 3 个类）当作要求 —— 它有压不过的场景。
- 公共工具类落在 `antdv/src/globalStyle/style/index.ts`（`GLOBAL_PREFIX = 'loncra-common'`），命名 `loncra-common-[<变体>-]<属性>[-<修饰>][-<方向>]`：属性全拼小写连字符；变体（`after`/`before`/`hover`）放在属性前；方向只用 `t/r/b/l/x/y` 且恒为最后一段；值用 `none` 或 `xs|sm|md|lg|xl`；派生写在同一顶层键里用嵌套 `&-`；会与 antd 打架的加 `!important`（纯尺寸 / 布局 / 结构类不加）。必须有 `GlobalStyleProvider` 渲染在 `ConfigProvider` 内才会生成 CSS。

**为什么**：样式"谁调 `useStyle` 谁生成"，所以前缀与注册点必须归控件自己所有；压过 antd 需要提权，在找到更可靠的手段之前允许 `!important`。

## 参考文献

- **范例实现**：[`antdv-chat-pro/src/file-editor/`](./antdv-chat-pro/src/file-editor/)（控件目录骨架、分层、渲染分发、四份样式的活样板，对应 [7. 控件目录骨架](#7-控件目录骨架) 与 [8. 分层与职责](#8-分层与职责)）
- **Vue 官方风格指南 Priority B**：*Component files* / *Base component names* / *Tightly coupled component names* —— <https://vuejs.org/style-guide/rules-strongly-recommended.html>（对应 [9. 命名与类名](#9-命名与类名)）
