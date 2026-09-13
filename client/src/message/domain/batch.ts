import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'

export interface BatchMessageEntity extends VersionEntityMetadata {
  completeTime: number
  executeStatus: NameValueEnumMetadata<number> | number
  exception?: string
  count: number
  successNumber: number
  failNumber: number
  sendingNumber: number
  type: NameValueEnumMetadata<number> | number
}
