import {
  computed,
  onActivated,
  onMounted,
  type Ref,
  useModel,
  type VNodeChild,
} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useCrudConfig} from '../crud-config-provider'
import useStyle from './style'
import type {DataLoadingCardProps, DataLoadingCardSlots, DataLoadingTask} from './types'

export function useDataLoadingCard(props: DataLoadingCardProps, slots: DataLoadingCardSlots) {
  const config = useCrudConfig()
  const antdConfig = useConfig()
  const loading = useModel(props, 'loading') as unknown as Ref<boolean>
  const prefixCls = computed(() =>
    antdConfig.value.getPrefixCls('data-loading-card', 'loncra-data-loading-card'),
  )
  const [hashId, cssVarCls] = useStyle(prefixCls)

  let running: Promise<unknown> | undefined
  let activated = false

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
    if (!activated) {
      activated = true
      return
    }
    run(props.onActivated)
  })

  function resolveTitleSlot(): (() => VNodeChild) | undefined {
    if (props.title === false) {
      return undefined
    }
    if (slots.title) {
      return () => slots.title?.()
    }
    return () =>
      props.title == null
        ? (config.value.resolveDefaultTitle?.() ?? null)
        : (props.title as VNodeChild)
  }

  return {loading, prefixCls, hashId, cssVarCls, resolveTitleSlot}
}
