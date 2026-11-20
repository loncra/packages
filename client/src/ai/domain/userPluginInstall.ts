import type {IdNameValueMetadata, IdValueMetadata, NameValueEnumMetadata} from '../../commons'
import type {McpPackageEntity} from './mcp.ts'
import type {SkillPackageEntity} from './skill.ts'
import type {ExecutionChannel} from '../enumerate.ts'



/** 卸载成功事件载荷（市场卡片上报，store 按 targetType + packageId 过滤） */
export interface UserPluginMetadata {
  targetType: string
  packageId: number
}

export interface UserPluginInstallMetadata {
  type: NameValueEnumMetadata<string> | string
}

/** 安装/卸载共用请求体（后端 UserPluginRequestBody） */
export interface UserPluginRequestBody extends UserPluginMetadata{
  /** 安装者范围；缺省 USER（个人用户） */
  scope?: number
  workspaceScope: number
  /** workspaceScope=SPECIFIED 时必填：目标工作空间（id + 执行通道） */
  workspaces?: IdValueMetadata<string, ExecutionChannel>[]
}

export interface UserPluginSkillMetadata extends UserPluginInstallMetadata{
  releaseVersion: string
  releaseId: number
  contentHash:string
  updatePolicy:NameValueEnumMetadata<number>| number
}

export interface UserPluginMcpMetadata extends UserPluginInstallMetadata{
  authMode:NameValueEnumMetadata<number> | number
  key:string;
}

export interface UserPluginInstallResult {
  id?: number
  targetType?: NameValueEnumMetadata<string> | string
  //packageId?: number
  workspaceScope?: NameValueEnumMetadata<number> | number
  status?: NameValueEnumMetadata<number> | number
  scope:NameValueEnumMetadata<number> | number
  /** 空间级安装：所属工作空间（id + 执行通道）；用户级/企业级安装为空 */
  workspace?: IdNameValueMetadata<ExecutionChannel>
  metadata: UserPluginInstallMetadata
  pluginPackage: McpPackageEntity | SkillPackageEntity
}
