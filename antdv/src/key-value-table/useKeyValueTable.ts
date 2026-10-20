import {type Ref, useModel} from 'vue'
import {cancelEditing, confirmEditing, createRow, excludeRow, startEditing,} from './keyValueTableKinds'
import type {KeyValueRow} from './types'

interface KeyValueTableSource {
  value: KeyValueRow[]
  multipleValue?: boolean
}

type KeyValueTableChange = (item: KeyValueRow, data: KeyValueRow[]) => void

export function useKeyValueTable(props: KeyValueTableSource, onChange: KeyValueTableChange) {
  const rows = useModel(props, 'value') as unknown as Ref<KeyValueRow[]>

  function addRow() {
    rows.value = [...rows.value, createRow(crypto.randomUUID(), props.multipleValue ? [] : '')]
  }

  function removeRow(record: KeyValueRow) {
    rows.value = excludeRow(rows.value, record.id)
    onChange(record, rows.value)
  }

  function confirmRow(record: KeyValueRow) {
    confirmEditing(record)
    onChange(record, rows.value)
  }

  function cancelRow(record: KeyValueRow) {
    cancelEditing(record)
    onChange(record, rows.value)
  }

  function confirmAllEditingRows() {
    for (const row of rows.value) {
      if (row.editing) {
        confirmRow(row)
      }
    }
  }

  return {
    rows,
    addRow,
    removeRow,
    startEditing,
    confirmRow,
    cancelRow,
    confirmAllEditingRows,
  }
}
