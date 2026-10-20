/** 渲染条件要读的实体字段（后端契约字段） */
export interface OperationTraceEntity {
  id?: unknown
  creationTime?: number
}

export interface OperationTraceTableProps {
  /** 页面声明的 `CrudPageCore.operationDataTraceTarget`（审计表标识） */
  target?: string
  /**
   * 当前实体：从它读 `id` 与 `creationTime`（都是后端契约字段）。
   * **三个值缺一就不渲染**（后端不接受空 target / 空 id）⇒ 宿主用"不给值"来表达"这里不要操作记录"。
   */
  entity?: OperationTraceEntity
}

export interface OperationTraceTableSlots {
  /** 操作记录表**下方**：宿主业务自己的内容（作用域给当前实体） */
  default?: (arg: {entity: unknown}) => unknown
}
