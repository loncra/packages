import type {IdValueMetadata, NameValueEnumMetadata, ObjectWriteResult, VersionEntityMetadata,} from '../../commons'

export interface CarouselSavePayload extends VersionEntityMetadata {
  name: string
  type: NameValueEnumMetadata<number> | number
  link: IdValueMetadata<string, string>
  sort?: number
  expirationTime?: number
  showtime?: number
  cover?: ObjectWriteResult
  remark: string
}

export interface CarouselEntity extends CarouselSavePayload {
  status: NameValueEnumMetadata<number> | number
}
