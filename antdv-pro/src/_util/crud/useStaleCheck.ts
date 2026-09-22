import {App} from 'antdv-next'
import type {BasicIdMetadata, VersionEntityMetadata} from '@loncra/client/commons'
import {computed, ref, type Ref} from 'vue'
import {useCrudConfig} from '../../crud-config-provider'
import {useLocale} from '../useLocale'

/** 陈旧检查强度：`false` 不检查；`'overwrite'` 变了就覆盖、不问（**详情默认**）；`'prompt'` 本地动过才问（**表单默认**） */
export type StaleCheckMode = false | 'overwrite' | 'prompt'

/** 陈旧检查的结论（壳用 `emit('stale', info)` 抛给宿主收尾：关 tab / 回列表） */
export interface CrudStaleInfo {
  reason: 'deleted' | 'modified'
  /** 最新的服务端实体（`reason: 'deleted'` 时为 `undefined`） */
  remote?: unknown
}

export interface UseStaleCheckOptions<TEntity extends object> {
  /** 页级声明（`CrudPageCore.staleCheck`）；不给就落到 `CrudConfig.staleCheck`，再不给用形态默认 */
  pageMode?: StaleCheckMode
  /** 形态默认：表单 `'prompt'`、详情 `'overwrite'` */
  defaultMode: 'prompt' | 'overwrite'
  /** 表单 / 详情的实体（冲突时可能被覆盖，或只回写版本戳） */
  entity: Ref<TEntity>
  /**
   * 重新取数（**与首屏同口径**：`getDetail` / `service.get` + `postGetEntity`），**不写回表单**。
   * 取不到（被删 / 没数据）返回 `undefined`；**真出错请 `throw`** —— 出错一律静默跳过，
   * 绝不把"网络抖了一下"当成"记录被删"（宁可漏报，不能误报）。
   */
  fetchRemote: () => Promise<TEntity | undefined>
  /** 本地动过没（表单传 `() => !!formRef.value?.isFieldsTouched()`；详情不传 = 恒 `false`） */
  isDirty?: () => boolean
}

/** 服务端口径：只取 `remote` 里有的键（本地独有的键不参与比较） */
function pickKeys(source: object, keys: string[]): Record<string, unknown> {
  const target: Record<string, unknown> = {}
  for (const key of keys) {
    target[key] = (source as Record<string, unknown>)[key]
  }
  return target
}

/** 规范化串：key 排序 + 剔 `undefined`（`Date` / dayjs 有 `toJSON`，同值同串） */
function normalize(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val === undefined) return undefined
    if (val === null || typeof val !== 'object' || Array.isArray(val)) return val
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
    )
  })
}

/**
 * 深拷贝 —— **只用 JSON**：`entity` 是 `ref` 里的响应式代理，`structuredClone` 对代理直接抛
 * `DataCloneError`；本仓数据本来就都是可序列化的。
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * 两次取数内容是否一样。
 *
 * ① 快路径：两侧都有 `version` 且相同 ⇒ 一样（`version` 就是后端的乐观锁版本号）；
 * ② 否则比内容：**只比 `remote` 里有的键**（`createEntity` 的默认值、宿主塞的临时字段不算"被改"），
 *    并**剔掉 `version`** —— 后端每次保存都会把它 +1，不该因此判"被改"（自己刚保存完切回来就会这样）。
 *
 * 为什么不直接自己算哈希：字段顺序、`dayjs` 对象、`undefined` 与 `null`、后端多返回的字段，
 * 都会误报；有版本戳就用版本戳，没有才走这条"规范化深比较"。
 */
function isSameSnapshot(baseline: object, remote: object): boolean {
  const baselineVersion = (baseline as VersionEntityMetadata).version
  const remoteVersion = (remote as VersionEntityMetadata).version
  if (baselineVersion !== undefined && remoteVersion !== undefined && baselineVersion === remoteVersion) {
    return true
  }
  const keys = Object.keys(remote).filter((key) => key !== 'version')
  return normalize(pickKeys(baseline, keys)) === normalize(pickKeys(remote, keys))
}

/**
 * 陈旧检查：**切回页签时**（卡片壳的 `onActivated`）重新取数，跟基线比一比。
 *
 * | 情况 | 结果 |
 * |---|---|
 * | 一致 | 什么都不做（**本地改动一律保留**） |
 * | 取不到 | 弹"已失效"提示，返回 `{reason:'deleted'}`（关 tab / 回列表归宿主） |
 * | 变了 + 本地没动过 | **静默覆盖** + 刷基线（用户无感） |
 * | 变了 + 本地动过 | 询问：用服务器版本（丢本地）／保留我的修改（**只回写版本戳**，见 `copyVersion`） |
 *
 * 机制在 pro（判定要读壳里的 `entity` + 基线 + 表单脏标记），策略在宿主（`staleCheck` 开关、
 * 文案可经 `locale-message` 覆写、收尾走 `emit('stale')`）。
 */
export function useStaleCheck<TEntity extends object>(options: UseStaleCheckOptions<TEntity>) {
  const config = useCrudConfig()
  const locale = useLocale('Crud')
  const {modal} = App.useApp()
  const mode = computed<StaleCheckMode>(
    () => options.pageMode ?? config.value.staleCheck ?? options.defaultMode,
  )
  /** 基线：取数（`postGetEntity` 之后）的深拷贝 —— "服务端变没变"一律跟它比，与用户的编辑无关 */
  const baseline = ref<TEntity>() as Ref<TEntity | undefined>

  /** 记基线（取数成功后、保存成功后各调一次） */
  function markBaseline(value: TEntity): void {
    baseline.value = clone(value)
  }

  /** 服务端实体写回表单（合并：只覆盖服务端返回的键），顺手记基线 */
  function applyRemote(remote: TEntity): void {
    options.entity.value = {...options.entity.value, ...remote}
    markBaseline(options.entity.value)
  }

  /**
   * **只把版本戳写回表单** —— 用户选"保留我的修改"时必做：否则他接着提交时带着旧版本号，
   * 后端的乐观锁会直接拒。内容留我的、版本跟上，这次冲突就以"我的修改"定稿。
   */
  function copyVersion(remote: TEntity): void {
    if (!('version' in remote)) {
      return
    }
    // 版本戳按 commons 的 `VersionEntityMetadata` 读；别手搓 `Record<string, unknown>` 把类型绕过去
    ;(options.entity.value as VersionEntityMetadata).version = (remote as VersionEntityMetadata).version
  }

  /** 冲突询问：确定 = 用服务器版本（危险，丢本地）；取消 / Esc = 保留我的修改（安全默认） */
  async function askUseRemote(): Promise<boolean> {
    try {
      await modal.confirm({
        title: locale.value.stale.modifiedTitle,
        content: locale.value.stale.modifiedContent,
        okText: locale.value.stale.useRemote,
        okButtonProps: {danger: true},
        cancelText: locale.value.stale.keepMine,
      })
      return true
    } catch {
      return false
    }
  }

  /** 切回来检查一次；有结论就返回给壳去 `emit('stale')` */
  async function check(): Promise<CrudStaleInfo | undefined> {
    if (!mode.value || baseline.value == null) {
      return
    }
    if ((options.entity.value as BasicIdMetadata<string | number>).id == null) {
      return // 新增态没有"陈旧"可言
    }

    let remote: TEntity | undefined
    try {
      remote = await options.fetchRemote()
    } catch {
      return // 出错（含宿主 http 层已提示过的）一律静默
    }

    if (remote == null) {
      modal.warning({
        title: locale.value.stale.deletedTitle,
        content: locale.value.stale.deletedContent,
      })
      return {reason: 'deleted'}
    }

    if (isSameSnapshot(baseline.value, remote)) {
      // 服务端没变（或只是版本号因"自己刚保存"涨了一位）⇒ 什么都不做
      markBaseline(remote)
      return
    }

    if (mode.value === 'overwrite' || !(options.isDirty?.() ?? false)) {
      applyRemote(remote) // 本地没动过 ⇒ 静默覆盖
      return {reason: 'modified', remote}
    }

    if (await askUseRemote()) {
      applyRemote(remote)
    } else {
      copyVersion(remote)
      markBaseline(remote) // 同一处只问一次
    }
    return {reason: 'modified', remote}
  }

  return {check, markBaseline}
}
