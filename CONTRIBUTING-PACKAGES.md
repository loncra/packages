# packages 跨包通用规则

适用范围：`packages` 下所有包（含 `client` / `chat-core`）。划分依据：通用部分管"文件与契约"；控件包专用部分管"组件、类名与样式"，见 [CONTRIBUTING.md](./CONTRIBUTING.md) 第 7–12 节。规则依据与延伸阅读见 [参考文献](#参考文献)。

## 通用

### 1. 总原则

| 原则 | 为什么 | 收益 |
|---|---|---|
| 变更原因相同才同文件：改 A 必然要改 B 就放进一个文件，否则分开 —— 不看行数、不看"职责"这个名字有多大 | 混在一个文件里会共享作用域与闭包，改一处容易连带改坏别处；反过来把同因的小文件拆开，改一个概念要跳好几处 | 能局部定位、能单测，review 时一眼看出这次改动影响面 |
| 契约与实现分离：`interface` 在 `.ts`、渲染在 `.tsx`、注入用 provide/inject | 调用方只该依赖契约，不该知道底层有几种实现 | 换实现不改调用方，宿主可按需替换 |
| 唯一来源：一个值、一个常量、一条规则、一种样式含义、一段实现只在代码里定义一次 | 副本一定会腐坏，改了这处漏那处 | 改一处就够，不会出现两个版本 |
| 扩展而非复制：已有的函数差一点就改它，不另写一个做同一件事、或接着做它剩下那部分的 | 两个近似实现会各自演化，后来的人不知道该用哪个 | 一个概念只有一处实现，扩展一处两边都受益 |

样式的"唯一来源"约束的是**决定**，不是**生成出来的 CSS**：同一个设计意图只写一次（参数化、放共享位置），各控件各自生成一份规则是正常的；"长得一样"不等于"同一意图"，第 3 次重复才抽（判据见 [10. 样式](./CONTRIBUTING.md#10-样式)）。

### 2. 文件角色

| 文件 | 放什么 | 不允许放 |
|---|---|---|
| `index.ts` | 包出口：default + 类型 re-export | 实现细节 |
| `types.ts` | 横跨多文件的类型 | 运行时值、组件内联的领域类型 |
| `constants.ts` | 同一语义的字面量在 ≥2 个文件出现时收在这里 | 派生自其它常量的再计算结果 |
| `_util/` | 包内共用基础件：与框架无关的纯函数，以及依赖 vue / antdv-next 的 composable | 业务逻辑、组件本体 |
| `useXxx.ts`（仅 Vue 包） | 状态 + 副作用 | JSX |

每个包自己的目录怎么分，写在 [`packages/README.md`](./README.md) 对应的小节里（例：`client` 按 `enumerate` / `constants` / `domain` / `service` 分模块目录）。

`_util/` 是包内实现，不构成跨包契约：其他包要用只能从包出口（`@loncra/xxx`）import，不得深路径 import `@loncra/xxx/src/_util/...`。经包出口导出的项一旦被其他包使用，就按公共 API 维护 —— 改名或改签名要同步改调用方。

包文档回答同一组问题：**这个包的边界、禁止项、peer、入口、对外 API 清单**。粒度上：宿主直接使用的控件单独建 `src/<控件>/README.md`；套件内部件只在包文档里列一行；`_util/*` 只列名。

**为什么**：一个文件里出现角色混装，就等于把"这份代码属于谁、能改到什么程度"这个问题留给下一个人猜。

### 3. 一种契约、多种实现

先分清契约长什么样，再动手。**判据按顺序问，命中即止**：

1. 契约里要出现"渲染某个组件"吗？→ 是 = **E**（只在控件包出现）
2. 要跨组件层级共享一个已配置好的对象吗？→ 是 = **D**
3. 实现要按 key 被宿主替换 / 扩展吗？→ 是 = **C**
4. 只是"运行时要换一个实现 / 算法"，由调用方或宿主传进来？→ 是 = **A**
5. 只是把宿主的能力（取头像、格式化、跳转）灌进包？→ 是 = **B**

A 与 B 的分界：**A 换掉的是包内的算法 / 实现**（替换后包的控制流不变，典型是 `HttpClient`）；**B 灌进来的是宿主环境的能力**（包只调用、不拥有，典型是 `iconRender` / `getAccessToken` / `i18nResolver`）。拿不准时问"换掉它，包里的分支逻辑会不会变"：会变 ⇒ A；不会、只是结果的来源变了 ⇒ B。

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

1. 跨文件复用的类型是否都在 `types.ts`：控件的 `XxxProps` / `XxxEmits` / `XxxSlots` / `XxxExpose` 与由它们派生的联合类型一律定义在 `types.ts`，实现文件只 import，不在 `.tsx` 里内联。
2. 同一语义的字面量在 ≥2 个文件出现时，是否都在 `constants.ts`；只在一个文件出现的不要外提。
3. 配置型数据（表格列、表单 schema、菜单、映射表）是否外提成同目录 `.ts`。
4. 组件本体超 200 行而未拆的，是否写明理由。
5. [3. 一种契约、多种实现](#3-一种契约多种实现) 的归类是否符合判据：E 类满足 [3.1 E 类（渲染分发）的附加判据](#31-e-类渲染分发的附加判据)；该切表的已切表且带 `satisfies`。
6. 新增的函数与已有函数是否重复或近似重复：同一件事换个名字再来一遍，或"已有一个做了一半、又写一个接着做另一半"。这类应改已有函数（加参数 / 加分支 / 扩大导出面）而不是并存；确实要分开的，只允许契约不同（一个纯函数一个带副作用、对外对内、生命周期不同），并在 review 里写明理由。
7. 常量、枚举、类型是否复用了已有的那一份：`constants.ts` 里已有同内容的常量时，不再造第二个同义体（例如 Yes/No 只用 `YES_OR_NO_TYPE`）。

### 5. 版本与包间引用

- **`vue` 版本以 `packages` 为准、管理端跟随**：具体数字只在包自己的 `devDependencies.vue` 里钉死（不用 `^`；`antdv-chat-pro` 不装 vue，只声明 peer），管理端 `vue-basic-admin/package.json` 的 `vue` 必须与它逐字一致，且不得超出 `peerDependencies.vue` 声明的兼容范围。管理端是宿主、实际运行的那份 vue 在它手里，但版本号由 packages 定 —— 管理端不能装到 packages 还没支持的版本上。
- 管理端与 packages 是**各自独立的安装**，而管理端的 `vue-tsc` 会把包源码一起编译：两处 vue 版本不同就会出现两份 d.ts，报一屏看起来一模一样的类型错误。升级时两边同时改，装完核对各自 `node_modules/vue` 与 `@vue/runtime-core` 的版本号。
- 包之间由管理端按 `"@loncra/xxx": "file:../packages/xxx"` 引用。包的 `exports` 一律直指 `./src/*.ts`（源码直连，无构建产物），除 `.` 之外按需开子路径入口 —— 有哪些子路径看各包 `package.json`，不要在这里另记一份清单。**新增子路径时，包的 `exports` 与管理端 `vue-basic-admin/tsconfig.app.json` 的 `paths` 必须同时加** —— 管理端靠 `paths` 把包源码拉进编译，漏一处就报解析不到。若将来要发布或被第二个项目引用，必须先补构建管线（tsup 或 tsc + dts）与版本发布流程。
- **依赖归属**：由宿主提供的运行时依赖（`antdv-next`、`@antdv-next/icons`、`antdv-next-tiptap`、`dayjs`、`axios`、`dexie`、`livekit-client` 等）写进 `peerDependencies`，**同时按同版本写进 `devDependencies`** —— 只写 peer 的话包管理器不会安装，包在管理端之外做编译或类型检查时会直接报解析失败。两个例外：`vue` 只在直接使用它的包（`antdv` / `antdv-pro` / `antdv-chat`）里进 dev，`antdv-chat-pro` 不装；包间依赖（`@loncra/*`）由管理端的 `file:` 安装提供，不进 peer / dev。只有包内部真正使用的工具库才进 `dependencies`。
- **每个包自带 `tsconfig.json`**：`extends` 与管理端同一条链（`@vue/tsconfig/tsconfig.dom.json`），再补上管理端额外开启的 `noUncheckedIndexedAccess`；`include` 只列 `src`，`noEmit: true`。不要逐项抄 `compilerOptions` —— 链会随 `@vue/tsconfig` 升级，逐项抄必然漂；也不要写 `declaration`（与 `noEmit` 冲突，是死配置）。缺这一份时，该包源码一旦脱离管理端的编译单元，就会报一屏与代码无关的错误。

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

## 参考文献

- **ESLint 行数与复杂度规则**（阈值出处：`max-lines` 默认 300、官方称业界合理区间 100–500；`max-lines-per-function` 默认 50）—— <https://eslint.org/docs/latest/rules/max-lines>（对应 [4. 粒度阈值](#4-粒度阈值)）
- **架构模式**：Ports & Adapters（Alistair Cockburn）；Registry / Plugin；Provider / IoC（Vue 的 provide-inject、antd `ConfigProvider` + `useConfig`）—— 对应 [3. 一种契约、多种实现](#3-一种契约多种实现)
- **管理端工程配置**（在管理端仓库内）：`vue-basic-admin/package.json`、`.oxlintrc.json`、`eslint.config.ts` —— 对应 [5. 版本与包间引用](#5-版本与包间引用) 与 [6. 自动检查](#6-自动检查)
