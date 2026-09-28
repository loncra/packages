import {
  computed,
  defineComponent,
  onActivated,
  onMounted,
  type PropType,
  type Ref,
  type SlotsType,
  useModel,
  type VNode,
  type VNodeChild,
} from 'vue'
import {Card, Spin} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {useCrudConfig} from '../crud-config-provider'
import useStyle from './style'
import type {DataLoadingCardPlanSlots, DataLoadingTask} from './types'

/**
 * 加载卡片壳：只做两件事 —— 卡片布局 + 生命周期编排。
 *
 * - 布局：`title` / `#extra` / 默认插槽；`$attrs` 直通 `Card`。
 *   "贴边"（去边框 + 去 body 内边距）不在这里：上层 CRUD 声明 **`plain`**（见 `BasicCrudQuery`），
 *   样式由 pro 的 `genStyleHooks` 出（pro 不带 Tailwind，别在 pro 里写工具类）。
 * - 生命周期：`onMounted` / `onActivated` 两个口，各自 `try/finally` 包同一个 `loading`。
 * 它不认内容：加载什么由消费者通过这两个口交进来。
 */
const DataLoadingCardPlan = defineComponent({
  name: 'LDataLoadingCardPlan',
  inheritAttrs: false,
  props: {
    loading: {type: Boolean, default: false},
    onMounted: Function as PropType<DataLoadingTask>,
    onActivated: Function as PropType<DataLoadingTask>,
    /**
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"会被 Vue 的布尔转换变成
     * `false` ⇒ 被当成"不要卡片头"，`CrudConfig.resolveDefaultTitle` 永远不执行。
     */
    title: {type: [Object, Boolean] as PropType<VNode | boolean>, default: undefined},
    /** 内嵌形态：不渲染卡片壳；也不出 `Spin`、不消费 `title` / `#extra`（见 `types.ts` 的说明） */
    plain: {type: Boolean, default: false},
    /** 内容区是否套 `Spin`（默认 `true`；CRUD 列表传 `false`，内容自带 `loading`） */
    spin: {type: Boolean, default: true},
  },
  emits: {
    'update:loading': (_value: boolean) => true,
  },
  slots: Object as SlotsType<DataLoadingCardPlanSlots>,
  setup(props, {attrs, slots}) {
    const config = useCrudConfig()
    const antdConfig = useConfig()
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const prefixCls = computed(() =>
      antdConfig.value.getPrefixCls(
        'data-loading-card-plan',
        'loncra-data-loading-card-plan',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    let running: Promise<unknown> | undefined
    let activated = false

    /** 两个口共用：`try/finally` 包 loading + in-flight 去重（连点不会叠请求） */
    function run(task?: DataLoadingTask) {
      if (!task || running) {
        return
      }
      loading.value = true
      running = (async () => {
        try {
          await task()
        } finally {
          loading.value = false
          running = undefined
        }
      })()
    }

    onMounted(() => run(props.onMounted))

    onActivated(() => {
      // 首次挂载时 activated 也会触发，那一次交给 onMounted
      if (!activated) {
        activated = true
        return
      }
      run(props.onActivated)
    })

    /** 没给 title 时的默认卡片头：**宿主拼好的 VNode 原样用**（面包屑、图标都是宿主的事） */
    function defaultHeader() {
      return config.value.resolveDefaultTitle?.() ?? null
    }

    return () => {
      // 内嵌形态：不套卡片，只留一个裸容器（`attrs` 照旧落上去）——
      // 标题与工具栏由上层交给内容自己（表格落到 `Table.title`），加载态也归内容。
      if (props.plain) {
        return <div {...(attrs as Record<string, unknown>)}>{slots.default?.()}</div>
      }

      const titleSlot =
        props.title === false
          ? undefined
          : slots.title
            ? () => slots.title?.()
            : () => (props.title == null ? defaultHeader() : (props.title as VNodeChild))

      const content = slots.default?.()

      return (
        <Card
          {...(attrs as Record<string, unknown>)}
          v-slots={{
            title: titleSlot,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            // 加载交互放在 body：卡片头（标题/动作）保持可见，只有内容区转圈
            // （包裹层撑满由本组件的样式负责，见 `-spin`）。
            // `spin: false` = 内容自己管（表格自带 `loading`，再套一层就是两层遮罩）。
            default: () =>
              props.spin ? (
                <Spin
                  class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-spin`)}
                  spinning={loading.value}
                >
                  {content}
                </Spin>
              ) : (
                content
              ),
          }}
        />
      )
    }
  },
})

export default DataLoadingCardPlan
