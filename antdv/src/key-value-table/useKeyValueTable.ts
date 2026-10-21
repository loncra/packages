import {type Ref} from 'vue'
import {type ModelEmit, useTwoWayModel} from '../_util/useTwoWayModel'
import {cancelEditing, confirmEditing, createRow, excludeRow, startEditing,} from './keyValueTableKinds'
import type {KeyValueRow} from './types'

interface KeyValueTableSource {
  value: KeyValueRow[]
  multipleValue?: boolean
}

export function useKeyValueTable(props: KeyValueTableSource, emit: ModelEmit) {
  const rows = useTwoWayModel(props, 'value', emit) as unknown as Ref<KeyValueRow[]>

  function addRow() {
    rows.value = [...rows.value, createRow(crypto.randomUUID(), props.multipleValue ? [] : '')]
  }

  function removeRow(record: KeyValueRow) {
    rows.value = excludeRow(rows.value, record.id)
    emit('change', record, rows.value)
  }

  function confirmRow(record: KeyValueRow) {
    confirmEditing(record)
    emit('change', record, rows.value)
  }

  function cancelRow(record: KeyValueRow) {
    cancelEditing(record)
    emit('change', record, rows.value)
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
