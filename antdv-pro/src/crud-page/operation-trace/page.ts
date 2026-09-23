import type {AuditEventEntity} from '@loncra/client/auth'
import {OperationDataTraceAuditEventService} from '@loncra/client/auth'
import {getEnumName, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {defineHomePage} from '../define'
import type {PageListEntry} from '../types'

/**
 * 操作记录（审计）**声明**——不手写表格，走列表形态的 DSL（`defineHomePage` + `CrudHomePage`）：
 * 列 / 来源 / 行内动作全用现成的能力表达，pro 这边一行"自造表格"的代码都没有。
 *
 * 两种形态（同一个声明）：
 * - **整页**：不给 `variant`（`audit-event` 的整页审计列表）；
 * - **嵌入**：`variant = OPERATION_TRACE_VARIANT`（表单 / 详情里那块操作记录，由 `OperationTrace` 渲染），
 *   它隐藏三列（旧 `OperationDataTraceTable` 的 `detailView` 过滤：审计类型 / 审计目标 / 关联业务 id）。
 *
 * ⚠️ **本模块必须保持"纯数据"**（只允许常量 / 类型 / 工厂函数，**不许模块级 `new` 服务**）：
 * 它在 pro barrel 的路径上（`App.vue` `import {Provider}` 就会把整棵图求值一遍），而服务类
 * **在构造期**就会取 `BASE_URL` → `getClient()` ⇒ 那时 `LClientProvider` 还没 setup，直接抛。
 * 本仓既成的规矩同理：**带服务构造的模块不许进 eager 图**（对照宿主 `src/routers/index.ts:77`
 * 那条"必须懒加载"的注释）。
 */
export const OPERATION_TRACE_VARIANT = 'embedded'

/** 审计行的业务字段（后端契约：业务上下文挂在 `data` 上，列 key 写的是**路径**） */
interface AuditEventRow {
  data?: {
    metadata?: {name?: string}
    details?: {metadata?: {realName?: string}}
    operationTrace?: {id?: number; target?: string; remark?: string; type?: {name?: string}}
  }
  principal?: string
}

/** 取业务字段：`AuditEventEntity` 上没声明 `data` 的形状，这里按后端契约窄化一次 */
const row = (record: AuditEventEntity) => record as unknown as AuditEventRow

/** 嵌入态要隐藏的列（旧表按 `detailView` 过滤的正是这三列） */
const onlyFullPage = ({variant}: {variant?: string}) => variant !== OPERATION_TRACE_VARIANT

/**
 * ⚠️ 列 key 与查询名是**从旧 `OperationDataTraceTable.vue` 逐条抄过来的**（含那条复合查询名），
 * 这里不做"重新设计"：它对着的是后端审计接口的字段契约，改动要跟后端一起动。
 * 显示侧的差异（旧表用 `#bodyCell` 拿别的字段）在这里用 `render` 表达，一一对应。
 */
const columns: PageListEntry<AuditEventEntity>[] = [
  {
    key: 'data.operationDataTrace.controllerAuditType',
    labelKey: 'operationTrace.auditType',
    width: 200,
    visible: onlyFullPage,
    search: {component: 'input', expression: 'eq'},
    render: (_value, record) => row(record).data?.metadata?.name,
  },
  {
    key: 'data.operationTrace.target',
    labelKey: 'operationTrace.target',
    width: 150,
    visible: onlyFullPage,
    search: {component: 'input', expression: 'eq'},
  },
  {
    key: 'timestamp',
    labelKey: 'operationTrace.time',
    width: 210,
    // 旧表也是拿 `record.timestamp` 去格式化（列 key 与显示字段不同名），这里等价表达
    format: 'dateTime',
    search: {component: 'date', queryName: 'after'},
  },
  {
    key: 'principal',
    labelKey: 'operationTrace.principal',
    width: 150,
    search: {
      component: 'input',
      queryName: 'filter_[principal_eq]_or_[data.details.metadata.realName_eq]',
    },
    render: (_value, record) => row(record).data?.details?.metadata?.realName || row(record).principal,
  },
  {
    key: 'data.operationTrace.type.value',
    labelKey: 'operationTrace.type',
    width: 100,
    // 来源写在字段条目上：搜索下拉的 options 由它推导（旧表是手动 applyColumnOptions）
    enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.OPERATION_DATA_TYPE_ENUM},
    search: {component: 'select', expression: 'eq'},
    render: (_value, record) => getEnumName(row(record).data?.operationTrace?.type),
  },
  {
    key: 'data.operationTrace.id',
    labelKey: 'operationTrace.traceId',
    width: 150,
    visible: onlyFullPage,
    search: {component: 'number', expression: 'eq'},
  },
  {
    key: 'data.operationTrace.remark',
    labelKey: 'operationTrace.remark',
    width: 400,
  },
]

/**
 * 操作记录声明（只读表）：`recordActions: false` = 不要行内动作、也不补"操作"列；
 * `toolbarActions: false` = 连默认的"新增 / 删除选中"都不要（审计没有增删）。
 */
export function createOperationTracePage(
  service = new OperationDataTraceAuditEventService(),
) {
  return defineHomePage<AuditEventEntity>(
    {
      service,
      /** 列都自带 `labelKey`，这里只是兜底前缀（`${i18nPrefix}.${key}`） */
      i18nPrefix: 'operationTrace',
    },
    {
      enums: [
        {
          module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
          ids: [SYSTEM_ENUM_TYPE.OPERATION_DATA_TYPE_ENUM],
        },
      ],
      columns,
      recordActions: false,
      toolbarActions: false,
    },
  )
}
