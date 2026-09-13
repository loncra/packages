export interface KeyValueRow {
  id: string
  key: string
  value: string[] | string
  editing: boolean
  origin?: KeyValueRow
}
