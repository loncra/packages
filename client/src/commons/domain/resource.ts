import type {BasicIdMetadata, NameValueEnumMetadata} from './common.ts'

export interface ResourceMetadata {
  name: string
  icon: string
  applicationName: string
  page: string
  sort: number
}

export interface ResourceSavePayload extends ResourceMetadata, BasicIdMetadata<number> {
  version: string
  remark?: string
  authority: string
  type: NameValueEnumMetadata<string> | string
  sources: NameValueEnumMetadata<string>[] | string[]
  category: NameValueEnumMetadata<number> | number
  enabled: NameValueEnumMetadata<number> | number
  parentId?: number
}

export interface ResourceEntity extends ResourceSavePayload {
  key: string
  code: string
  children?: ResourceEntity[]
}
