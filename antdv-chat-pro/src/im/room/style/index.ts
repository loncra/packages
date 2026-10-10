import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const IM_ROOM_PREFIX = 'loncra-im-room'

function genImRoomStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginXS, marginSM, fontSizeXL, lineHeightSM, calc} = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      [`${componentCls}-search`]: {
        flexShrink: 0,
        marginBottom: marginSM,
      },
      [`${componentCls}-members`]: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: marginXS,
        overflow: 'auto',
      },
      [`${componentCls}-empty`]: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      [`${componentCls}-member`]: {
        width: '3.125rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      [`${componentCls}-ribbon`]: {
        top: 0,
        opacity: 0.6,
        fontSize: calc(fontSizeXL).div(2).equal(),
        lineHeight:lineHeightSM,
      },
      [`${componentCls}-member-name`]: {
        display: 'block',
        maxWidth: '100%',
      },
      [`${componentCls}-add`]: {
        width: '3.125rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      },
      [`${componentCls}-settings`]: {
        flexShrink: 0,
      },
    },
  }
}

export default genStyleHooks('ImRoom', genImRoomStyle, {order: 1})
