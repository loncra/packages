import {
  computed,
  defineComponent,
  type PropType,
  type SlotsType,
  type VNode,
  type VNodeChild,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {Pagination} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
} from '../_util/crud/useCollectionData'
import DataLoadingCard from '../data-loading-card'
import ActionButton from '../action-button'
import {useBasicCrudQuery} from './useBasicCrudQuery'
import {useCrudActions} from './useCrudActions'
import type {
  BasicCrudQueryConstructor,
  BasicCrudQueryExpose,
  BasicCrudQueryProps,
  BasicCrudQuerySelectedKey,
  BasicCrudQuerySlots,
  EnumBucketRequest,
  PageDictionaries,
} from './types'

const BasicCrudQuery = defineComponent({
  name: 'LBasicCrudQuery',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<BasicCrudQueryProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<BasicCrudQueryProps['refreshOnActivate']>,
      default: true,
    },
    title: {type: [Object, Boolean] as PropType<VNode | boolean>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<BasicCrudQueryProps['authority']>,
    toolbarActions: {
      type: [Array, Boolean] as PropType<BasicCrudQueryProps['toolbarActions']>,
      default: undefined,
    },
    recordActions: {
      type: [Array, Boolean] as PropType<BasicCrudQueryProps['recordActions']>,
      default: undefined,
    },
    plain: {type: Boolean, default: false},
    fetch: {type: Function as PropType<BasicCrudQueryProps['fetch']>, default: undefined},
    selectedKey: {type: String as PropType<BasicCrudQuerySelectedKey>, default: 'selectedRows'},
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {type: Object as PropType<FilterRequest | PageRequest>, default: () => ({})},
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    selectedItems: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    enums: Array as PropType<EnumBucketRequest[]>,
    dictionaryCodes: Array as PropType<(string | undefined)[]>,
    buckets: {type: Object as PropType<EnumBucketsResponseBody>, default: () => ({})},
    dictionaries: {type: Object as PropType<PageDictionaries>, default: () => ({})},
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<BasicCrudQueryProps['classes']>,
    styles: Object as PropType<BasicCrudQueryProps['styles']>,
  },
  emits: [
    'update:dataSource',
    'update:loading',
    'update:query',
    'update:selectedRows',
    'update:selectedItems',
    'update:pagination',
    'update:buckets',
    'update:dictionaries',
    'action',
    'add',
    'edit',
    'detail',
    'deleted',
  ],
  slots: Object as SlotsType<BasicCrudQuerySlots>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number

    const {
      message,
      modal,
      locale,
      crudConfig,
      auth,
      resolver,
      prefixCls,
      hashId,
      cssVarCls,
      dataSource,
      loading,
      query,
      pagination,
      selected,
      collection,
      onPageChange,
      onPlanMounted,
      onPlanActivated,
    } = useBasicCrudQuery(props, {emit})

    const {toolbarActions, needsBulkSelection, resolveRecordActions, onRecordAction, hasRecordActions} =
      useCrudActions(props, {
        emit,
        locale,
        auth,
        resolver,
        app: {message, modal, collection},
        dataSource,
        selected,
        query,
      })

    expose<BasicCrudQueryExpose<TEntity, TId>>({
      ...collection,
      resolveRecordActions,
      onRecordAction,
      get hasRecordActions() {
        return hasRecordActions.value
      },
      get needsBulkSelection() {
        return needsBulkSelection.value
      },
    })

    const contentTitle = computed<VNodeChild>(() => {
      if (props.title === false) {
        return undefined
      }
      if (slots.title) {
        return slots.title()
      }
      return props.title == null
        ? (crudConfig.value.resolveDefaultTitle?.() ?? undefined)
        : props.title
    })

    function contentExtra(): VNodeChild {
      if (props.title === false || props.toolbarActions === false) {
        return undefined
      }
      return slots.extra ? slots.extra() : <ActionButton actions={toolbarActions.value} />
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <DataLoadingCard
          {...(rest as Record<string, unknown>)}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle}
          classes={{card: props.classes?.card, spin: props.classes?.spin}}
          styles={{card: props.styles?.card, spin: props.styles?.spin}}
          loading={loading.value}
          onUpdate:loading={(value: boolean) => (loading.value = value)}
          onMounted={onPlanMounted}
          onActivated={onPlanActivated}
          plain={props.plain}
          title={props.title}
          v-slots={{
            title: !props.plain && slots.title ? () => slots.title?.() : undefined,
            extra: props.plain ? undefined : () => contentExtra(),
            default: () => (
              <>
                {slots.default?.({
                  title: props.plain ? contentTitle.value : undefined,
                  extra: props.plain ? contentExtra() : undefined,
                })}
                {pagination.value === false ? null : (
                  <Pagination
                    class={classNames(
                      prefixCls.value,
                      hashId.value,
                      cssVarCls.value,
                      `${prefixCls.value}-pagination`,
                    )}
                    {...(pagination.value as Record<string, unknown>)}
                    {...(props.classes?.pagination ? {classes: props.classes.pagination} : {})}
                    {...(props.styles?.pagination ? {styles: props.styles.pagination} : {})}
                    onChange={onPageChange}
                  />
                )}
              </>
            ),
          }}
        />
      )
    }
  },
}) as unknown as BasicCrudQueryConstructor

export default BasicCrudQuery
