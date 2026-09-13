import {watch, type WatchSource} from 'vue'
import {useFormItemContext} from 'antdv-next/dist/form/context'

export function useFormItemTrigger(source: WatchSource<unknown>) {
  const formItemContext = useFormItemContext()
  watch(source, () => {
    formItemContext?.triggerChange()
  })
  return formItemContext
}
