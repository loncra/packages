import {computed, defineComponent, type PropType, type SlotsType} from 'vue'
import {useLocale} from '../../_util/useLocale'
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
 * - **表格本身走列表形态的 DSL**（`createOperationTracePage()`，见 `./page.ts`）——不手写表格；
 * - **嵌入态用 `plain`**：审计表永远是嵌在别的页面里的，卡片边框与 body 内边距都不要
 *   （等价宿主以前复制的 `{root:'border-none', body:'p-0!'}`）；
 * - 声明是静态对象（拿不到 pro 的 locale），所以在这里把 `i18nResolver` 补进去 —— 与宿主声明的口一致；
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
    const locale = useLocale('Crud')

    /** 相对 `Crud` 命名空间的 key → 文案（声明里写的就是 `operationTrace.xxx`） */
    function label(key: string): string {
      const found = key
        .split('.')
        .reduce<unknown>(
          (acc, part) => (acc == null ? undefined : (acc as Record<string, unknown>)[part]),
          locale.value,
        )
      return typeof found === 'string' ? found : key
    }

    /**
     * 声明在这里**实例化**（不是在模块级）：`setup` 在挂载时执行，那时 client 早建好了
     * —— 服务类构造期会取 `BASE_URL`，所以只能"用到时才 new"（见 `createOperationTracePage`）。
     */
    const basePage = createOperationTracePage()

    /** 静态声明补上 `i18nResolver`（与宿主声明的 `i18nResolver` 是同一个口，机制一致） */
    const page = computed(() => ({...basePage, i18nResolver: label}))

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
            page={page.value}
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
