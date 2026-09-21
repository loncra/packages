import {watch, type WatchSource} from 'vue'
import {useFormItemContext} from 'antdv-next/dist/form/context'

/**
 * 值变化 → 通知外层 `FormItem`（自定义受控组件要手动 `triggerChange`，否则校验不刷新）。
 * `deep` 用于"父级原地改数组元素也算变"的场景（如 `AttachmentUpload`）。
 */
export function useFormItemTrigger(source: WatchSource<unknown>, deep = false) {
  const formItemContext = useFormItemContext()
  watch(source, () => {
    formItemContext?.triggerChange()
  }, {deep})
  return formItemContext
}
