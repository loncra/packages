export interface KeyValueRow {
  id: string
  key: string
  value: string[] | string
  editing: boolean
  origin?: KeyValueRow
}

export interface KeyValueTableProps {
  value?: KeyValueRow[]
  formItemNamePrefix?: string[]
  title?: string
  multipleValue?: boolean
  edit?: boolean
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface KeyValueTableEmits {
  'update:value': (value: KeyValueRow[]) => void
  change: (item: KeyValueRow, data: KeyValueRow[]) => void
}

export interface KeyValueTableSlots {
  title?: (ctx: { title?: string }) => unknown
}

export interface KeyValueTableExpose {
  confirmAllEditingRows: () => void
}
