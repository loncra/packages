import type {TableColumnType} from 'antdv-next'
import type {KeyValueRow} from './types'

export const KEY_COLUMN_WIDTH = 120

export const ACTION_COLUMN_WIDTH = 100

export const TABLE_SCROLL_Y = 275

export const KEY_VALUE_COLUMNS = {
  key: {
    dataIndex: 'key',
    key: 'key',
    width: KEY_COLUMN_WIDTH,
  },
  value: {
    dataIndex: 'value',
    key: 'value',
  },
  action: {
    dataIndex: 'action',
    key: 'action',
    align: 'center',
    fixed: 'right',
    width: ACTION_COLUMN_WIDTH,
  },
} satisfies Record<string, TableColumnType<KeyValueRow>>
