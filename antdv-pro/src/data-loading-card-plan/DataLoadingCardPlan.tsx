import {
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
import {Card, Space, Spin} from 'antdv-next'
import {renderIconFont} from '@loncra/antdv'
import {useCrudConfig} from '../crud-config-provider'
import type {DataLoadingCardPlanSlots, DataLoadingTask} from './types'

/**
 * 加载卡片壳：只做两件事 —— 卡片布局 + 生命周期编排。
 *
 * - 布局：`title` / `#extra` / 默认插槽；`$attrs` 直通 `Card`（贴边就写 `:classes="{body:'p-0!'}"`）。
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
    title: [Object, Boolean] as PropType<VNode | boolean>,
  },
  emits: {
    'update:loading': (_value: boolean) => true,
  },
  slots: Object as SlotsType<DataLoadingCardPlanSlots>,
  setup(props, {attrs, slots}) {
    const config = useCrudConfig()
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>

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

    /** 没给 title 时的默认卡片头：宿主那侧就是面包屑（经 `CrudConfig.resolveDefaultTitle`） */
    function defaultHeader() {
      const fromConfig = config.value.resolveDefaultTitle?.()
      return (
        <Space>
          {renderIconFont(fromConfig?.icon, 'align')}
          <span>{fromConfig?.title ?? ''}</span>
        </Space>
      )
    }

    return () => {
      const titleSlot =
        props.title === false
          ? undefined
          : slots.title
            ? () => slots.title?.()
            : () => (props.title == null ? defaultHeader() : (props.title as VNodeChild))

      return (
        <Card
          {...(attrs as Record<string, unknown>)}
          v-slots={{
            title: titleSlot,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            // 加载交互放在 body：卡片头（标题/动作）保持可见，只有内容区转圈
            default: () => <Spin spinning={loading.value}>{slots.default?.()}</Spin>,
          }}
        />
      )
    }
  },
})

export default DataLoadingCardPlan
