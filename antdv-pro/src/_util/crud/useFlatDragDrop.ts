import {ref, type Ref} from 'vue'
import {
    type BasicIdMetadata,
    buildFlatPlacementMap,
    buildTreeSortMetadata,
    diffTreePlacementIds,
    SYSTEM_CONSTANT,
    type TreeSortMetadata,
} from '@loncra/client/commons'
import {useDrag, type UseDragOptions, type UseDragReturn} from './useDrag'

export interface UseFlatDragDropOptions<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends UseDragOptions<TEntity> {
  dataSource: Ref<TEntity[]>
  direction?: 'vertical' | 'horizontal'
  dropClassPrefix: Ref<string>
  onFlatDrop?: (payload: {
    sorts: TreeSortMetadata<TId>[]
    target: TEntity
    fromIndex: number
    toIndex: number
  }) => void
}

export function reorderFlatList<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  list: TEntity[],
  dragId: TId,
  targetId: TId,
  /** 主键字段名，跟随 rowKey；缺省 id */
  idKey: keyof TEntity & string = SYSTEM_CONSTANT.ID_NAME,
): {newList: TEntity[]; fromIndex: number; toIndex: number; sorts: TreeSortMetadata<TId>[]} | null {
  const getId = (record: TEntity) => record[idKey] as TId

  const current = [...list]
  const fromIndex = current.findIndex((item) => getId(item) === dragId)
  const toIndex = current.findIndex((item) => getId(item) === targetId)
  if (fromIndex === -1 || toIndex === -1) {
    return null
  }

  const placementBefore = buildFlatPlacementMap(current, idKey)
  const [moved] = current.splice(fromIndex, 1)
  current.splice(toIndex, 0, moved!)
  const placementAfter = buildFlatPlacementMap(current, idKey)
  const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
  const sorts =
    changedIds.length > 0
      ? (buildTreeSortMetadata(placementAfter, changedIds) as TreeSortMetadata<TId>[])
      : []

  return {newList: current, fromIndex, toIndex, sorts}
}

export function useFlatDragDrop<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  options: UseFlatDragDropOptions<TEntity, TId>,
): UseDragReturn<TEntity, TId> & {
  buildDropZoneProps: (record: TEntity) => {onDragover: (event: DragEvent) => void; onDrop: () => void}
  dropTargetClass: (record: TEntity) => string | undefined
  clearDropState: () => void
} {
  const {dragKey, entityId, onDragHandleStart, removeDragGhost, clearDragKey} = useDrag<
    TEntity,
    TId
  >(options)

  const hoverTargetKey = ref<TId | undefined>() as Ref<TId | undefined>
  const dropPosition = ref<-1 | 1 | undefined>()
  const direction = options.direction ?? 'vertical'
  const suffix =
    direction === 'horizontal'
      ? {before: '-drag-card-left', after: '-drag-card-right'}
      : {before: '-drag-card-before', after: '-drag-card-after'}

  function clearDropState() {
    hoverTargetKey.value = undefined
    dropPosition.value = undefined
    clearDragKey()
  }

  function handleFlatDrop(target: TEntity) {
    const currentDragKey = dragKey.value
    if (!currentDragKey || currentDragKey === entityId(target)) {
      clearDropState()
      return
    }

    const result = reorderFlatList(
      options.dataSource.value,
      currentDragKey,
      entityId(target),
      options.idKey,
    )
    if (!result) {
      clearDropState()
      return
    }

    options.dataSource.value = result.newList
    clearDropState()
    options.onFlatDrop?.({
      sorts: result.sorts,
      target,
      fromIndex: result.fromIndex,
      toIndex: result.toIndex,
    })
  }

  function resolveDropPosition(event: DragEvent): -1 | 1 {
    const el = event.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    if (direction === 'horizontal') {
      const ratio = (event.clientX - rect.left) / rect.width
      return ratio < 0.5 ? -1 : 1
    }
    const ratio = (event.clientY - rect.top) / rect.height
    return ratio < 0.5 ? -1 : 1
  }

  function buildDropZoneProps(record: TEntity) {
    return {
      onDragover: (event: DragEvent) => {
        if (!options.drag.value) {
          return
        }
        event.preventDefault()
        hoverTargetKey.value = entityId(record)
        dropPosition.value = resolveDropPosition(event)
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move'
        }
      },
      onDrop: () => {
        if (!options.drag.value) {
          return
        }
        handleFlatDrop(record)
      },
    }
  }

  function dropTargetClass(record: TEntity): string | undefined {
    if (hoverTargetKey.value !== entityId(record)) {
      return undefined
    }
    if (dropPosition.value === -1) {
      return `${options.dropClassPrefix.value}${suffix.before}`
    }
    if (dropPosition.value === 1) {
      return `${options.dropClassPrefix.value}${suffix.after}`
    }
    return undefined
  }

  function onDragHandleEnd() {
    removeDragGhost()
    clearDropState()
  }

  return {
    dragKey,
    entityId,
    onDragHandleStart,
    onDragHandleEnd,
    removeDragGhost,
    clearDragKey,
    buildDropZoneProps,
    dropTargetClass,
    clearDropState,
  }
}
