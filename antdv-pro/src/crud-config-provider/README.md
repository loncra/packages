# CrudConfigProvider CRUD 配置 Provider

CRUD 相关的**应用级配置**注入：权限判定、默认文案、默认标题、跳转兜底、字段组件表、值格式表、日期格式、陈旧检查开关。与 [`ClientProvider`](../client-provider/README.md)（HTTP / 运行时）、antdv 主题配置分层，互不管对方的事。

**通常不直接用**：[`Provider`](../config-provider/README.md)（总 Provider）内部就是本组件，属性按组透传。

## 何时使用 {#when-to-use}

- 只需要 CRUD 配置、不挂客户端 / 主题时单独用。
- 读配置：`useCrudConfig()` —— 返回 `ComputedRef<CrudConfig>`，未被包裹时是**空对象**（不抛错，每个字段都有"没有就怎样"的回退，见下表）。
- 权限判定：`useActionAuth(override?)` —— 组件的 `has-permission` prop 优先，其次注入的 `hasPermission`，都没有**一律判无权限**；`permission` 传 `true` 直接过、`false`/`undefined` 直接拒。

## 各字段的回退链 {#fields}

| 字段 | 作用 | 没配置时 |
| --- | --- | --- |
| `hasPermission` | 权限判定函数 | 一律无权限 |
| `i18nResolver` | **默认**文案解析（`key → 文案`） | 回退渲染 key 本身（可见、可调试，不静默变空）；页面声明的 `i18nResolver` 优先于它 |
| `resolveDefaultTitle` | 列表页默认标题（宿主拼成 VNode，图标 / 文案都是宿主的事） | 页面不给 `title` 时无默认标题 |
| `onNavigate` | 跳转的**兜底**实现 | 页面声明 `CrudPageCore.onNavigate` 优先；都没有则不跳 |
| `fieldComponents` | 字段组件表，按 key 覆盖内置表（登记业务私有控件：`{myWidget: {component: MyWidget}}`） | 只用内置表 |
| `formatters` | 值格式表，按 key 覆盖内置格式表 | 只用内置表 |
| `dateFormat` / `dateTimeFormat` | 显示用日期格式（dayjs 格式串；**只影响显示**，后端格式宿主自己管） | pro 默认 `YYYY-MM-DD` / 含时间 |
| `staleCheck` | **陈旧检查的 app 级默认**：`false` 关掉 / `'overwrite'` 变了就覆盖 / `'prompt'` 本地动过才问 | 页面声明优先；两处都不给用形态默认（表单 `'prompt'` / 详情 `'overwrite'`） |

## 代码演示 {#examples}

```vue
<template>
  <l-crud-config-provider
    :has-permission="hasPermission"
    :i18n-resolver="(key, named) => i18n.global.t(key, named)"
    :on-navigate="onNavigate"
    :formatters="formatters"
  >
    <router-view />
  </l-crud-config-provider>
</template>
```

## API {#api}

属性即 `CrudConfig`（见上表）；插槽 `default`；注入键 `CRUD_CONFIG_KEY`（**只在包内出口，包根不导出**）。

## 类型 {#types}

`CrudConfig` / `CrudConfigProviderProps` / `CrudConfigProviderSlots` 定义在本目录 `types.ts`；`CrudConfigProvider` / `useCrudConfig` / `useActionAuth` 从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

**本组件不产生任何 DOM**（只做配置与注入，直接渲染插槽内容）。因此**不接收 `class` / `style` / 其余 attrs**（传了没有落点）；要挂类，挂到插槽里的元素上。
