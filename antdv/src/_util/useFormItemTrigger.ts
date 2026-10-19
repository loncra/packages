import {watch, type WatchSource} from 'vue'
import {useFormItemContext} from 'antdv-next/dist/form/context'

export function useFormItemTrigger(source: WatchSource<unknown>, deep = false) {
  const formItemContext = useFormItemContext()
  watch(source, () => {
    formItemContext?.triggerChange()
  }, {deep})
  return formItemContext
}
