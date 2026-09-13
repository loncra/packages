import {PageSearchRestfulService, SYSTEM_MODULE_NAME, type TotalPage} from '../../commons'
import {modulePrefix} from '../../http'
import type {PersonalUserEntity} from '../domain/personalUser.ts'

export class PersonalUserService extends PageSearchRestfulService<
  PersonalUserEntity,
  TotalPage<PersonalUserEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return PersonalUserService.BASE_URL + '/personal/user'
  }

  constructor() {
    super(PersonalUserService.SERVICE_URL)
  }
}
