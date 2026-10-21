export interface OperationTraceEntity {
  id?: unknown
  creationTime?: number
}

export interface OperationTraceTableProps {
  target?: string
  entity?: OperationTraceEntity
}

export interface OperationTraceTableSlots {
  default?: (arg: {entity: unknown}) => unknown
}
