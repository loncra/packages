import {computed, defineComponent, type PropType, type SlotsType} from 'vue'
import {CrudHomePage} from '../home'
import {createOperationTracePage, OPERATION_TRACE_VARIANT} from './page'

/** 渲染条件要读的实体字段（后端契约字段） */
export interface OperationTraceEntity {
  id?: unknown
  creationTime?: number
}

/**
 * **渲染条件（唯一判定）**：`target` + 实体 `id` + 实体 `creationTime` 三者齐才渲染。
 *
 * 用它的地方有两类，**都必须用这一个函数**，别再各写一遍条件：
 * 1. 本表格内部（不齐就整块不渲染）；
 * 2. 页面自己加的那条「操作记录」分割线（值不齐时分割线也不该出现）。
 */
export function isOperationTraceVisible(target?: string, entity?: OperationTraceEntity): boolean {
  return !!target && entity?.id != null && entity?.creationTime != null
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

/**
 * 操作记录（审计）**表格**——只出表格。
 *
 * - **不含标题 / 分割线**（2026-09-23 拆出来）：分割线是页面层的排版，由用它的页面自己加 ——
 *   表单 / 详情壳里是那条「操作记录」分割线；`OperationDataTraceHome.vue` 这类只想要表格的场景，
 *   引进来就不会被强行带上一块标题；
 * - **表格本身走表格形态的 DSL**（`createOperationTracePage()`，见 `./page.ts`）——不手写表格；
 * - **嵌入态用 `plain`**：审计表永远是嵌在别的页面里的，卡片边框与 body 内边距都不要
 *   （等价宿主以前复制的 `{root:'border-none', body:'p-0!'}`）；
 * - **文案在这里不做任何接管**：声明里的 `labelKey` 是**全 key**（`Crud.operationTrace.*`），走的是
 *   标准那条链（页面声明 > `CrudConfig.i18nResolver` = 宿主的 `i18n.global.t`；宿主已把本包语言包
 *   并进 vue-i18n ⇒ 查得到 ✓）。
 *   ⚠️ 早先这里自造过一个"相对 `Crud` 命名空间"的 resolver（拿 `useLocale('Crud')` 的段对象按
 *   `operationTrace.xxx` 取）⇒ 声明给的是**全 key** ⇒ 必然落空 ⇒ **详情 / 表单里的表头显示 key 原文**
 *   （2026-09-29 用户截图报；整页那份走宿主 resolver，所以它没事）。**两套解析就是这个 bug 的根源，
 *   别再往回加**；
 * - 跳转 / 权限这类宿主环境**不在这里**：整页形态要用到时走 `CrudConfig.onNavigate` / `hasPermission`。
 */
const OperationTraceTable = defineComponent({
  name: 'LOperationTraceTable',
  props: {
    target: String,
    entity: {type: Object as PropType<OperationTraceTableProps['entity']>, default: undefined},
  },
  slots: Object as SlotsType<OperationTraceTableSlots>,
  setup(props, {slots}) {
    /**
     * 声明在这里**实例化**（不是在模块级）：`setup` 在挂载时执行，那时 client 早建好了
     * —— 服务类构造期会取 `BASE_URL`，所以只能"用到时才 new"（见 `createOperationTracePage`）。
     * 每挂一个本组件**只建一次**（原先用 `computed` 是为了往上叠 `i18nResolver`，现在不叠了）。
     */
    const page = createOperationTracePage()

    /** 审计查询：目标 + 关联业务 id + 该记录创建之后的时间 */
    const query = computed(() => ({
      after: props.entity?.creationTime,
      'filter_[data.operationTrace.target_eq]': props.target,
      'filter_[data.operationTrace.id_eq]': props.entity?.id,
    }))

    return () => {
      if (!isOperationTraceVisible(props.target, props.entity)) {
        return null
      }
      return (
        <>
          <CrudHomePage
            plain
            page={page}
            query={query.value}
            variant={OPERATION_TRACE_VARIANT}
            title={false}
          />
          {slots.default?.({entity: props.entity})}
        </>
      )
    }
  },
})

export default OperationTraceTable
