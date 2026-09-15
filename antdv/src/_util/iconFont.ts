import {h, resolveComponent, type VNode} from 'vue'

export function renderIconFont(
  type?: string,
  classes: string = '',
  spin = false,
  rotate = 0,
): VNode | null {
  if (!type) {
    return null
  }
  const IconFont = resolveComponent('IconFont')
  if (typeof IconFont === 'string') {
    return null
  }
  return h(IconFont, {type, class: 'icon ' + (classes ?? ''), spin, rotate})
}
