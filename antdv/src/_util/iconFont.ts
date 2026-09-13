import {h, resolveComponent, type VNode} from 'vue'

export function renderIconFont(type?: string, className?: string): VNode | null {
  if (!type) {
    return null
  }
  const IconFont = resolveComponent('IconFont')
  if (typeof IconFont === 'string') {
    return null
  }
  return h(IconFont, { type, class: className })
}
