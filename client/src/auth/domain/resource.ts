import type {ResourceMetadata} from '../../commons'

export type {ResourceEntity, ResourceMetadata, ResourceSavePayload} from '../../commons'

export interface RouteResourceMetadata extends ResourceMetadata {
  path: string
  fixed: boolean
  deactivatedClose: boolean
  single: boolean
  route: string | symbol | null | undefined
  badge?: boolean
  dynamicTitle: boolean
  parentKeepAlive?: string | unknown
}
