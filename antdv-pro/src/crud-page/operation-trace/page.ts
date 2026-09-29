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
 *
 * ⚠️ **`labelKey` 用本包自己的语言包**：`Crud.operationTrace.*`（见 `src/locale/{zh_CN,en_US}.ts`）✓
 * —— 早先写成 `operationTrace.xxx`（少了 `Crud.` 前缀 ✗）⇒ 表头直接显示 key 原文 ✗
 * （2026-09-29 用户截图报）。
 * 这些文案**就是**从宿主旧 key（`operation.*` / `authServer.auditEvent.*` / `common.remark`）搬过来的
 * （本包 locale 里那条注释写着"与宿主旧文案逐条一致"✓），宿主那几份**已删** ✓。
 * ⚠️ 前提：宿主把本包语言包并进了 vue-i18n（`vue-basic-admin/src/i18n/index.ts` ✓）——
 * 声明层的 `labelKey` 走的是**宿主的 `i18nResolver`**（`i18n.global.t`），并进来才查得到 ✓。
 */
const columns: PageListEntry<AuditEventEntity>[] = [
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
    // 旧表也是拿 `record.timestamp` 去格式化（列 key 与显示字段不同名），这里等价表达
    format: 'dateTime',
    /**
     * ⚠️ `after` **不能为空**（后端会报错 / 查不出来）⇒ 不给清空图标。
     * 默认值（"当天 0 点之后"）**不写在这里**：那是**整页形态**的行为，
     * 嵌入态（表单 / 详情里那块操作记录）没有它 ⇒ 由工厂的 `options.afterDefault` 注入（见下）。
     * （宽度这类**外观**类由宿主给 —— pro 不带 Tailwind，见 `registry.ts` 里同名约定）
     */
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
    // 来源写在字段条目上：搜索下拉的 options 由它推导（旧表是手动 applyColumnOptions）
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

/**
 * 把 `after` 的默认值送进 `timestamp` 列的搜索项（**只有整页形态才给**）。
 *
 * 为什么不直接写进共享的 `columns`：嵌入态（表单 / 详情里那块操作记录）**不应该**跟着变 ——
 * 一写就会让它们也只查当天 ✗（旧表只在整页列表上给了这个默认）。
 */
function columnsWithAfterDefault(after: string | number): PageListEntry<AuditEventEntity>[] {
  return columns.map((column) => {
    // `PageListEntry` 是联合类型（裸 key 字符串也在其中）⇒ 先窄化
    if (typeof column === 'string' || column.key !== 'timestamp') {
      return column
    }
    // `PageSearchConfig.component` 是必填 ⇒ 兜底也得给一个（正常路径下这一列本来就有 `search`）
    const search = column.search ?? {component: 'date' as const, queryName: 'after'}
    return {
      ...column,
      search: {...search, defaultValue: after},
    }
  })
}

/**
 * 操作记录声明（只读表）：`recordActions: false` = 不要行内动作、也不补"操作"列；
 * `toolbarActions: false` = 连默认的"新增 / 删除选中"都不要（审计没有增删）。
 *
 * @param options `service` 一般不用给（默认 new 一个）；`afterDefault` = 整页形态"当天 0 点之后"
 *   那个默认值 —— **声明层**给，别让宿主壳再去 `:query` 里塞。
 *   ⚠️ 它会被**原样**塞进查询（`QueryTable` 的 `defaultValue` 就是这个语义）⇒ 给**要发出去的值**：
 *   宿主的 `postTimestampFormat(dayjs().startOf('d'))`（字符串），**不是** Dayjs 对象 ✗。
 */
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
      columns: afterDefault == null ? columns : columnsWithAfterDefault(afterDefault),
      recordActions: false,
      toolbarActions: false,
    },
  )
}
