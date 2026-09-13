import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'

export interface BasicMessageEntity extends VersionEntityMetadata {
  type: NameValueEnumMetadata<number> | number
  content: string
  retryCount?: number
  maxRetryCount?: number
  exception?: string
  successTime?: number
  executeStatus?: NameValueEnumMetadata<number> | number
  retryTime?: number
  remark: string
}

export interface BatchResponse {
  batchId: number
  count: number
}
