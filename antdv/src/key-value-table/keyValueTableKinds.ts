import type {KeyValueRow} from './types'

export function createRow(id: string, value: string | string[] = ''): KeyValueRow {
  return {id, key: '', value, editing: true}
}

export function excludeRow(rows: KeyValueRow[], id: string) {
  return rows.filter((row) => row.id !== id)
}

export function startEditing(record: KeyValueRow) {
  record.editing = true
  record.origin = {...record}
}

export function confirmEditing(record: KeyValueRow) {
  record.editing = false
  delete record.origin
}

export function cancelEditing(record: KeyValueRow) {
  if (record.origin) {
    record.key = record.origin.key
    record.value = record.origin.value
    delete record.origin
  }
  record.editing = false
}
