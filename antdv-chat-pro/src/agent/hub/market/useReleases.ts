import {ref} from 'vue'
import {AiSkillPackageService, type SkillReleaseEntity} from '@loncra/client/ai'

const releaseCache = ref(new Map<number, SkillReleaseEntity[]>())
const releasePending = ref(new Map<number, Promise<void>>())
const releaseService = new AiSkillPackageService()

export function ensureReleases(packageId: number): Promise<void> {
    if (releaseCache.value.has(packageId)) {
        return Promise.resolve()
    }
    const pending = releasePending.value.get(packageId)
    if (pending != null) {
        return pending
    }
    const promise = releaseService.listReleases(packageId)
        .then((result) => {
            releaseCache.value = new Map(releaseCache.value).set(packageId, result.data ?? [])
        })
        .finally(() => {
            const next = new Map(releasePending.value)
            next.delete(packageId)
            releasePending.value = next
        })
    releasePending.value = new Map(releasePending.value).set(packageId, promise)
    return promise
}

export function releaseEntriesOf(packageId: number): SkillReleaseEntity[] {
    return releaseCache.value.get(packageId) ?? []
}

export function isReleasesLoaded(packageId: number): boolean {
    return releaseCache.value.has(packageId)
}

export function releaseOptionsOf(packageId: number): {label: string; value: string}[] {
    return releaseEntriesOf(packageId)
        .filter((item) => item.releaseVersion != null)
        .map((item) => ({label: item.releaseVersion!, value: item.releaseVersion!}))
}
