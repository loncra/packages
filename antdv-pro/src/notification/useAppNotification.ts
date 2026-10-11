import {computed, h, nextTick, type VNode} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {ArgsProps} from 'antdv-next/dist/notification'
import {classNames} from '@loncra/antdv'
import useStyle, {APP_NOTIFICATION_PREFIX} from './style'

const notificationKeyCache: Record<string, Set<string>> = {}

export function useAppNotification() {
  const {notification} = useApp()
  const config = useConfig()
  const prefixCls = computed(() => config.value.getPrefixCls('app-notification', APP_NOTIFICATION_PREFIX))
  const [hashId, cssVarCls] = useStyle(prefixCls)

  function getNotificationKey(group: string): Set<string> | undefined {
    return notificationKeyCache[group]
  }

  async function addNotificationKey(group: string, key: string) {
    const keys: Set<string> = getNotificationKey(group) ?? new Set()
    if (keys.has(key)) {
      destroy(key)
      await nextTick()
    }
    keys.add(key)
    notificationKeyCache[group] = keys
  }

  function createNotificationDescription(text: string): VNode | '' {
    if (!text) {
      return ''
    }
    return h(
      Typography.Paragraph,
      {
        class: classNames(`${prefixCls.value}-description`),
        ellipsis: {rows: 2},
      },
      () => text,
    )
  }

  async function info(
    props: ArgsProps,
    group: string = 'default',
    key: string = crypto.randomUUID(),
  ) {
    await addNotificationKey(group, key)
    const {classes: callerClassesProp, ...rest} = props
    const callerClasses = typeof callerClassesProp === 'function' ? undefined : callerClassesProp
    notification.info({
      key,
      ...rest,
      classes: {
        ...callerClasses,
        root: classNames(prefixCls.value, hashId.value, cssVarCls.value, callerClasses?.root),
        icon: classNames(`${prefixCls.value}-icon`, callerClasses?.icon),
        title: classNames(`${prefixCls.value}-title`, callerClasses?.title),
      },
    })
  }

  function destroy(key: string) {
    notification.destroy(key)
    for (const group of Object.keys(notificationKeyCache)) {
      notificationKeyCache[group]?.delete(key)
    }
  }

  return {
    info,
    destroy,
    getNotificationKey,
    createNotificationDescription,
  }
}
