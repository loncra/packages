import {computed, defineComponent, type PropType, type SlotsType} from 'vue'
import {Divider, Space, theme} from 'antdv-next'
import {HistoryOutlined} from '@antdv-next/icons'
import {useLocale} from '../../_util/useLocale'
import {CrudHomePage} from '../home'
import {OPERATION_TRACE_VARIANT, operationTracePage} from './page'

export interface OperationTraceProps {
  /** 页面声明的 `CrudPageCore.operationDataTraceTarget`（审计表标识） */
  target?: string
  /**
   * 当前实体：从它读 `id` 与 `creationTime`（都是后端契约字段）。
   * **三个值缺一就不渲染**（后端不接受空 target / 空 id）⇒ 宿主用"不给值"来表达"这里不要操作记录"。
   */
  entity?: {id?: unknown; creationTime?: number}
}

export interface OperationTraceSlots {
  /** 操作记录表**下方**：宿主业务自己的内容（作用域给当前实体） */
  default?: (arg: {entity: unknown}) => unknown
}

/**
 * 操作记录（审计）块：标题 + 表格 + 下方插槽。
 *
 * - **表格本身走列表形态的 DSL**（`operationTracePage`，见 `./page.ts`）——不手写表格；
 * - **渲染条件是"值齐"**：`target` + 实体的 `id` + 实体的 `creationTime` 三者都有才渲染
 *   （与旧 `BasicDetail` 的口径一致，顺带把旧表单壳"target 空也渲染"的漏洞收掉）；
 * - 宿主想隐藏就**不给值**（页面声明不写 `operationDataTraceTarget`、实体没有 id / creationTime）；
 * - 跳转 / 权限这类宿主环境**不在这里**：整页形态要用到时走 `CrudConfig.onNavigate` / `hasPermission`。
 */
const OperationTrace = defineComponent({
  name: 'LOperationTrace',
  props: {
    target: String,
    entity: {type: Object as PropType<OperationTraceProps['entity']>, default: undefined},
  },
  slots: Object as SlotsType<OperationTraceSlots>,
  setup(props, {slots}) {
    const locale = useLocale('Crud')
    const {token} = theme.useToken()

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
     * 声明是静态对象（拿不到 pro 的 locale），所以在这里把 `i18nResolver` 补进去 ——
     * 与宿主声明的 `i18nResolver` 是同一个口，机制一致。
     */
    const page = computed(() => ({...operationTracePage, i18nResolver: label}))

    /** 值不齐就不渲染（整块，含分隔线与标题） */
    const visible = computed(
      () =>
        !!props.target
        && props.entity?.id != null
        && props.entity?.creationTime != null,
    )

    /** 审计查询：目标 + 关联业务 id + 该记录创建之后的时间 */
    const query = computed(() => ({
      after: props.entity?.creationTime,
      'filter_[data.operationTrace.target_eq]': props.target,
      'filter_[data.operationTrace.id_eq]': props.entity?.id,
    }))

    return () => {
      if (!visible.value) {
        return null
      }
      return (
        <div style={{marginBottom: `${token.value.marginMD}px`}}>
          <Divider titlePlacement="start" plain>
            <Space>
              <HistoryOutlined />
              <span>{label('operationTrace.title')}</span>
            </Space>
          </Divider>
          <CrudHomePage
            page={page.value}
            query={query.value}
            variant={OPERATION_TRACE_VARIANT}
            title={false}
          />
          {slots.default?.({entity: props.entity})}
        </div>
      )
    }
  },
})

export default OperationTrace
