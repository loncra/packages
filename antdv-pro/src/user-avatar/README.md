# UserAvatar 用户头像

用户头像：`user.avatar` 的附件地址 → 兜底 `fallback` 图片 → 再兜底**人名首字**。

## 何时使用 {#when-to-use}

- 任何要展示用户头像的位置（列表、详情、聊天气泡…）。
- 只想显示人名首字：`user` 传了但 `avatar` 为空、又没给 `fallback` 时自动就是首字。

## 代码演示 {#examples}

```vue
<template>
  <l-user-avatar :user="entity.principal" size="default" />
  <l-user-avatar :user="entity.principal" fallback="/img/default-avatar.png" />
  <l-user-avatar :user="entity.principal">
    <template #text>管理</template>
  </l-user-avatar>
</template>
```

## 行为

- **取图优先级**：`AttachmentService.getAvatarUrlIfNotNull(user.avatar)` → `fallback` → 首字（`AuthServerService.getPrincipalNameByUserDetails(user)` 的第一个字符；也可用 `#text` 插槽完全接管）。
- 两个取值函数来自 `@loncra/client`（`AuthServerService` / `AttachmentService`），本组件不做请求，只做"地址解析"。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| user | 用户（平台用户或用户元数据），取 `avatar` 与人名 | `PlatformUser \| UserMetadata` | - |
| fallback | 头像地址的图片兜底 | string | - |
| prefixCls | 覆盖前缀（缺省 `loncra-user-avatar`） | string | - |
| rootClass | 根类名（拼在 `prefixCls` 之后、`attrs.class` 之前） | string | - |

其余属性（`size` / `shape` 等）经 attrs 透传给 antd 的 `Avatar`。

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| text | 完全接管内容（缺省渲染首字） |

## 类型 {#types}

`UserAvatarProps` / `UserAvatarSlots` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根就是 antd 的 `Avatar`，**无自有样式系统**（无 `hashId`）。根类名 = `prefixCls` + `rootClass` + `attrs.class`；`style` 全形态透传；其余 attrs 落 `Avatar`。
