import {createTextVNode, createVNode, Fragment, isVNode, type VNode} from 'vue'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {SearchableColumnType} from '../../query-table/types'
import {componentName, dictOptions, formatValue, resolveFieldSpec} from '../registry'
import type {
  ListPageContext,
  PageDicts,
  PageFieldsDictionary,
  PageListColumn,
  PageListEntry,
  PageRegistry,
} from '../types'

/** 裸 key → 完整列 */
export function toListColumn<TEntity extends object>(
  entry: PageListEntry<TEntity>,
): PageListColumn<TEntity> {
  return typeof entry === 'string' ? {key: entry} : entry
}

/**
 * 列表列声明 → 表格列。列级 `visible` 在这里按 `ctx.variant` 过滤。
 *
 * 产出类型就是 `QueryTable` 的 `SearchableColumnType` —— 声明只是它的一层糖
 * （裸 key、注册表 key、枚举桶喂 options），不再另立一套平行类型。
 *
 * 注意：antdv-next 的 Table **没有** `column.customRender`（写了会被静默忽略），
 * 单元格内容由 `#bodyCell` 插槽调 `renderCell()` 产出。
 */
export function buildListColumns<TEntity extends object>(
  declared: PageListEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  t: (key: string) => string,
  i18nPrefix: string,
  buckets: EnumBucketsResponseBody,
  dicts: PageDicts,
  ctx: ListPageContext,
  registry: PageRegistry,
): SearchableColumnType<TEntity>[] {
  /** 标题优先级：写死的 `title` > 字典 → 翻译器（`t` 里再分 页面声明 / CrudConfig / key 本身） */
  const resolveLabel = (key: string, labelKey?: string, title?: string) =>
    title ?? t(labelKey ?? `${i18nPrefix}.${key}`)
  const columns: SearchableColumnType<TEntity>[] = []

  for (const entry of declared) {
    const item = toListColumn(entry)
    if (item.visible && !item.visible(ctx)) {
      continue
    }
    const merged: PageListColumn<TEntity> = {...fields[item.key], ...item}
    const search = merged.search
    const column = {
      title: resolveLabel(merged.key, merged.labelKey, merged.title),
      dataIndex: merged.key,
      key: merged.key,
      width: merged.width,
      ellipsis: merged.ellipsis ?? true,
    } as SearchableColumnType<TEntity>

    if (search) {
      const spec = resolveFieldSpec(search.component, registry.fieldComponents)
      const enumRef = merged.enumRef
      const dictId = merged.dictId
      if (enumRef && dictId) {
        throw new Error(
          `[crud-page] 字段 ${merged.key} 同时声明了 enumRef 与 dictId：选项来源只能有一个`,
        )
      }
      const options = enumRef ? buckets[enumRef.module]?.[enumRef.id] ?? [] : []
      if (enumRef && !spec?.mapOptions) {
        throw new Error(
          `[crud-page] 字段 ${merged.key} 的搜索项声明了 enumRef，但组件 ${componentName(search.component)} 没有 mapOptions，`
            + 'options 会被丢掉：用 CrudConfig.fieldComponents 给它补 mapOptions，或者去掉 enumRef',
        )
      }
      column.search = {
        // 声明里给的东西（queryName / defaultValue / 以后 pro 新增的字段）原样透传给 QueryTable，
        // 只有下面三个要在这里"解析"：key → 组件、props 函数 → 对象、expression 补默认
        ...search,
        component: spec?.component,
        expression: search.expression ?? 'eq',
        props: {
          // 字典的喂法是字典自己的语义（label=name、value=code），不走组件的 mapOptions
          ...(dictId
            ? dictOptions(dicts[dictId])
            : options.length > 0
              ? spec?.mapOptions?.(options) ?? {}
              : {}),
          // 函数形态在这里求值（本函数跑在 computed 内）：placeholder 这类跟随语言的 props 才刷得动
          ...(typeof search.props === 'function' ? search.props(ctx) : search.props),
        },
      }
    }
    columns.push(column)
  }

  return columns
}

/**
 * 单元格内容：条目里的 `render` 优先，其次按 `format` 格式化。
 *
 * **返回 `undefined` = 不认领这个单元格**，调用方应改用手上的 `text`
 * （表格自己算好的内容：选择列的复选框、行操作列等都是这样过来的，它们是 VNode，
 * 绝不能拿去当文本插值）。
 */
export function renderCell<TEntity extends object>(
  declared: PageListEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  columnKey: unknown,
  record: TEntity,
  buckets: EnumBucketsResponseBody,
  dicts: PageDicts,
  registry: PageRegistry,
): unknown {
  const entry = declared.find(
    (item) => String(typeof item === 'string' ? item : item.key) === String(columnKey),
  )
  if (!entry) {
    return undefined
  }
  const item = toListColumn(entry)
  // 取原始值只信 record：插槽给的 text 可能已经被表格包装过
  const value = (record as Record<string, unknown>)[item.key]
  if (item.render) {
    return item.render(value, record)
  }
  const format = item.format ?? fields[item.key]?.format
  if (!format) {
    return undefined
  }
  return formatValue(
    format,
    value,
    {
      key: item.key,
      record,
      enumRef: item.enumRef ?? fields[item.key]?.enumRef,
      dictId: item.dictId ?? fields[item.key]?.dictId,
      buckets,
      dicts,
    },
    registry.formatters,
  )
}

/**
 * 单元格内容统一收成 VNode：
 * 不认领的列拿到的 `text` 可能是**渲染好的 VNode**（选择列是 Checkbox、内部列自带 render），
 * 所以禁止拿去 `{{ }}` 插值 —— VNode 进 toDisplayString 会 JSON.stringify 到
 * 「component ↔ vnode」环形引用直接报错。
 */
export function toCellVNode(content: unknown): VNode {
  if (isVNode(content)) {
    return content
  }
  if (Array.isArray(content) && content.every((item) => isVNode(item))) {
    return createVNode(Fragment, null, content)
  }
  return createTextVNode(String(content ?? ''))
}
