import type {
    BasicIdMetadata,
    DataDictionaryMetadata,
    NameValueEnumMetadata,
    VersionEntityMetadata,
} from '../../commons'
import type {ModelGenerateOptionKey} from '../constants/model.ts'

export type ModelGenerateOptions = Partial<
  Record<ModelGenerateOptionKey, number | string | boolean | null>
>

export interface ModelSettingManufacturerMetadata
  extends Pick<DataDictionaryMetadata, 'code' | 'name' | 'valueType' | 'metadata'> {
  value: string | number
}

export interface ModelSettingMetadata extends BasicIdMetadata<number> {
  name: string
  model: string
  metadata: {
    options?: ModelGenerateOptions
    [key: string]: unknown
  }
  manufacturer: ModelSettingManufacturerMetadata
}

export interface ModelSettingSavePayload extends ModelSettingMetadata, VersionEntityMetadata {
  icon: string | null
  type: NameValueEnumMetadata<number> | number
  enabled: NameValueEnumMetadata<number> | number
  remark: string
  description: string
  sort?: number
}

export interface ModelSettingEntity extends ModelSettingSavePayload {}
