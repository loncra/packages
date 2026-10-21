import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries} from '../basic-crud-query/types'
import {dictOptions} from './registryKinds'
import type {FieldComponentSpec} from './types'

interface FieldSource {
  key: string
  enumRef?: {module: string; id: string}
  dictId?: string
}

export function assertSingleSource(source: FieldSource): void {
  if (source.enumRef && source.dictId) {
    throw new Error(
      `[crud-page] 字段 ${source.key} 同时声明了 enumRef 与 dictId：选项来源只能有一个`,
    )
  }
}

export function assertMapOptions(
  source: FieldSource,
  component: string,
  spec: FieldComponentSpec | undefined,
): void {
  if (source.enumRef && !spec?.mapOptions) {
    throw new Error(
      `[crud-page] 字段 ${source.key} 声明了 enumRef，但组件 ${component} 没有 mapOptions，`
        + 'options 会被丢掉：用 CrudConfig.fieldComponents 给它补 mapOptions，或者去掉 enumRef',
    )
  }
}

export function resolveSourceProps(
  source: FieldSource,
  spec: FieldComponentSpec | undefined,
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
): Record<string, unknown> {
  if (source.dictId) {
    return dictOptions(dictionaries[source.dictId])
  }
  const options = source.enumRef ? buckets[source.enumRef.module]?.[source.enumRef.id] ?? [] : []
  return options.length > 0 ? spec?.mapOptions?.(options) ?? {} : {}
}
