import type {NameValueEnumMetadata} from './common.ts'

export interface DataDictionaryMetadata extends NameValueEnumMetadata<string | number | boolean | null>{
  code: string
  parentId?: number
  valueType: NameValueEnumMetadata<number> | number
  level?: string
  children?: DataDictionaryMetadata[]
  metadata?: Record<string, unknown>
}
