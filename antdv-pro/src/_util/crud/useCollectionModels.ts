import type {Ref} from 'vue'
import type {TableProps} from 'antdv-next'
import {type ModelEmit, useTwoWayModel} from '@loncra/antdv'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {DefaultCrudEntity} from './useCollectionData'

interface CollectionModelProps {
  dataSource?: DefaultCrudEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  pagination?: TableProps['pagination']
}

export function useCollectionModels<P extends CollectionModelProps>(props: P, emit: ModelEmit) {
  return {
    dataSource: useTwoWayModel(props, 'dataSource', emit) as unknown as Ref<DefaultCrudEntity[]>,
    loading: useTwoWayModel(props, 'loading', emit) as unknown as Ref<boolean>,
    query: useTwoWayModel(props, 'query', emit) as unknown as Ref<FilterRequest | PageRequest>,
    pagination: useTwoWayModel(props, 'pagination', emit) as unknown as Ref<
      TableProps['pagination']
    >,
  }
}
