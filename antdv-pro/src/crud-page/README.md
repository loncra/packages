# `crud-page` 声明式页面套件

**存在的意义**：把「一个 CRUD 页面要接的线」收进一份 `*.page.ts` 声明（service / 字段字典 / 列 / 表单字段 / 权限 / 来源），再由四个页面壳把它翻译成 pro 既有控件的 props —— 宿主不再逐页手写取数时机、来源加载、动作解析与跳转。

## 组成

| 目录 | 内容 | 说明 |
| --- | --- | --- |
| `home/` | `CrudHomePage` | 表格形态页面壳，内部是 `CrudTable` |
| `card-grid/` | `CrudCardGridPage` | 卡片形态页面壳，内部是 `CrudCardGrid` |
| `form/` | `CrudFormPage` | 表单页壳（新增 / 编辑），内部是 `DataLoadingCard` + `Form` |
| `form-modal/` | `CrudFormModal` | 弹层壳：包住 `CrudFormPage`，补 `open` / 标题 / 宽度与按钮位置 |
| `detail/` | `CrudDetailPage` | 详情页壳（descriptions 形态） |
| `operation-trace/` | `OperationTraceTable` / `createOperationTracePage` | 操作记录表（详情 / 表单页内嵌；也可 `createOperationTracePage` 独立成页） |
| `define.ts` | `defineHomePage` / `defineFormPage` / `defineDetailPage` / `defineCardGridPage` | 声明入口：`core`（service / 字段字典 / 路由）+ 形态块 |
| `registryKinds.ts` / `usePageRegistry.ts` | 字段组件表 / 值格式表 | 内置 + 宿主 `CrudConfig` 逐 key 覆盖 |
| `fieldSourcesKinds.ts` | 枚举 / 字典来源 → 组件 props | 列表与表单共用的同一段解析 |
| `sourceLoadsKinds.ts` | 来源**加载清单**推导与合并（`collectTableSources` / `collectFormSources` / `mergeSources`） | 列表只收带搜索项的列，表单收全部字段 |
| `types/`（`types.ts` + `pageTypes.ts`） | 声明模型 + 页面壳组件契约 | `types.ts` 是声明模型，`pageTypes.ts` 是五个壳的 Props / Expose / Slots / Constructor |

## 数据链（以表格为例）

```
xxx.page.ts（defineHomePage）
  → CrudHomePage（翻译声明 → CrudTable 的 props；来源按列推导并统一加载）
    → CrudTable → QueryTable → BasicCrudQuery
```

表单：`defineFormPage` → `CrudFormPage`（`useCrudFormPage` 持有数据链：来源加载、取数回填、提交、陈旧检查）→ `DataLoadingCard` + `Form`。

## 边界

- **pro 不替业务做事**：路由跳转（`page.onNavigate` / `CrudConfig.onNavigate`）、i18n（`page.i18nResolver`）、落库（卡片 `onDrop`）、提交成功后的收尾（`@success`）都归宿主。
- **声明是唯一入口**：`enums` / `dictionaryCodes` 不用抄一份 —— 来源清单按字段 / 列上的 `enumRef` / `dictId` 推导（`collectTableSources` / `collectFormSources`），显式声明的与推导的合并。
- 各页面壳的 props / 事件 / 插槽 / expose 见各子目录的 README。
