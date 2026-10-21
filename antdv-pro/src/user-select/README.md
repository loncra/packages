# UserSelect 用户选择器

按用户搜索的多选选择器：远程搜索（姓名 / 手机 / 邮箱 / id 联合过滤）+ "全部 {来源类型}"分组项 + **已选分组自动隐藏候选**。

## 何时使用 {#when-to-use}

- 选人（多选为主，`mode` 可切 `tags`）。
- 候选来自系统用户表 + 来源类型枚举（`RESOURCE_SOURCE_ENUM`），声明里写不了候选 ⇒ 用本组件。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'

const userIds = ref<string[]>([])
</script>

<template>
  <l-user-select v-model:value="userIds" />
</template>
```

带搜索条件与自定义候选行：

```vue
<template>
  <l-user-select
    v-model:value="userIds"
    :query="{ 'filter_[enabled_eq]': '1' }"
    :ignore-types="['system']"
  >
    <template #optionRender="{option}">
      {{ option.label }}
    </template>
  </l-user-select>
</template>
```

## 行为

- **值是纯受控**：本层不持值，必须绑 `v-model:value`（或自己接 `@update:value`）。
- **挂载**拉 `RESOURCE_SOURCE_ENUM` 枚举桶（走 pro 统一入口 `fetchEnumBuckets`），生成"全部 {类型}"分组项。
- **搜索**：输入非空时调 `AuthServerService.systemUsers`，过滤条件是 `real_name / phone_number / email / id` 联合 like/eq，每页 10 条；结果按来源类型分组（`IdNameValueMetadata`），每组 label 是组名、子项是用户。
- **已选分组隐藏**：选中某个"全部 {类型}"分组项后，该类型的用户从候选里隐藏（内部维护 `ignoreTypes`）；反选（deselect）恢复。初始隐藏清单由 `ignoreTypes` 给。
- `change` 事件的 `value` 在多选下是**数组**。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 选中值（**纯受控**） | `string \| string[]` | `[]` |
| ignoreTypes | 初始隐藏的来源类型 | `string[]` | - |
| query | 追加到搜索请求的查询参数 | `Record<string, string>` | - |
| mode | antd Select 的模式 | `'multiple' \| 'tags'` | `multiple` |
| valueField | 取用户哪个字段做值 | `keyof PlatformUser` | - |
| compactButton | 紧凑按钮形态 | boolean | `true` |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - |

其余属性（`placeholder` / `disabled` 等）经 attrs 透传给 antd 的 `Select`。

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| update:value | 值回写（`v-model:value`） |
| change | antd 的 change 透传（`value` 多选下是数组） |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| optionRender | 候选行（缺省渲染"人名（label）"） |
| popupRender | 下拉面板 |
| labelRender / tagRender | 选中标签 / tag，直通 antd Select |

## 类型 {#types}

`UserSelectProps` / `UserSelectEmits` / `UserSelectSlots` / `UserSelectOption` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根就是 antd 的 `Select`。根类名 = `prefixCls` + `hashId` + `cssVarCls` + `rootClass` + `attrs.class`；`width: 100%` 在自有样式的 `root` 规则里（本目录 `style/`），宿主自己的 `style` 原样透传（内联优先于类，可覆盖宽度）；其余 attrs 落 `Select`。
