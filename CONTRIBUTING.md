# packages 开发规范

适用范围：`packages` 下所有包。分两类，规则范围不同：

| 类别 | 包 | 生效部分 |
|---|---|---|
| **通用** | 全部包（含 `client` / `chat-core`） | [1. 总原则](#1-总原则) – [6. 自动检查](#6-自动检查) |
| **控件包专用** | `antdv` / `antdv-pro` / `antdv-chat` / `antdv-chat-pro` | [7. 控件目录骨架](#7-控件目录骨架) – [10. 样式](#10-样式) |

划分依据：通用部分管"文件与契约"，控件包部分管"组件、类名与样式"。规则依据与延伸阅读见 [参考文献](#参考文献)。

## 通用

### 1. 总原则

| 原则 | 为什么 | 收益 |
|---|---|---|
| 一个文件一个职责：组件、composable、纯函数、类型、样式各归其位 | 混在一个文件里会共享作用域与闭包，改一处容易连带改坏别处 | 能局部定位、能单测、review 时一眼看出越层 |
| 契约与实现分离：`interface` 在 `.ts`、渲染在 `.tsx`、注入用 provide/inject | 调用方只该依赖契约，不该知道底层有几种实现 | 换实现不改调用方，宿主可按需替换 |
| 唯一来源：一个值、一条规则、一种样式含义只在代码里定义一次 | 副本一定会腐坏，改了这处漏那处 | 改一处就够，不会出现两个版本 |

### 2. 文件角色

| 文件 | 放什么 | 不允许放 |
|---|---|---|
| `index.ts` | 包出口：default + 类型 re-export | 实现细节 |
| `types.ts` | 横跨多文件的类型 | 运行时值、组件内联的领域类型 |
| `constants.ts` | 魔法值 | 派生自其它常量的再计算结果 |
| `_util/` | 与框架无关的纯函数 | Vue / 组件 API |
| `useXxx.ts`（仅 Vue 包） | 状态 + 副作用 | JSX |

每个包自己的目录怎么分，写在 [`packages/README.md`](./README.md) 对应的小节里（例：`client` 按 `enumerate` / `constants` / `domain` / `service` 分模块目录）。

包文档回答同一组问题：**这个包的边界、禁止项、peer、入口、对外 API 清单**。粒度上：宿主直接使用的控件单独建 `src/<控件>/README.md`；套件内部件只在包文档里列一行；`_util/*` 纯函数只列名。

**为什么**：一个文件里出现角色混装，就等于把"这份代码属于谁、能改到什么程度"这个问题留给下一个人猜。

### 3. 一种契约、多种实现

先分清契约长什么样，再动手。**判据按顺序问，命中即止**：

1. 契约里要出现"渲染某个组件"吗？→ 是 = **E**（只在控件包出现）
2. 要跨组件层级共享一个已配置好的对象吗？→ 是 = **D**
3. 实现要按 key 被宿主替换 / 扩展吗？→ 是 = **C**
4. 只是"运行时要换一个实现 / 算法"，由调用方或宿主传进来？→ 是 = **A**
5. 只是把宿主的能力（取头像、格式化、跳转）灌进包？→ 是 = **B**

| 类 | 契约长什么样 | 落点 | 本仓实例 |
|---|---|---|---|
| **A 接口 + 适配器** | `interface Foo {...}`，实现由外部注入 | 纯 `.ts`（接口一个文件、实现一个文件） | `client` 的 `HttpClient` + `adapters/axios` 的 `createAxiosHttpClient` |
| **B 宿主注入能力** | 一组回调 / 渲染函数 / 能力对象 | 契约 `.ts`，消费在组件 props 或配置对象 | `client` 的 `ClientConfig`（`getAccessToken` / `openAttachmentUrl` / `formValueConvert`）；`im/host.ts` 的 `ImHost` / `ImChatHost` / `ImPageHost`；`iconRender`、`getIcon`、`i18nResolver`、`onNavigate` |
| **C 注册表 / 可覆盖** | `Record<Key, Impl>` + 内置默认 + 覆盖入口 | `.ts` | `crud-page/registry.ts` 的 `usePageRegistry()`；`_util/crud/actions.ts` 的 `useActionResolver` / `overrideAction` |
| **D Provider / 注入** | `InjectionKey<T>` + Provider 组件 | key 与类型 `.ts`，Provider `.tsx`（要渲染 slot） | `CLIENT_CONFIG_KEY` + `client-provider/ClientProvider.tsx`；`CRUD_CONFIG_KEY`；`ANTDV_CONFIG_KEY` |
| **E 渲染分发** | 按 `kind` / `type` / `role` 选一个**子组件**渲染，对外收敛成窄契约 | `.tsx`（**只有这一类必须 `.tsx`**） | `file-editor/FilePaneHost.tsx`（按 pane kind 选实现） |

**业界叫法**（照用，不要自造名词）：A = Ports & Adapters / 适配器模式；B = Host capabilities / 宿主注入（render props）；C = Registry / Plugin；D = Provider / IoC；E = Strategy 的组件版 / renderer dispatch。

**为什么**：这五类各有确定性成本（编译期检查、运行时配置、公开 API）。先分类再写，能避免两种错误 —— 把普通条件渲染包装成"策略"，或者该抽象的地方到处硬编码。

#### 3.1 E 类（渲染分发）的附加判据

三条同时满足才建：

1. 有 ≥2 个互斥实现，且调用方不该知道有几个；
2. 这些实现共享同一套外壳（容器 / loading / 样式前缀 / 对外方法）；
3. 对外契约能收敛成很窄的一组方法。

只做四件事：① 按类型选实现；② 收敛 `expose` + `emit`；③ 收公共外壳与样式；④ 收"跨实现的公共规则"。

禁止：写请求；写业务分支；写判定逻辑（判定外提纯函数，这里只留一次查表）。

#### 3.2 切成表，还是留在 `if/else`

判据不是"讨厌 `if`"，而是"集合会不会继续长 + 分支体里有没有真逻辑"。

**切成表（C 类）**：同时满足 ① 分支 ≥3 个且互斥；② 每个分支体只做"选一个实现 / 一段映射"；③ 集合预期继续增长。

**留在 `if/else` / `switch`**：① 分支体各自有独立逻辑、副作用或数据流（硬塞进表就变成"表里藏 `if`"）；② 分支 ≤2 且不预期增长；③ 判定本身是优先级短路（如失败态覆盖正常态：先判失败、再选实现）。

**切表时的强制要求**：

- 表用 `satisfies Record<Union, Entry>` 标注，Union 收在 `types.ts`。**没有 `satisfies` 就不要切表** —— 表最大的代价是丢掉编译期穷尽检查（新增一个种类却忘了加表项 ⇒ 静默走兜底）。
- 判定逻辑留在 `.ts`（不要 import 组件进去）；渲染表与实现同目录、用 `.tsx`。同一件事可以有两张表（判定表 + 渲染表），由同一个 Union 串起来。
- **反模式**：表里只映射"组件"，各实现的 props 构建仍留在调用方 —— 那只是把 `if/else` 搬了个家。表项必须能把差异化 props 一起收进去（`render(ctx)` 或 `props(ctx)`）。

### 4. 粒度阈值

| 对象 | 上限 | 适用 | 检查方式 |
|---|---|---|---|
| 任何文件 | **400 行**（不数空行与纯注释行） | 全部包 | oxlint `max-lines` = 400 |
| `.ts` 逻辑文件（`useXxx.ts` / `xxxKinds.ts` / `_util/*`） | **400 行** | 全部包 | 同上 |
| 普通函数 | 50 行 | 全部包 | 人工 |
| 圈复杂度 | 10 | 全部包 | oxlint `complexity` = 10 |
| 块嵌套深度 | 4 | 全部包 | oxlint `max-depth` = 4 |
| 组件本体（`setup` / 组件函数） | **200 行** | 仅控件包 | oxlint `max-lines-per-function` = 200 |

**为什么**：行数本身不是目标，它只是"职责太多"的代理指标。400 与 ESLint 默认值同量级（出处见 [参考文献](#参考文献)）；200 用在组件上，是因为组件本体就是它的 `setup` 函数。

- 组件本体按 `setup` 计：`max-lines-per-function` 不区分组件与普通函数，取 200 是为了不把每个大组件的 `setup` 都报一遍；普通函数的 50 行靠 review。
- 阈值计逻辑行（空行、纯注释行不计），与 `wc -l` 的数字会有出入。
- 超限不等于必须拆，但必须给出"为什么不拆"的理由（通常是"再拆会把一份状态拆到两个 composable 里"）。

**人工判定的条目（审计项）**：

1. 跨文件复用的类型是否都在 `types.ts`，没有内联在实现文件里。
2. 魔法值是否都在 `constants.ts`。
3. 配置型数据（表格列、表单 schema、菜单、映射表）是否外提成同目录 `.ts`。
4. 组件本体超 200 行而未拆的，是否写明理由。
5. [3. 一种契约、多种实现](#3-一种契约多种实现) 的归类是否符合判据：E 类满足 [3.1 E 类（渲染分发）的附加判据](#31-e-类渲染分发的附加判据)；该切表的已切表且带 `satisfies`。

### 5. 版本与包间引用

- **`vue` 版本以 `packages` 为准、管理端跟随**：具体数字只在包自己的 `devDependencies.vue` 里钉死（不用 `^`；`antdv-chat-pro` 不装 vue，只声明 peer），管理端 `vue-basic-admin/package.json` 的 `vue` 必须与它逐字一致，且不得超出 `peerDependencies.vue` 声明的兼容范围。管理端是宿主、实际运行的那份 vue 在它手里，但版本号由 packages 定 —— 管理端不能装到 packages 还没支持的版本上。
- 管理端与 packages 是**各自独立的安装**，而管理端的 `vue-tsc` 会把包源码一起编译：两处 vue 版本不同就会出现两份 d.ts，报一屏看起来一模一样的类型错误。升级时两边同时改，装完核对各自 `node_modules/vue` 与 `@vue/runtime-core` 的版本号。
- 包之间由管理端按 `"@loncra/xxx": "file:../packages/xxx"` 引用。包的 `exports` 一律直指 `./src/*.ts`（源码直连，无构建产物），除 `.` 之外按需开子路径入口 —— 有哪些子路径看各包 `package.json`，不要在这里另记一份清单。**新增子路径时，包的 `exports` 与管理端 `vue-basic-admin/tsconfig.app.json` 的 `paths` 必须同时加** —— 管理端靠 `paths` 把包源码拉进编译，漏一处就报解析不到。若将来要发布或被第二个项目引用，必须先补构建管线（tsup 或 tsc + dts）与版本发布流程。

**为什么**：源码直连换来的是"改包源码 → 管理端立刻生效"，这是单人维护下最省时间的形态；代价就是上面那条版本必须钉死。

### 6. 自动检查

`packages/.oxlintrc.json` 里 [4. 粒度阈值](#4-粒度阈值) 的四个数值阈值均为 **warn**；`correctness` 类为 **error**（含 `no-unused-vars`，死 import / 死变量直接报错）。

```bash
cd packages
npm run lint
```

- 未装 `oxlint` 时用 `npx --yes oxlint@1.83.0 .`（与管理端同版本，行为一致）。
- **阈值只能写在配置文件里**：命令行 `-A all -W max-lines` 会把规则选项重置成默认值，不要用它筛"只看尺寸规则"。
- 尺寸阈值先以 warn 上线，存量清零后再升 error。
- **不要用 `oxlint-disable` 注释压制报错**：规则报错改代码；确需抑制就写进 `packages/.oxlintrc.json`，跟规则一起过 review。

## 控件包专用

### 7. 控件目录骨架

```
xxx/
  index.ts                 控件出口：default + 类型 re-export
  Xxx.tsx                  主组件：只编排
  XxxRenderer.tsx          可选：按类型分发渲染（见 [3. 一种契约、多种实现](#3-一种契约多种实现) E 类）
  types.ts                 横跨多文件的类型
  constants.ts             魔法值
  xxxKinds.ts              领域纯逻辑（零框架依赖）
  useXxx.ts                状态与副作用
  _util/                   与框架无关的纯工具
  <子域>/XxxSub.tsx        领域 UI 子组件
  <子域>/style/index.ts
  style/index.ts           本控件 cssinjs 样式
```

**为什么**：位置固定后找东西不用靠记忆，新代码有既定落点，不必每次重新决定放哪。不是每个目录都要凑齐所有文件，但**出现某个文件就必须落在它对应的层**（见 [8. 分层与职责](#8-分层与职责)）。

### 8. 分层与职责

| 层 | 放什么 | 不允许放 |
|---|---|---|
| 主组件 `Xxx.tsx` | 取 prefixCls、挂样式、把 composable 的结果投给子组件 | 请求、业务分支、领域判定 |
| 分发组件 `XxxRenderer.tsx` | 按类型选实现、统一对外契约、公共外壳（判据见 [3.1 E 类（渲染分发）的附加判据](#31-e-类渲染分发的附加判据)） | 请求、领域判定、实现细节 |
| 子控件（`panes/` 这类） | 纯展示：props 只有 `prefixCls/hashId/cssVarCls` + 自己的数据 | 业务、请求、自己的 prefixCls |
| 子域 UI（`tabs/`、`conversation/`） | 领域交互，读传入的状态、调回调 | 自己再起一套重复状态 |
| `useXxx.ts` | 状态 + 副作用 | JSX |
| `xxxKinds.ts` / `_util/` | 纯函数 | Vue / 组件 API |
| `types.ts` / `constants.ts` | 跨文件类型 / 魔法值 | 组件内联声明（见 [4. 粒度阈值](#4-粒度阈值) 的审计项） |
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
- **ESLint 行数与复杂度规则**（阈值出处：`max-lines` 默认 300、官方称业界合理区间 100–500；`max-lines-per-function` 默认 50）—— <https://eslint.org/docs/latest/rules/max-lines>（对应 [4. 粒度阈值](#4-粒度阈值)）
- **架构模式**：Ports & Adapters（Alistair Cockburn）；Registry / Plugin；Provider / IoC（Vue 的 provide-inject、antd `ConfigProvider` + `useConfig`）—— 对应 [3. 一种契约、多种实现](#3-一种契约多种实现)
- **管理端工程配置**（在管理端仓库内）：`vue-basic-admin/package.json`、`.oxlintrc.json`、`eslint.config.ts` —— 对应 [5. 版本与包间引用](#5-版本与包间引用) 与 [6. 自动检查](#6-自动检查)
