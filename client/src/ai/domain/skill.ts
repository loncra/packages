import type {NameValueEnumMetadata, TimeProperties} from '../../commons'
import type {AI_SERVER_SKILL_SOURCE_TYPE} from '../enumerate.ts'
import type {PluginPackageMetadata} from './plugin.ts'

export type SkillSourceMetadataType =
  | typeof AI_SERVER_SKILL_SOURCE_TYPE.GIT
  | typeof AI_SERVER_SKILL_SOURCE_TYPE.MANUAL

export interface SkillSourceMetadata {
  type: SkillSourceMetadataType
}

export interface ManualSkillSourceMetadata extends SkillSourceMetadata {
  type: typeof AI_SERVER_SKILL_SOURCE_TYPE.MANUAL
}

export interface GitSkillSourceMetadata extends SkillSourceMetadata {
  type: typeof AI_SERVER_SKILL_SOURCE_TYPE.GIT
  url: string
  ref?: string
  sha?: string
  path?: string
}

export interface SkillPackageMetadata {
  source: SkillSourceMetadata
  updatePolicyTime?: TimeProperties
}

export interface SkillPackageSavePayload extends PluginPackageMetadata {
  latestVersion?: string
  defaultUpdatePolicy: NameValueEnumMetadata<number> | number
  sourceType?: NameValueEnumMetadata<number> | number
  metadata: SkillPackageMetadata
  executeStatus?: NameValueEnumMetadata<number> | number
}

export interface SkillPackageEntity extends SkillPackageSavePayload {}

export interface SkillPackageSnapshotPayload {
  releaseVersion: string
  changelog?: string
}

export interface SkillReleaseEntity {
  id?: number
  aiSkillPackageId?: number
  releaseVersion?: string
  changelog?: string
  releaseTime?: number
  enabled?: NameValueEnumMetadata<number> | number
}
