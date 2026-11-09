import {Comment, Fragment, Text, isVNode, type VNodeChild} from 'vue'

export function hasSlotContent(value: VNodeChild): boolean {
  if (value == null || value === false || value === true || value === '') {
    return false
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasSlotContent(item as VNodeChild))
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().length > 0
  }
  if (!isVNode(value)) {
    return false
  }
  if (value.type === Comment) {
    return false
  }
  if (value.type === Text) {
    return String(value.children ?? '').trim().length > 0
  }
  if (value.type === Fragment) {
    return hasSlotContent(value.children as VNodeChild)
  }
  return true
}
