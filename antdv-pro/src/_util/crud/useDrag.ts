import {createTextVNode, getCurrentInstance, render, ref, type Ref, type VNode} from 'vue'
import {type BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'

/**
 * 拖拽幽灵内容：字符串按文本渲染；VNode 会被**真正挂载**到幽灵容器里（拖拽结束随容器一起卸载）。
 */
export type DragPreviewContent = string | VNode

export interface UseDragOptions<TEntity extends BasicIdMetadata<unknown>> {
  drag: Ref<boolean>
  /** 主键字段名，跟随列表 / 卡片网格的 rowKey；缺省 id */
  idKey?: keyof TEntity & string
  formatDragPreview?: (record: TEntity) => DragPreviewContent
  ghostClass: Ref<string>
}

export interface UseDragReturn<TEntity extends BasicIdMetadata<TId>, TId> {
  dragKey: Ref<TId | undefined>
  entityId: (record: TEntity) => TId
  onDragHandleStart: (record: TEntity, event: DragEvent) => void
  onDragHandleEnd: () => void
  removeDragGhost: () => void
  clearDragKey: () => void
}

export function useDrag<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(options: UseDragOptions<TEntity>): UseDragReturn<TEntity, TId> {
  const idKey = options.idKey ?? SYSTEM_CONSTANT.ID_NAME

  const dragKey = ref<TId | undefined>() as Ref<TId | undefined>
  // 幽灵里的 VNode 是脱离组件树挂载的，要手动补 appContext，否则里面的全局组件按名字解析不到
  const instance = getCurrentInstance()
  let dragGhostEl: HTMLElement | null = null

  function entityId(record: TEntity): TId {
    return record[idKey] as TId
  }

  function removeDragGhost() {
    if (!dragGhostEl) {
      return
    }
    // 挂载过的预览要先卸载（组件副作用随 onUnmounted 清理）再移除容器；纯文本时 render(null) 是空操作
    render(null, dragGhostEl)
    dragGhostEl.remove()
    dragGhostEl = null
  }

  function clearDragKey() {
    dragKey.value = undefined
  }

  function onDragHandleStart(record: TEntity, event: DragEvent) {
    if (!options.drag.value) {
      return
    }
    const id = entityId(record)
    dragKey.value = id
    event.dataTransfer?.setData('text/plain', String(id ?? ''))

    removeDragGhost()
    const preview = options.formatDragPreview?.(record) ?? String(id ?? '')
    const ghost = document.createElement('div')
    ghost.className = options.ghostClass.value
    // 统一走 Vue 渲染：字符串当文本节点，VNode 原样挂载；非法返回值由 Vue 直接报错，不静默吞掉
    if (typeof preview === 'string') {
      render(createTextVNode(preview), ghost)
    } else {
      if (!preview.appContext) {
        preview.appContext = instance?.appContext ?? null
      }
      render(preview, ghost)
    }
    const root = document.querySelector('.ant-app') ?? document.body
    root.appendChild(ghost)
    dragGhostEl = ghost
    event.dataTransfer?.setDragImage(ghost, 12, 12)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function onDragHandleEnd() {
    removeDragGhost()
    clearDragKey()
  }

  return {dragKey, entityId, onDragHandleStart, onDragHandleEnd, removeDragGhost, clearDragKey}
}
