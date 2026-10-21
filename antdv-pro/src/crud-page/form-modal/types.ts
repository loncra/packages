import type {PublicProps, VNodeChild} from 'vue'
import type {BasicIdMetadata} from '@loncra/client/commons'
import type {CrudFormPageExpose, CrudFormPageProps, CrudFormPageSlots} from '../form/types'

export interface CrudFormModalProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> extends Omit<CrudFormPageProps<TId, TBody, TEntity>, 'title'> {
  open?: boolean
  title?: VNodeChild
  width?: string | number
}

export type CrudFormModalSlots<TBody extends object> = CrudFormPageSlots<TBody>

export type CrudFormModalExpose<TBody> = CrudFormPageExpose<TBody>

export type CrudFormModalConstructor = new <
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
>(
  props: CrudFormModalProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudFormModalProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudFormModalSlots<TBody>
} & CrudFormModalExpose<TBody>
