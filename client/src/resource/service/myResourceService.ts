import type {ObjectItemInfo} from '../../commons'
import {AttachmentService, FindRestfulCrudService} from '../../commons'

export class MyResourceService extends FindRestfulCrudService<ObjectItemInfo, ObjectItemInfo> {
  static get SERVICE_URL(): string {
    return AttachmentService.BASE_URL + '/my'
  }

  constructor() {
    super(AttachmentService.BASE_URL)
  }
}
