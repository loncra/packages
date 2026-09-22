import type {EnumBucketRequest, EnumRef} from '../../basic-crud-query/types.ts'
import type {
  PageFieldsDictionary,
  PageFormField,
  PageListEntry,
  PageLookupFieldSpec,
} from '../../crud-page/types.ts'
import {toListColumn} from '../../crud-page/home/columns.ts'

/** 一个页面要预载的来源（去掉重复、按 module 分组） */
export interface PageSourceLoads {
  enums: EnumBucketRequest[]
  dictionaryCodes: string[]
}

/** 一组字段条目生效的来源 → 加载清单（模块分组 + 去重） */
function groupSources(specs: {enumRef?: EnumRef; dictId?: string}[]): PageSourceLoads {
  const grouped = new Map<string, Set<string>>()
  const dictionaryCodes = new Set<string>()
  for (const spec of specs) {
    if (spec.enumRef) {
      const ids = grouped.get(spec.enumRef.module) ?? new Set<string>()
      ids.add(spec.enumRef.id)
      grouped.set(spec.enumRef.module, ids)
    }
    if (spec.dictId) {
      dictionaryCodes.add(spec.dictId)
    }
  }
  return {
    enums: [...grouped].map(([module, ids]) => ({module, ids: [...ids]})),
    dictionaryCodes: [...dictionaryCodes],
  }
}

/**
 * 列表要预载的来源：**只看"列上有搜索项"的字段**。
 *
 * 两点用意：
 * 1. **来源只写一处** —— 字段字典里写了 `enumRef` / `dictId`，这里自动收成加载清单，
 *    页面不必再抄一份 `enums` / `dictionaryCodes`（漏抄就是静默空下拉）；
 * 2. **不多拉** —— 没搜索项的列不喂 options（那个字段的来源可能是**只为表单**写的，
 *    如 `resource.fields.enabled`），所以不算进列表的加载清单。
 */
export function collectListSources<TEntity extends object>(
  columns: PageListEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
): PageSourceLoads {
  const specs: PageLookupFieldSpec[] = []
  for (const entry of columns) {
    const item = toListColumn(entry)
    if (!item.search) {
      continue
    }
    // 与 `buildListColumns` 同一套合并：条目里写了就以条目为准
    specs.push({...fields[item.key as keyof TEntity & string], ...item})
  }
  return groupSources(specs)
}

/**
 * 表单要预载的来源：**收表单里出现的全部字段**（表单没有"搜索项"那种过滤条件 ——
 * 写了 `enumRef` / `dictId` 就是为了给组件喂 options）。
 *
 * 与列表那半各算各的：同一份字段字典，列表只收"列上有搜索项"的、表单收全部
 * ⇒ "只为表单写的来源"不会被列表白拉，"列表要用但表单不用"的也不会进表单。
 */
export function collectFormSources<TEntity extends object>(
  fields: PageFormField<TEntity>[],
  dictionary: PageFieldsDictionary<TEntity>,
): PageSourceLoads {
  return groupSources(
    // 与 `buildFormFields` 同一套合并：条目里写了就以条目为准
    fields.map((field) => ({...dictionary[field.key], ...field})),
  )
}

/**
 * 推导 + 页面显式声明**合并**（显式那两份降级为逃生口：壳里要用 `buckets`、
 * 或来源不给列表用时才写）。
 */
export function mergeSources(
  derived: PageSourceLoads,
  declared?: {enums?: EnumBucketRequest[]; dictionaryCodes?: string[]},
): PageSourceLoads {
  return {
    enums: groupSources([...derived.enums.flatMap(toRefs), ...(declared?.enums ?? []).flatMap(toRefs)])
      .enums,
    dictionaryCodes: [
      ...new Set([...derived.dictionaryCodes, ...(declared?.dictionaryCodes ?? [])]),
    ],
  }
}

/** `EnumBucketRequest`（模块 + 一批 id）→ 便于与字段来源一起分组的形状 */
function toRefs(request: EnumBucketRequest): {enumRef: EnumRef}[] {
  return request.ids.map((id) => ({enumRef: {module: request.module, id}}))
}
