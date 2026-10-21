import type {AuditEventEntity} from '@loncra/client/auth'
import {OperationDataTraceAuditEventService} from '@loncra/client/auth'
import {getEnumName, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {defineHomePage} from '../define'
import type {PageTableEntry} from '../home/types'

export const OPERATION_TRACE_VARIANT = 'embedded'

interface AuditEventRow {
  data?: {
    metadata?: {name?: string}
    details?: {metadata?: {realName?: string}}
    operationTrace?: {id?: number; target?: string; remark?: string; type?: {name?: string}}
  }
  principal?: string
}

const row = (record: AuditEventEntity) => record as unknown as AuditEventRow

const onlyFullPage = ({variant}: {variant?: string}) => variant !== OPERATION_TRACE_VARIANT

const columns: PageTableEntry<AuditEventEntity>[] = [
  {
    key: 'data.operationDataTrace.controllerAuditType',
    labelKey: 'Crud.operationTrace.auditType',
    width: 200,
    visible: onlyFullPage,
    search: {component: 'input', expression: 'eq'},
    render: (_value, record) => row(record).data?.metadata?.name,
  },
  {
    key: 'data.operationTrace.target',
    labelKey: 'Crud.operationTrace.target',
    width: 150,
    visible: onlyFullPage,
    search: {component: 'input', expression: 'eq'},
  },
  {
    key: 'timestamp',
    labelKey: 'Crud.operationTrace.time',
    width: 210,
    format: 'dateTime',
    search: {
      component: 'date',
      queryName: 'after',
      props: {allowClear: false, showTime: true},
    },
  },
  {
    key: 'principal',
    labelKey: 'Crud.operationTrace.principal',
    width: 150,
    search: {
      component: 'input',
      queryName: 'filter_[principal_eq]_or_[data.details.metadata.realName_eq]',
    },
    render: (_value, record) => row(record).data?.details?.metadata?.realName || row(record).principal,
  },
  {
    key: 'data.operationTrace.type.value',
    labelKey: 'Crud.operationTrace.type',
    width: 100,
    enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.OPERATION_DATA_TYPE_ENUM},
    search: {component: 'select', expression: 'eq'},
    render: (_value, record) => getEnumName(row(record).data?.operationTrace?.type),
  },
  {
    key: 'data.operationTrace.id',
    labelKey: 'Crud.operationTrace.traceId',
    width: 150,
    visible: onlyFullPage,
    search: {component: 'number', expression: 'eq'},
  },
  {
    key: 'data.operationTrace.remark',
    labelKey: 'Crud.operationTrace.remark',
    width: 400,
  },
]

function columnsWithAfterDefault(after: string | number): PageTableEntry<AuditEventEntity>[] {
  return columns.map((column) => {
    if (typeof column === 'string' || column.key !== 'timestamp') {
      return column
    }
    const search = column.search ?? {component: 'date' as const, queryName: 'after'}
    return {
      ...column,
      search: {...search, defaultValue: after},
    }
  })
}

export function createOperationTracePage(
  options: {
    service?: OperationDataTraceAuditEventService
    afterDefault?: string | number
  } = {},
) {
  const {service = new OperationDataTraceAuditEventService(), afterDefault} = options
  return defineHomePage<AuditEventEntity>(
    {
      service,
      i18nPrefix: 'operationTrace',
    },
    {
      enums: [
        {
          module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
          ids: [SYSTEM_ENUM_TYPE.OPERATION_DATA_TYPE_ENUM],
        },
      ],
      columns: afterDefault == null ? columns : columnsWithAfterDefault(afterDefault),
      recordActions: false,
      toolbarActions: false,
    },
  )
}
