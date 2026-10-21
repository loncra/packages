import type {SearchableColumnType} from './types'

export function toTableFieldName(key: string): string {
  const [head = '', ...rest] = key.split('.')
  return [head.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(), ...rest].join('.')
}

export function buildSearchQueryName(column: SearchableColumnType): string {
  return `filter_[${toTableFieldName(String(column.key))}_${column.search?.expression || 'eq'}]`
}
