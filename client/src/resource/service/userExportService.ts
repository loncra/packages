import type {ExportDataMetadata} from '../../commons'
import {AttachmentService, FindRestfulCrudService} from '../../commons'

export class UserExportService extends FindRestfulCrudService<
  ExportDataMetadata,
  ExportDataMetadata
> {
  static get SERVICE_URL(): string {
    return AttachmentService.BASE_URL + '/user/export'
  }

  constructor() {
    super(UserExportService.SERVICE_URL)
  }
}
