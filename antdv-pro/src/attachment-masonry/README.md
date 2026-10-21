# AttachmentMasonry 附件瀑布流

附件的**瀑布流展示**：图片显示缩略图、其他类型显示占位图标，卡片上带文件名 / 大小 / 时间与多选勾选。

## 何时使用 {#when-to-use}

- "我的资源"这类**只读**附件浏览场景（数据由宿主取好递进来，组件不发请求）。
- 要上传 / 删除等写操作：用 [`AttachmentUpload`](../attachment-upload/README.md)。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {AttachmentMasonry} from '@loncra/antdv-pro'
import type {ObjectItemInfo} from '@loncra/client/resource'

const dataSource = ref<ObjectItemInfo[]>([])
const checkValue = ref<ObjectItemInfo[]>([])
</script>

<template>
  <l-attachment-masonry :data-source="dataSource" v-model:check-value="checkValue" />
</template>
```

## 行为

- **纯受控、只读**：`dataSource` 是普通 prop（组件不改它，也没有 `update:dataSource` 事件），取数、刷新归宿主。
- 勾选：`v-model:check-value`；选中集合是**完整的 `ObjectItemInfo[]`**（不是 id 数组），勾选变化时组件按 id 增删后整体回写。
- 封面：`content-type` 以 `image/` 开头 → `BasicImage`（地址 = `AttachmentService.query(bucket, objectName)`）；否则灰底占位 + 文件图标。
- 文件名取 `X-Amz-Meta-Original-Filename`，没有就退 `objectName`；时间是 `lastModified` 的相对时间（Tooltip 里是完整时间，格式跟随 [`CrudConfigProvider`](../crud-config-provider/README.md) 的 `dateTimeFormat`）。
- `bucket` 缺省 `user.file`。
- 数据为空渲染 `Empty`（根不变，仍是同一个根节点）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| dataSource | 附件列表（纯受控） | `ObjectItemInfo[]` | `[]` |
| checkValue | 选中项（`v-model:check-value`） | `ObjectItemInfo[]` | `[]` |
| bucket | 附件桶（拼封面地址用） | string | `user.file` |
| classes | 区域表，见 [语义化 DOM](#semantic-dom) | `AttachmentMasonryClasses` | - |
| styles | 同上，值为 `CSSProperties` / antd 语义对象 | `AttachmentMasonryStyles` | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| update:checkValue | 勾选变化（`v-model:check-value`） |

## 类型 {#types}

`AttachmentMasonryProps` / `AttachmentMasonryEmits` / `AttachmentMasonryClasses` / `AttachmentMasonryStyles` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是稳定 `div`（空态与列表态同一个根）：类名 = `prefixCls`（缺省 `loncra-attachment-masonry`）+ `hashId` + `cssVarCls` + `rootClass` + `classes.root` + `attrs.class`；`styles.root` 与 `attrs.style` 合并落根；其余 attrs 落根。

| classes / styles 键 | 落点 | 值 |
| --- | --- | --- |
| root | 本控件的稳定根 | `string` / `CSSProperties` |
| cover | 图片封面（`BasicImage`） | `string` / `CSSProperties` |
| placeholder | 非图片的灰底占位 | `string` / `CSSProperties` |
| fileIcon | 占位里的文件图标 | `string` / `CSSProperties` |
| card | 每张附件卡（antd `Card`，原生语义对象原样透传） | `CardProps['classes' / 'styles']` |
| masonry | 瀑布流容器（antd `Masonry`） | `MasonryProps['classes' / 'styles']` |
| empty | 空态（antd `Empty`） | `EmptyProps['classes' / 'styles']` |

无落点清单：`Checkbox` / `Tooltip` / `CardMeta` 没有语义入口（勾选逻辑本身可经 `checkValue` 定制，时间提示文案来自数据）。自有类 `-cover` / `-placeholder` / `-file-icon` 不是宿主入口，宿主定制走对应区域键。
