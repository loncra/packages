# ClientProvider 客户端配置 Provider

HTTP / 运行时配置 Provider：把 `ClientConfig` 交给 `@loncra/client` 的 `configureClient`，并向下注入供 `useClient` 读取。

**通常不直接用**：[`Provider`](../config-provider/README.md)（管理端总 Provider）内部就是本组件，属性按组透传。需要把"客户端配置"从总 Provider 里拆出来单独配时才用它。

## 何时使用 {#when-to-use}

- 应用根节点只配客户端（HTTP / 运行时），不挂 CRUD / 主题配置时单独用。
- 读配置：`useClient()` —— 返回 `ComputedRef<ClientConfig | undefined>`，未被 `LClientProvider` 包裹时是 `undefined`（**不抛错**，与 `useAntdvConfig` 不同：客户端配置允许"没有"）。

## 代码演示 {#examples}

```vue
<template>
  <l-client-provider :http="http" runtime-mode="spa" :get-access-token="getAccessToken">
    <router-view />
  </l-client-provider>
</template>
```

## 行为

- **`setup` 内即完成配置**（`watchEffect` 同步调 `configureClient`）⇒ 早于应用内任何请求。
- props 变更（如切换企业换 token / 资源路径）会**自动重配**，不用手动调。
- `useClient()` 拿到的是响应式的同一份配置。

## API

### 属性 {#props}

即 `ClientConfig`：`http`（必填）/ `runtimeMode`（必填）/ `getAccessToken` / `resourcePath` / `openAttachmentUrl` / `formValueConvert` / `uploadBlockSize`。

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| default | 应用内容 |

## 类型 {#types}

`ClientProviderProps`（= `ClientConfig`）/ `ClientProviderSlots` / `CLIENT_CONFIG_KEY` 定义在本目录 `types.ts`；`ClientProvider` / `useClient` 从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

**本组件不产生任何 DOM**（只做配置与注入）。因此**不接收 `class` / `style` / 其余 attrs**（传了没有落点）；要挂类，挂到插槽里的元素上。
