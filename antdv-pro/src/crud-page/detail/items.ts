import type {DescriptionsItemType} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {readPath} from '../../_util/crud/readPath'
import {formatValue} from '../registry'
import type {PageDetailEntry, PageDetailItem, PageFieldsDictionary, PageRegistry} from '../types'

export interface BuildDetailItemsOptions<TEntity extends object> {
  declared: PageDetailEntry<TEntity>[]
  /** 字段字典：**只取 `labelKey` / `format`**（详情项没有来源 —— 见 `PageDetailItem` 的分层） */
  fields: PageFieldsDictionary<TEntity>
  entity: TEntity
  /** label 解析：页面声明的 `i18nResolver` > `CrudConfig.i18nResolver` > key 本身 */
  t: (key: string, named?: Record<string, unknown>) => string
  i18nPrefix: string
  registry: PageRegistry
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

/**
 * 详情项声明 → `a-descriptions` 的 items。
 *
 * 注意：
 * - 取值走 `readPath`：`key` 允许写 `a.b` **嵌套路径**（数据不在顶层字段时用，如
 *   `initialization.randomPassword`）。字典仍按**字段名字段名**索引 ⇒ 嵌套项自己写 `labelKey`，
 *   否则回退标签会是"前缀.路径"（没意义）；
 * - 内容字段叫 **`content`**（antdv-next 的 `DescriptionsItemType`，不是 antd React 那套 `children`）；
 * - 详情**不吃来源**：`format: 'enum'` 直接靠值自带的 `{name, value}` 显示，不拉桶、不喂 options
 *   （写 `enumRef` / `dictId` 在类型层就报错）。
 */
export function buildDetailItems<TEntity extends object>(
  options: BuildDetailItemsOptions<TEntity>,
): DescriptionsItemType[] {
  const {declared, fields, entity, t, i18nPrefix, registry, buckets, dictionaries} = options

  return declared.map((entry) => {
    const item: PageDetailItem<TEntity> = typeof entry === 'string' ? {key: entry} : entry
    const spec = fields[item.key as keyof TEntity & string]
    const value = readPath(entity, item.key)
    const content = (
      item.render
        ? item.render(value, entity)
        : formatValue(
            item.format ?? spec?.format,
            value,
            {key: item.key, record: entity, buckets, dictionaries},
            registry.formatters,
          )
    ) as DescriptionsItemType['content']
    return {
      key: item.key,
      label: t(item.labelKey ?? spec?.labelKey ?? `${i18nPrefix}.${item.key}`),
      span: item.span,
      content,
    }
  })
}
