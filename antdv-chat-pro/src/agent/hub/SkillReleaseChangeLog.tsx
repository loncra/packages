import {computed, defineComponent, type PropType, ref, type SlotsType, watchEffect} from 'vue'
import {Empty, Flex, Spin, Tabs, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {SkillReleaseEntity} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useStyle, {AGENT_HUB_PREFIX} from './style'

dayjs.extend(relativeTime)

const SkillReleaseChangeLog = defineComponent({
  name: 'LAgentHubSkillReleaseChangeLog',
  props: {
    dataSource: {type: Array as PropType<SkillReleaseEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
  },
  emits: {
    change: (_release: SkillReleaseEntity) => true,
  },
  slots: Object as SlotsType<{
    label?: (release: SkillReleaseEntity) => unknown
  }>,
  setup(props, {emit, slots}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const activeKey = ref<string>()
    const tabItems = computed(() =>
      props.dataSource
        .filter((item) => item.id != null)
        .map((item) => ({
          key: String(item.id),
          label: slots.label?.(item) ?? item.releaseVersion,
        })),
    )
    const activeRelease = computed(() =>
      props.dataSource.find((item) => String(item.id) === activeKey.value),
    )

    watchEffect(() => {
      const items = props.dataSource.filter((item) => item.id != null)
      if (items.length === 0) {
        return
      }
      if (activeKey.value != null && items.some((item) => String(item.id) === activeKey.value)) {
        return
      }
      const first = items[0]
      if (first?.id != null) {
        activeKey.value = String(first.id)
      }
    })

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const release = activeRelease.value
      const changelog = release?.changelog?.trim()
      return (
        <Spin spinning={props.loading} class={`${prefixCls.value}-full-spin`}>
          {!props.loading && tabItems.value.length === 0
            ? <Empty />
            : tabItems.value.length
              ? (
                <Tabs
                  activeKey={activeKey.value}
                  tabPlacement="start"
                  size="small"
                  classes={{item:`${prefixCls.value}-release-change-log-tabs-item`}}
                  items={tabItems.value}
                  onUpdate:activeKey={(key: string) => {
                    activeKey.value = key
                    const release = props.dataSource.find((item) => String(item.id) === key)
                    if (release != null) {
                      emit('change', release)
                    }
                  }}
                  v-slots={{
                    contentRender: () => release
                      ? (
                        <Flex vertical gap="small" class={rootClass}>
                          {release.releaseTime
                              ? (
                                  <Typography.Text type="secondary" class={`${prefixCls.value}-time`}>
                                    {dayjs(release.releaseTime).fromNow()}
                                  </Typography.Text>
                              )
                              : null}
                          {changelog ? <div class={`${prefixCls.value}-changelog-content`}>{changelog}</div> : <Empty />}
                        </Flex>
                      )
                      : null,
                  }}
                />
              )
              : null}
        </Spin>
      )
    }
  },
})

export default SkillReleaseChangeLog
