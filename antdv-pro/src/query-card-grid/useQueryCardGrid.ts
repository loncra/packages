import {computed, type Ref, ref} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, type ModelEmit, useTwoWayModel} from '@loncra/antdv'
import type {BasicCrudQueryClasses, BasicCrudQueryExpose, BasicCrudQueryStyles,} from '../basic-crud-query/types'
import type {DefaultCrudEntity} from '../_util/crud/useCollectionData'
import {resolveRowKey} from '../_util/crud/rowKey'
import {type DragProp, isDragEnabled} from '../_util/crud/useDrag'
import {useCollectionModels} from '../_util/crud/useCollectionModels'
import {useFlatDragDrop} from '../_util/crud/useFlatDragDrop'
import useStyle from './style'
import type {QueryCardGridProps} from './types'

export function useQueryCardGrid(
  props: QueryCardGridProps<string | number, DefaultCrudEntity, DefaultCrudEntity>,
  emit: ModelEmit,
) {
  const config = useConfig()
  const prefixCls = computed(() =>
    config.value.getPrefixCls('query-card-grid', props.prefixCls ?? 'loncra-query-card-grid'),
  )
  const [hashId, cssVarCls] = useStyle(prefixCls)
  const base = ref<BasicCrudQueryExpose<DefaultCrudEntity, string | number>>()
  const {
    dataSource,
    loading,
    query,
    pagination: tablePagination,
  } = useCollectionModels(props, emit)
  const selectedItems = useTwoWayModel(props, 'selectedItems', emit) as unknown as Ref<DefaultCrudEntity[]>

  const baseClasses = computed<BasicCrudQueryClasses>(() => ({
    card: props.classes?.card,
    spin: props.classes?.spin,
    pagination: props.classes?.pagination,
  }))
  const baseStyles = computed<BasicCrudQueryStyles>(() => ({
    card: props.styles?.card,
    spin: props.styles?.spin,
    pagination: props.styles?.pagination,
  }))

  const dragPreview = computed((): DragProp<DefaultCrudEntity> | undefined =>
    typeof props.drag === 'object' ? props.drag.dragPreview : props.drag,
  )
  const dragEnabled = computed(() => isDragEnabled(dragPreview.value))
  const ghostClass = computed(() =>
    classNames(prefixCls.value, hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
  )
  const dropClassPrefix = computed(() => classNames(hashId.value, prefixCls.value))

  const {onDragHandleStart, onDragHandleEnd, buildDropZoneProps, dropTargetClass} = useFlatDragDrop<
    DefaultCrudEntity,
    string | number
  >({
    drag: dragPreview,
    idKey: (typeof props.rowKey === 'string' ? props.rowKey : undefined) as
      | (keyof DefaultCrudEntity & string)
      | undefined,
    dataSource,
    direction: typeof props.drag === 'object' ? props.drag.direction : 'horizontal',
    ghostClass,
    dropClassPrefix,
    onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
      emit('drop', sorts, target, fromIndex, toIndex),
  })

  function isSelected(record: DefaultCrudEntity) {
    const id = resolveRowKey(props.rowKey, record)
    return selectedItems.value.some((item) => resolveRowKey(props.rowKey, item) === id)
  }

  function onSelect(record: DefaultCrudEntity) {
    if (!props.selectable) {
      return
    }
    if (isSelected(record)) {
      const id = resolveRowKey(props.rowKey, record)
      selectedItems.value = selectedItems.value.filter(
        (item) => resolveRowKey(props.rowKey, item) !== id,
      )
    } else {
      selectedItems.value = [...selectedItems.value, record]
    }
  }

  function itemActionsOf(record: DefaultCrudEntity) {
    return base.value?.resolveRecordActions(record) ?? []
  }

  return {
    prefixCls,
    hashId,
    cssVarCls,
    base,
    dataSource,
    loading,
    query,
    tablePagination,
    selectedItems,
    baseClasses,
    baseStyles,
    dragEnabled,
    buildDropZoneProps,
    dropTargetClass,
    isSelected,
    onSelect,
    itemActionsOf,
    onDragHandleStart,
    onDragHandleEnd,
  }
}
