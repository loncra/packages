import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genCrudFormPageStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginMD} = token

  return [
    {
      [`${componentCls}-operation-trace`]: {
        marginBottom: marginMD,
      },
    },
  ]
}

export default genStyleHooks('CrudFormPage', genCrudFormPageStyle, {order: 2})
