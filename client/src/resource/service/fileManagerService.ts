import type {ObjectItemInfo} from '../../commons'
import {AttachmentService, FindRestfulCrudService} from '../../commons'

export class FileManagerService extends FindRestfulCrudService<ObjectItemInfo, ObjectItemInfo> {
  constructor() {
    super(AttachmentService.BASE_URL)
  }
}
