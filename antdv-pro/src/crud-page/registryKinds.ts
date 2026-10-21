import type {Component} from 'vue'
import type {DataDictionaryMetadata} from '@loncra/client/commons'
import type {
    FieldComponentSpec,
    FormatContext,
    PageFieldComponent,
    PageValueFormat,
    PageValueFormatSpec,
    ValueFormatter,
} from './types'

export function resolveFieldSpec(
  name: PageFieldComponent | Component | undefined,
  table: Record<string, FieldComponentSpec>,
): FieldComponentSpec | undefined {
  if (!name) {
    return undefined
  }
  if (typeof name !== 'string') {
    return {component: name}
  }
  const spec = table[name]
  if (!spec) {
    throw new Error(
      `[crud-page] 未注册的字段组件 '${name}'：用 CrudConfig.fieldComponents 注册，或者直接传组件`,
    )
  }
  return spec
}

export function componentName(name?: PageFieldComponent | Component): string {
  if (typeof name === 'string') {
    return name
  }
  return name ? '直接传入的组件' : 'input'
}

export function dictOptions(list: DataDictionaryMetadata[] | undefined): Record<string, unknown> {
  return {options: list ?? [], fieldNames: {label: 'name', value: 'code'}}
}

export function formatValue(
  format: PageValueFormat | PageValueFormatSpec | undefined,
  value: unknown,
  ctx: FormatContext,
  table: Record<string, ValueFormatter>,
): unknown {
  if (!format) {
    return value ?? ''
  }
  const name = typeof format === 'string' ? format : format.name
  const args = typeof format === 'string' ? undefined : format.args
  const formatter = table[name]
  if (!formatter) {
    throw new Error(
      `[crud-page] 字段 ${ctx.key} 声明 format: '${name}'，但没有这个 formatter（在 CrudConfig.formatters 里注册）`,
    )
  }
  return formatter(value, ctx, args)
}
