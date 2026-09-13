import type {DataDictionaryMetadata, NameValueEnumMetadata, PageRequest, VersionEntityMetadata} from '../../commons'

export type {DataDictionaryMetadata}

export interface DataDictionarySavePayload extends DataDictionaryMetadata, VersionEntityMetadata {
  remark?: string
  value: string
  enabled: NameValueEnumMetadata<number> | number
  typeId: number
  sort?: number
}

export interface DataDictionaryEntity extends DataDictionarySavePayload {}

export interface DictionaryTypeSavePayload extends VersionEntityMetadata {
  code: string
  name: string
  parentId?: number
  remark?: string
}

export interface DictionaryTypeEntity extends DictionaryTypeSavePayload {
  children: DictionaryTypeEntity[]
}

export interface DataDictionaryQuery {
  query: PageRequest
}
