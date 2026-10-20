import type {CSSProperties} from 'vue'
import type {InputProps, SelectProps, TableProps} from 'antdv-next'

export interface KeyValueRow {
  id: string
  key: string
  value: string[] | string
  editing: boolean
  origin?: KeyValueRow
}

export interface KeyValueTableClasses {
  root?: string
  table?: TableProps['classes']
  title?: string
  keyInput?: InputProps['classes']
  valueInput?: InputProps['classes']
  valueSelect?: SelectProps['classes']
  action?: string
}

export interface KeyValueTableStyles {
  root?: CSSProperties
  table?: TableProps['styles']
  title?: CSSProperties
  keyInput?: InputProps['styles']
  valueInput?: InputProps['styles']
  valueSelect?: SelectProps['styles']
  action?: CSSProperties
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
  classes?: KeyValueTableClasses
  styles?: KeyValueTableStyles
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
