# Provider 管理端总 Provider

一层顶三件事的统一入口：客户端配置（HTTP / 运行时）、antdv 主题与布局、CRUD 配置（权限 / i18n / 字段组件表）。宿主只需要包一层 `<l-provider>`。

## 何时使用 {#when-to-use}

- 应用根节点包一次（见下）。
- 读配置：[`useAntdvConfig`](#api-1)（主题 / 尺寸 / 布局，**必须在 `<l-provider>` 之内调用**，之外直接抛错）；CRUD 配置读 [`useCrudConfig`](../crud-config-provider/README.md)。
- 三层也可以拆开单独用：`ClientProvider` / antdv 的 `ConfigProvider` / `CrudConfigProvider`（本组件内部就是按这个顺序嵌的）。

## 代码演示 {#examples}

```vue
<!-- App.vue（宿主真实用法） -->
<template>
  <l-provider
    :antdv-config="configProviderStore.antdv"
    :locale-message="localeMessage"
    :http="http"
    :runtime-mode="runtimeMode"
    :get-access-token="getAccessToken"
    :has-permission="hasPermission"
    :i18n-resolver="i18nResolver"
    :formatters="crudFormatters"
  >
    <router-view />
  </l-provider>
</template>
```

## API

### 属性 {#props}

属性分三组，**按组原样转给内层对应 Provider**：

| 组 | 属性 |
| --- | --- |
| 客户端（ClientProvider） | `http`（必填）/ `runtimeMode`（必填）/ `getAccessToken` / `resourcePath` / `openAttachmentUrl` / `formValueConvert` / `uploadBlockSize` |
| CRUD（CrudConfigProvider） | `hasPermission` / `i18nResolver` / `resolveDefaultTitle` / `onNavigate` / `fieldComponents` / `formatters` / `dateFormat` / `dateTimeFormat` |
| antdv 配置 | `antdvConfig`（宿主自己初始化的实例，不传则内部建一份默认的）/ `localeMessage`（antd 的 locale 对象，宿主从自己的 i18n 里取） |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| default | 应用内容 |

## useAntdvConfig / createAntdvConfig {#api-1}

| 成员 | 说明 |
| --- | --- |
| `createAntdvConfig(initial?)` | 建一份配置实例：**纯内存、无 IO**；`initial` 是 `state` 的部分覆盖（`locale` 不给用 `navigator.language`）。唯一的副作用是 `mode: 'system'` 时跟随系统主题（`matchMedia` 监听） |
| `useAntdvConfig()` | 读当前注入的实例；**拿不到就抛**（在 `<l-provider>` 之外用是写错了，不静默给临时实例） |
| `ANTDV_CONFIG_KEY` | 注入键 |
| `antdvConfigProviderProps` | 本组件的 props 声明（宿主包一层自己的 Provider 时复用） |

实例形状（`AntdvConfig`）：

- `state`：**输入**部分（`mode` / `token` 覆盖 / `compact` / `componentSize` / `locale` / `formLayout` / `detailLayout`），reactive，可持久化的就这些；
- `theme` / `themeConfig`：派生值（computed；`compact` 会合并进 algorithm）；
- `setMode` / `setCompact` / `setComponentSize` / `setTokenValue` / `setFormLayout` / `setDetailLayout` / `setLocale`：改状态都走 setter；`setTokenValue` **只接受标量**，防止写坏主题的嵌套结构。

**持久化与副作用归宿主**：一台机器 N 个用户 ⇒ pro 不知道"存哪、按谁存"。宿主自己 `watch(config.state)` 写回存储、`watch(config.theme)` 同步 `<html data-theme>`、`watch(config.state.locale)` 同步 i18n / dayjs（宿主 `configProviderStore` 就是这个接线的样板）。

## 类型 {#types}

`AntdvConfig` / `AntdvConfigState` / `AntdvConfigInitial` / `AntdvThemeMode` / `AntdvResolvedTheme` / `AntdvComponentSize` / `AntdvFormLayout` / `AntdvDetailLayout` / `AntdvTokenOverrides` / `AntdvConfigProviderProps` / `AntdvConfigProviderSlots` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

**本组件不产生任何 DOM**：内部是 `ClientProvider` → antd 的 `ConfigProvider` → `CrudConfigProvider` 三层纯上下文 Provider。因此**不接收 `class` / `style` / 其余 attrs**（传了没有落点，不会透传给内容）；要给内容挂类，挂到插槽里的元素上。
