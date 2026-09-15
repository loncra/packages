import {ref, type Ref} from 'vue'
import {type BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'

export interface UseDragOptions<TEntity extends BasicIdMetadata<unknown>> {
  drag: Ref<boolean>
  idKey?: typeof SYSTEM_CONSTANT.ID_NAME
  formatDragPreview?: (record: TEntity) => string
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
  let dragGhostEl: HTMLElement | null = null

  function entityId(record: TEntity): TId {
    return record[idKey] as TId
  }

  function removeDragGhost() {
    dragGhostEl?.remove()
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
    const label = options.formatDragPreview?.(record) ?? String(id ?? '')
    const ghost = document.createElement('div')
    ghost.className = options.ghostClass.value
    ghost.textContent = label
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
