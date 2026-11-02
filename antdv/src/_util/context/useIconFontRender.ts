import {computed, type ComputedRef, inject, type InjectionKey, provide, type VNodeChild} from 'vue'

export type IconFontRenderFn = (type: string, attrs?: Record<string, unknown>) => VNodeChild

const NULL_ICON_FONT_RENDER: IconFontRenderFn = () => null

const ICON_FONT_RENDER_KEY: InjectionKey<ComputedRef<IconFontRenderFn>> = Symbol('LONCRA_ICON_FONT_RENDER')

export function provideIconFontRender(render: ComputedRef<IconFontRenderFn | undefined>): void {
  provide(ICON_FONT_RENDER_KEY, computed(() => render.value ?? NULL_ICON_FONT_RENDER))
}

export function useIconFontRender(): IconFontRenderFn {
  const injected = inject(ICON_FONT_RENDER_KEY, undefined)
  return (type, attrs) => (injected?.value ?? NULL_ICON_FONT_RENDER)(type, attrs)
}
