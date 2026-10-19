import {computed, defineComponent, ref, watch} from 'vue'
import {Empty, Flex, Spin, Tabs, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AiSkillPackageService, type SkillReleaseEntity} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useStyle, {AGENT_HUB_PREFIX} from './style'

dayjs.extend(relativeTime)

const SkillReleaseChangeLog = defineComponent({
  name: 'LAgentHubSkillReleaseChangeLog',
  props: {
    packageId: {type: Number, required: true},
  },
  setup(props) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const releases = ref<SkillReleaseEntity[]>([])
    const activeKey = ref<string>()
    const loading = ref(false)
    const service = new AiSkillPackageService()
    const tabItems = computed(() =>
      releases.value
        .filter((item) => item.id != null)
        .map((item) => ({
          key: String(item.id),
          label: item.releaseVersion,
        })),
    )
    const activeRelease = computed(() =>
      releases.value.find((item) => String(item.id) === activeKey.value),
    )

    async function loadReleases(packageId: number): Promise<void> {
      loading.value = true
      try {
        const result = await service.listReleases(packageId)
        releases.value = result.data || []
        const first = releases.value.find((item) => item.id != null)
        activeKey.value = first?.id == null ? undefined : String(first.id)
      } finally {
        loading.value = false
      }
    }

    watch(() => props.packageId, (packageId) => {
      void loadReleases(packageId)
    }, {immediate: true})

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const release = activeRelease.value
      const changelog = release?.changelog?.trim()
      return (
        <Spin spinning={loading.value} class={`${prefixCls.value}-full-spin`}>
          {!loading.value && tabItems.value.length === 0
            ? <Empty />
            : tabItems.value.length
              ? (
                <Tabs
                  activeKey={activeKey.value}
                  tabPlacement="start"
                  size="small"
                  items={tabItems.value}
                  onUpdate:activeKey={(key: string) => {
                    activeKey.value = key
                  }}
                  v-slots={{
                    contentRender: () => release
                      ? (
                        <Flex vertical gap="small" class={rootClass}>
                          <Flex justify="space-between" align="center">
                            <span>{release.releaseVersion}</span>
                            {release.releaseTime
                              ? (
                                <Typography.Text type="secondary" class={`${prefixCls.value}-time`}>
                                  {dayjs(release.releaseTime).fromNow()}
                                </Typography.Text>
                              )
                              : null}
                          </Flex>
                          {changelog ? <div>{changelog}</div> : <Empty />}
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
