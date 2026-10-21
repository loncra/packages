import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageFieldRenderContext, PageFormFieldSlots} from './types'

export function withFieldCtx(
  slots: PageFormFieldSlots | undefined,
  ctx: PageFieldRenderContext<DefaultCrudEntity>,
): PageFormFieldSlots | undefined {
  if (!slots) {
    return undefined
  }
  const wrapped: PageFormFieldSlots = {}
  for (const [name, fn] of Object.entries(slots)) {
    wrapped[name] = (...args: never[]) => fn(...args, ctx as never)
  }
  return wrapped
}
