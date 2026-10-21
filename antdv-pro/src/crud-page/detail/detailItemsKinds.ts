import type {DescriptionsItemType} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {readPath} from '../../_util/crud/readPath'
import {formatValue} from '../registryKinds'
import type {PageFieldsDictionary, PageRegistry} from '../types'
import type {PageDetailEntry, PageDetailItem} from './types'

export interface BuildDetailItemsOptions<TEntity extends object> {
  declared: PageDetailEntry<TEntity>[]
  fields: PageFieldsDictionary<TEntity>
  entity: TEntity
  t: (key: string, named?: Record<string, unknown>) => string
  i18nPrefix: string
  registry: PageRegistry
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

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
