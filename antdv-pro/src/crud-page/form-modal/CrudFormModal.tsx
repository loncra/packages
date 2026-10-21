import {defineComponent, h, type PropType, ref, type SlotsType, type VNodeChild} from 'vue'
import {Modal} from 'antdv-next'
import type {RestResult} from '@loncra/client/commons'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import CrudFormPage from '../form/CrudFormPage'
import type {CrudStaleInfo} from '../types'
import type {CrudFormPageExpose, CrudFormPageSlots} from '../form/types'
import type {CrudFormModalConstructor, CrudFormModalProps} from './types'

const CrudFormModal = defineComponent({
  name: 'LCrudFormModal',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudFormModalProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudFormModalProps['id']>, default: undefined},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
    open: {type: Boolean, default: undefined},
    title: {
      type: [String, Object, Array, Boolean] as PropType<CrudFormModalProps['title']>,
      default: undefined,
    },
    width: {type: [String, Number] as PropType<CrudFormModalProps['width']>, default: 520},
  },
  slots: Object as SlotsType<CrudFormPageSlots<DefaultCrudEntity>>,
  emits: {
    'update:open': (_value: boolean) => true,
    success: (_result: RestResult<unknown>) => true,
    resetFields: () => true,
    cancel: () => true,
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    const formRef = ref<CrudFormPageExpose<DefaultCrudEntity>>()

    function close(): void {
      emit('update:open', false)
    }

    function onCancel(): void {
      emit('cancel')
      close()
    }

    expose<CrudFormPageExpose<DefaultCrudEntity>>({
      get entity() {
        return formRef.value?.entity as DefaultCrudEntity
      },
      get buckets() {
        return formRef.value?.buckets ?? {}
      },
      get dictionaries() {
        return formRef.value?.dictionaries ?? {}
      },
      resetFields: () => formRef.value?.resetFields?.(),
    })

    return () => (
      <Modal
        {...(attrs as Record<string, unknown>)}
        open={!!props.open}
        width={props.width}
        footer={null}
        mask={{closable: false}}
        onCancel={onCancel}
        onUpdate:open={(value: boolean) => emit('update:open', value)}
        v-slots={{
          title:
            props.title == null || props.title === false
              ? undefined
              : () => props.title as VNodeChild,
        }}
      >
        {props.open
          ? h(
              CrudFormPage as never,
              {
                ref: formRef,
                plain: true,
                title: false,
                buttonAlign: 'end',
                page: props.page,
                id: props.id,
                contextExtra: props.contextExtra,
                variant: props.variant,
                onSuccess: (result: RestResult<unknown>) => emit('success', result),
                onResetFields: () => emit('resetFields'),
                onStale: (info: CrudStaleInfo) => emit('stale', info),
              },
              slots,
            )
          : null}
      </Modal>
    )
  },
}) as unknown as CrudFormModalConstructor

export default CrudFormModal
