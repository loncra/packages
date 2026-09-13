import {
  formUrlEncoded,
  PageRestfulCrudService,
  type RestResult,
  SYSTEM_MODULE_NAME,
  type TotalPage,
  type TreeSortMetadata,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {CarouselEntity, CarouselSavePayload} from '../domain/carousel.ts'

export class CarouselService extends PageRestfulCrudService<
  CarouselSavePayload,
  CarouselEntity,
  TotalPage<CarouselEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER)
  }

  static get SERVICE_URL(): string {
    return CarouselService.BASE_URL + '/carousel'
  }

  static get SERVICE_RELEASE(): string {
    return CarouselService.SERVICE_URL + '/release'
  }

  static get SERVICE_REVOKE(): string {
    return CarouselService.SERVICE_URL + '/revoke'
  }

  static get SERVICE_SORT(): string {
    return CarouselService.SERVICE_URL + '/sort'
  }

  constructor() {
    super(CarouselService.SERVICE_URL)
  }

  sort(sorts: TreeSortMetadata<number>[]): Promise<RestResult<void>> {
    return http().request({
      url: CarouselService.SERVICE_SORT,
      method: 'PUT',
      data: sorts,
      bodyType: 'json',
    })
  }

  release(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: CarouselService.SERVICE_RELEASE,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  revoke(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: CarouselService.SERVICE_REVOKE,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }
}
