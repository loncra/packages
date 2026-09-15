import {computed, ref, type Ref} from 'vue'
import type {TableProps} from 'antdv-next'
import type {FlatSortMetadata} from '@loncra/client/commons'
import {
    type BasicIdMetadata,
    buildTreePlacementMap,
    buildTreeSortMetadata,
    diffTreePlacementIds,
    type DropPosition,
    findFirstTreeNode,
    isTree,
    isTreeDescendant,
    moveTreeNode,
    SYSTEM_CONSTANT,
    type TreePlacement,
    type TreeSortMetadata,
} from '@loncra/client/commons'
import {useDrag, type UseDragOptions} from './useDrag'
import {reorderFlatList} from './useFlatDragDrop'

export interface UseTableRowDragOptions<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends UseDragOptions<TEntity> {
  dataSource: Ref<TEntity[]>
  onRow?: Ref<TableProps['onRow'] | undefined>
  dropClassPrefix: Ref<string>
  onFlatDrop?: (payload: {
    sorts: FlatSortMetadata<TId>[]
    target: TEntity
    fromIndex: number
    toIndex: number
  }) => void
  onTreeDrop?: (payload: {
    sorts: TreeSortMetadata<TId>[]
    drag: TEntity
    target: TEntity
    dropPosition: DropPosition
    tree: TEntity[]
  }) => void
}

type RowClassValue = string | Record<string, boolean> | Array<string | Record<string, boolean>>

export function useTableRowDrag<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(options: UseTableRowDragOptions<TEntity, TId>) {
  const idKey = options.idKey ?? SYSTEM_CONSTANT.ID_NAME

  const {dragKey, entityId, onDragHandleStart, removeDragGhost, clearDragKey} = useDrag<
    TEntity,
    TId
  >(options)

  const hoverTargetKey = ref<TId | undefined>() as Ref<TId | undefined>
  const dropInvalid = ref<boolean>()
  const dropPosition = ref<DropPosition>()
  const lastPlacement = ref(new Map<number, TreePlacement>())

  function clearDragState() {
    clearDragKey()
    hoverTargetKey.value = undefined
    dropPosition.value = undefined
    dropInvalid.value = undefined
  }

  function syncPlacementBaseline(tree: TEntity[] = options.dataSource.value) {
    if (!options.drag.value) {
      return
    }
    if (tree.length === 0) {
      lastPlacement.value = new Map()
      return
    }
    if (!isTree(tree)) {
      return
    }
    lastPlacement.value = buildTreePlacementMap(tree, idKey)
  }

  function isInvalidTreeDrop(dragId: TId, target: TEntity): boolean {
    if (dragId === entityId(target)) {
      return true
    }
    if (!isTree(options.dataSource.value)) {
      return false
    }
    return isTreeDescendant(dragId, entityId(target), options.dataSource.value, idKey)
  }

  function resolveDropPosition(event: DragEvent, treeMode: boolean): DropPosition {
    const el = event.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const ratio = (event.clientY - rect.top) / rect.height
    if (!treeMode) {
      return ratio < 0.5 ? -1 : 1
    }
    if (ratio < 0.25) {
      return -1
    }
    if (ratio > 0.75) {
      return 1
    }
    return 0
  }

  function mergeRowClass(
    parentClass: RowClassValue | undefined,
    dragClass: string | undefined,
  ): RowClassValue | undefined {
    if (!dragClass) {
      return parentClass
    }
    if (!parentClass) {
      return dragClass
    }
    if (typeof parentClass === 'string') {
      return `${parentClass} ${dragClass}`
    }
    if (Array.isArray(parentClass)) {
      return [...parentClass, dragClass]
    }
    return {...parentClass, [dragClass]: true}
  }

  function dragRowClass(record: TEntity): string | undefined {
    if (hoverTargetKey.value !== entityId(record)) {
      return undefined
    }
    const prefix = options.dropClassPrefix.value
    if (dropInvalid.value) {
      return `${prefix}-drag-row-invalid`
    }
    const pos = dropPosition.value
    if (pos === -1) {
      return `${prefix}-drag-row-before`
    }
    if (pos === 1) {
      return `${prefix}-drag-row-after`
    }
    if (pos === 0 && isTree(options.dataSource.value)) {
      return `${prefix}-drag-row-inner`
    }
    return undefined
  }

  function handleFlatRowDrop(target: TEntity, dragId: TId) {
    const result = reorderFlatList(options.dataSource.value, dragId, entityId(target), idKey)
    if (!result) {
      clearDragState()
      return
    }

    options.dataSource.value = result.newList
    clearDragState()
    options.onFlatDrop?.({
      sorts: result.sorts,
      target,
      fromIndex: result.fromIndex,
      toIndex: result.toIndex,
    })
  }

  function handleTreeRowDrop(target: TEntity, dragId: TId) {
    const pos = dropPosition.value ?? 0
    const dragRecord = findFirstTreeNode(
      (n) => entityId(n as TEntity) === dragId,
      options.dataSource.value,
    ) as TEntity | undefined

    const newTree = moveTreeNode(
      options.dataSource.value,
      dragId,
      entityId(target),
      pos,
      idKey,
    ) as TEntity[] | null

    if (!newTree || !dragRecord) {
      clearDragState()
      return
    }

    const placementBefore = new Map(lastPlacement.value)
    const placementAfter = buildTreePlacementMap(newTree, idKey)
    const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
    const sorts =
      changedIds.length > 0
        ? (buildTreeSortMetadata(placementAfter, changedIds) as TreeSortMetadata<TId>[])
        : []

    options.dataSource.value = newTree
    clearDragState()
    lastPlacement.value = placementAfter

    options.onTreeDrop?.({
      sorts,
      drag: dragRecord,
      target,
      dropPosition: pos,
      tree: newTree,
    })
  }

  function buildDragRowProps(record: TEntity) {
    return {
      onDragover: (event: DragEvent) => {
        if (!options.drag.value) {
          return
        }
        event.preventDefault()
        const treeMode = isTree(options.dataSource.value)
        hoverTargetKey.value = entityId(record)
        dropPosition.value = resolveDropPosition(event, treeMode)
        dropInvalid.value =
          dragKey.value != null ? isInvalidTreeDrop(dragKey.value as TId, record) : false
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = dropInvalid.value ? 'none' : 'move'
        }
      },
      onDrop: () => {
        if (!options.drag.value) {
          return
        }
        const currentDragKey = dragKey.value
        if (!currentDragKey || currentDragKey === entityId(record)) {
          clearDragState()
          return
        }
        if (dropInvalid.value) {
          clearDragState()
          return
        }
        if (isTree(options.dataSource.value)) {
          handleTreeRowDrop(record, currentDragKey as TId)
        } else {
          handleFlatRowDrop(record, currentDragKey as TId)
        }
      },
    }
  }

  function resolveOnRow(
    record: Parameters<NonNullable<TableProps['onRow']>>[0],
    index?: number,
  ) {
    const parentOnRow = options.onRow?.value
    const parentProps = typeof parentOnRow === 'function' ? parentOnRow(record, index) ?? {} : {}

    if (!options.drag.value) {
      return parentProps
    }

    const entity = record as TEntity
    return {
      ...parentProps,
      ...buildDragRowProps(entity),
      class: mergeRowClass(parentProps.class as RowClassValue | undefined, dragRowClass(entity)),
    }
  }

  const tableOnRow = computed((): TableProps['onRow'] | undefined => {
    if (!options.drag.value && !options.onRow?.value) {
      return undefined
    }
    return resolveOnRow
  })

  function onDragHandleEnd() {
    removeDragGhost()
    clearDragState()
  }

  function applyDragColumn<T extends object>(columns: T[]) {
    if (!options.drag.value) {
      return columns
    }
    return [{title: '', key: 'drag', width: 40} as T, ...columns]
  }

  const isDragCell = (column: {key?: string | number}) =>
    Boolean(options.drag.value && column.key === 'drag')

  return {
    tableOnRow,
    applyDragColumn,
    isDragCell,
    onDragHandleStart,
    onDragHandleEnd,
    syncPlacementBaseline,
  }
}
