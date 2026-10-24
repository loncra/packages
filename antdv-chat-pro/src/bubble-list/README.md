# `BubbleList` 气泡列表底座

IM 与 Agent 气泡列表的共享底座：滚动分页、跳转闪烁、可见区探测。不带任何聊天业务字段——业务由 `renderItem` / 插槽注入，两个套件的 `ImBubbleList` / `AgentBubbleList` 建立在它之上。

## 何时使用 {#when-to-use}

- 自建聊天界面需要"向上翻页加载 + 跳转指定消息并闪烁 + 可见区回调（已读上报）"这套列表行为。
- 一般不直接渲染：优先用 `ImBubbleList` / `AgentBubbleList`；直接使用时自行喂 `session` 与回调。

## 代码演示 {#examples}

```vue
<BubbleList
  :session="session"
  collect-visible
  @load-page="onLoadPage"
  @visible-items="onVisibleItems"
>
  <template #contentRender="{item}">{{ item.content }}</template>
</BubbleList>
```

## 行为 {#behavior}

- **滚动分页**：滚到距最旧 / 最新 `topThreshold`（默认 250px）内触发 `loadPage`（方向 `next` / `previous`）；兼容 `column-reverse` 布局（该模式下 scrollTop 为负，距离计算已换算）。
- **跳转闪烁**：`jumpToMessage(key)` 滚动到目标消息并让 `-flash` 动画闪两下后自动熄灭。
- **可见区探测**：传 `collect-visible` 后注册滚动节流 / items 变化 / window focus / visibilitychange 四路探测，回调视口内全部非 divider 气泡（节流 `throttleCollectVisibleWait`，默认 500ms）。
- **默认渲染**：不传 `renderItem` 时过滤 `hide` 的消息逐条渲染；`flashPending` 的消息根上会临时挂 `-flash` 类。
- **字段收敛**：只有 ax-bubble 会读的字段（key / role / content / loading）会传给底座——消息 id、Agent status 与组件自身的 id / status 重名，不能摊平；业务字段留在消息上，插槽按渲染下标取回。进行中的加载由 `isLoading` 判断，组件不认识业务状态码。
- role 的类名（`-user` / `-avatar` / `-system` / `-divider`）按注入的 `prefixCls` 动态生成（`createBubbleListRole`）；宿主覆盖 `prefixCls` 时跟随。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| session | 会话状态（loading / 分页标记 / elements） | [BubbleSession](#bubblesession) | 必填 | - |
| collectVisible | 是否启用可见区探测 | boolean | `false` | - |
| scrollToBottomThreshold | 距最新多少像素显示"回到底部"按钮 | number | `100` | - |
| throttleOnScrollWait | 滚动分页判定节流（ms） | number | `300` | - |
| throttleCollectVisibleWait | 可见区回调节流（ms） | number | `500` | - |
| topThreshold | 距两端多少像素触发翻页 | number | `250` | - |
| role | 覆盖默认气泡形态（不传按 prefixCls 生成） | RoleType | - | - |
| renderItem | 渲染行转换（默认过滤 hide） | `(items: T[]) => BubbleRenderRow<T>[]` | - | - |
| isLoading | 空内容气泡是否算加载中 | `(item: T) => boolean` | - | - |
| rootClass | 追加到根元素 | string | - | - |

`class` / `style` 走 attrs 落在根 `Flex`；其余 attrs 透传给底座 `AxBubbleList`。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| loadPage | 触发翻页（`next` = 更旧 / `previous` = 更新） | `(tag: PageDirection, scrollBox: HTMLElement) => void` | - |
| reloadLastPage | "回到底部"以 reloadLastPage 模式触发 | `() => void` | - |
| visibleItems | 视口内非 divider 气泡变化（需 `collect-visible`） | `(items: T[], scrollBox: HTMLElement) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| extra / avatar / header / contentRender / footer | 透传给 ax-bubble，并注入 `item`（按渲染下标取回业务气泡） | `(ctx: {index: number; item: T}) => any` | - |
| bubbleListAfter | 根内、列表之后的附加区 | `() => any` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| getScrollBox | 取滚动容器 | `() => HTMLElement \| undefined` | - |
| getVisibleItems | 取视口内气泡（可带过滤） | [见类型](#bubblelistexpose) | - |
| jumpToMessage | 跳转并闪烁 | [见类型](#bubblelistexpose) | - |
| jumpToBottom | 回到底部（或触发 reloadLastPage） | [见类型](#bubblelistexpose) | - |
| scrollTo | 按消息 key 或位置滚动 | [见类型](#bubblelistexpose) | - |

## 类型 {#types}

从包根导出：`BubbleListItem` {#bubblelistitem} / `BubbleListProps` {#bubblelistprops} / `BubbleListCallbacks` {#bubblelistcallbacks} / `BubbleRenderRow` {#bubblerenderow} / `BubbleSession` {#bubblesession} / `BubbleListExpose` {#bubblelistexpose} / `BubbleListApi` {#bubblelistapi}；`useBubbleList` / `toAxBubbleItem` / `createBubbleListRole` / `DEFAULT_BUBBLE_LIST_ROLE` 同。`useBubbleList` 是本控件的状态机出口，宿主自绘列表但复用滚动分页 / 跳转 / 探测时直接用它。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 `Flex`：`loncra-bubble-list` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`；`style` 落宿主 `style` |
| list | 底座 `AxBubbleList`：`-list` 类 + `classes.scroll`（滚动容器 `-scroll`）；其余 attrs 透传 |
| jump | "回到底部"圆形按钮（`-jump`，仅距最新超过阈值时渲染） |

无落点清单：ax-bubble 内部节点（气泡内容 / 头像 / divider）经 `role` 或 `createBubbleListRole(prefixCls)` 的 `classes` 定制，不在本控件 `classes` 表内；闪烁动画 `-flash` 是内部状态类，非宿主入口。
