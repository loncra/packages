import {computed, ref} from 'vue'
import {Collapse} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {SkillPackageEntity} from '@loncra/client/ai'
import {useLocale} from '../../../_util/useLocale'
import SkillReleaseChangeLog from './skill-release-change-log/SkillReleaseChangeLog'
import useChangelogStyle from './skill-release-change-log/style'
import {ensureReleases, isReleasesLoaded, releaseEntriesOf} from './useReleases'

export function useSkillChangelog() {
    const locale = useLocale('AgentHub')
    const config = useConfig()
    const changelogPrefixCls = computed(() => config.value.getPrefixCls('agent-hub-changelog', 'loncra-agent-hub-changelog'))
    const [changelogHashId] = useChangelogStyle(changelogPrefixCls)
    const changelogOpenKeys = ref(new Map<number, string[]>())

    function toggleChangelog(packageId: number, keys: string[]): void {
        changelogOpenKeys.value = new Map(changelogOpenKeys.value).set(packageId, keys)
        if (keys.includes('changelog')) {
            void ensureReleases(packageId)
        }
    }

    function renderReleaseChangeLog(record: SkillPackageEntity | undefined) {
        const packageId = record?.id
        if (packageId == null) {
            return null
        }
        return (
            <Collapse
                ghost
                class={classNames(changelogHashId.value, `${changelogPrefixCls.value}-changelog`)}
                activeKey={changelogOpenKeys.value.get(packageId) ?? []}
                onChange={(keys: string[]) => toggleChangelog(packageId, keys)}
                items={[{key: 'changelog', label: locale.value.changelog}]}
                v-slots={{
                    contentRender: () => (
                        <SkillReleaseChangeLog
                            dataSource={releaseEntriesOf(packageId)}
                            loading={!isReleasesLoaded(packageId)}
                        />
                    ),
                }}
            />
        )
    }

    return {renderReleaseChangeLog}
}
