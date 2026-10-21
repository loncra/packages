import {createTextVNode, createVNode, Fragment, isVNode, markRaw, type VNode} from 'vue'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {ColumnSearchConfig, SearchableColumnType} from '../../query-table/types'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {readPath} from '../../_util/crud/readPath'
import {assertMapOptions, assertSingleSource, resolveSourceProps} from '../fieldSourcesKinds'
import {componentName, formatValue, resolveFieldSpec} from '../registryKinds'
import type {PageDeclContext, PageFieldsDictionary, PageRegistry} from '../types'
import type {PageSearchConfig, PageTableColumn, PageTableEntry} from './types'

export function toTableColumn<TEntity extends object>(
  entry: PageTableEntry<TEntity>,
): PageTableColumn<TEntity> {
  return typeof entry === 'string' ? {key: entry} : entry
}

function fieldSpecOf<TEntity>(fields: PageFieldsDictionary<TEntity>, key: string) {
  return fields[key as keyof TEntity & string]
}

function resolveColumnSearch<TEntity extends object>(
  column: PageTableColumn<TEntity>,
  search: PageSearchConfig,
  ctx: PageDeclContext,
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
  registry: PageRegistry,
): ColumnSearchConfig {
  const spec = resolveFieldSpec(search.component, registry.fieldComponents)
  assertSingleSource(column)
  assertMapOptions(column, componentName(search.component), spec)
  const declaredProps = typeof search.props === 'function' ? search.props(ctx) : search.props
  return {
    ...search,
    component: spec?.component ? markRaw(spec.component) : undefined,
    expression: search.expression ?? 'eq',
    props: {...resolveSourceProps(column, spec, buckets, dictionaries), ...declaredProps},
  }
}

export function buildTableColumns<TEntity extends object>(
  declared: PageTableEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  t: (key: string) => string,
  i18nPrefix: string,
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
  ctx: PageDeclContext,
  registry: PageRegistry,
): SearchableColumnType<TEntity>[] {
  const resolveLabel = (key: string, labelKey?: string, title?: string) =>
    title ?? t(labelKey ?? `${i18nPrefix}.${key}`)
  const columns: SearchableColumnType<TEntity>[] = []

  for (const entry of declared) {
    const item = toTableColumn(entry)
    if (item.visible && !item.visible(ctx)) {
      continue
    }
    const merged: PageTableColumn<TEntity> = {...fieldSpecOf(fields, item.key), ...item}
    const column = {
      title: resolveLabel(merged.key, merged.labelKey, merged.title),
      dataIndex: merged.key,
      key: merged.key,
      width: merged.width,
      ellipsis: merged.ellipsis ?? true,
    } as SearchableColumnType<TEntity>
    if (merged.search) {
      column.search = resolveColumnSearch(merged, merged.search, ctx, buckets, dictionaries, registry)
    }
    columns.push(column)
  }

  return columns
}

export function renderCell<TEntity extends object>(
  declared: PageTableEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  columnKey: unknown,
  record: TEntity,
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
  registry: PageRegistry,
): unknown {
  const entry = declared.find(
    (item) => String(typeof item === 'string' ? item : item.key) === String(columnKey),
  )
  if (!entry) {
    return undefined
  }
  const item = toTableColumn(entry)
  const value = readPath(record, item.key)
  if (item.render) {
    return item.render(value, record)
  }
  const format = item.format ?? fieldSpecOf(fields, item.key)?.format
  if (!format) {
    return value
  }
  return formatValue(
    format,
    value,
    {
      key: item.key,
      record,
      enumRef: item.enumRef ?? fieldSpecOf(fields, item.key)?.enumRef,
      dictId: item.dictId ?? fieldSpecOf(fields, item.key)?.dictId,
      buckets,
      dictionaries,
    },
    registry.formatters,
  )
}

export function toCellVNode(content: unknown): VNode {
  if (isVNode(content)) {
    return content
  }
  if (Array.isArray(content) && content.every((item) => isVNode(item))) {
    return createVNode(Fragment, null, content)
  }
  return createTextVNode(String(content ?? ''))
}
