import {h} from 'vue'
import {Space, Tooltip} from 'antdv-next'
import {IconSelect, ICON_SELECT_AVATAR_MODE_VALUE, type IconSelectProps} from '@loncra/antdv'
import {
  EXECUTE_STATUS_TYPE,
  getEnumName,
  getEnumValue,
  type NameValueEnumMetadata,
} from '@loncra/client/commons'

/**
 * 纯格式化 + **单元格渲染**都在这一个文件里（单函数不单独建文件）。
 *
 * 字节大小过去在 `@loncra/client/commons`、宿主 `utils/fileUtils.ts` 各有一份 —— 现在**只留这一份**，
 * 宿主那边改成从 pro 转出。
 */

/**
 * 用实际数量替换文案里的 `{count}` 占位符
 *
 * @param template - 含 `{count}` 占位符的文案
 * @param count - 实际数量
 */
export function withCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

/**
 * 格式化字节大小为可读的字符串：按 1024 进制换算成合适的单位（bytes / KB / MB / GB …）。
 *
 * @example
 * ```typescript
 * byteFormat(1024) // "1 KB"
 * byteFormat(1536) // "1.5 KB"
 * byteFormat(1048576) // "1 MB"
 * ```
 */
export function byteFormat(bytes: number): string {
  // 检查输入是否为有效数字
  if (isNaN(bytes)) {
    return ''
  }
  // 单位数组
  const symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  // 计算对数值以确定使用哪个单位（以 2 为底）
  let exp = Math.floor(Math.log(bytes) / Math.log(2))
  if (exp < 1) {
    exp = 0
  }
  // 确定单位索引（每 10 位对应对数表示一个单位）
  const i = Math.floor(exp / 10)
  // 转换为对应单位的数值
  let formattedBytes = bytes / Math.pow(2, 10 * i)

  // 如果小数部分过长，保留两位小数
  if (formattedBytes.toString().length > formattedBytes.toFixed(2).toString().length) {
    formattedBytes = Number(formattedBytes.toFixed(2))
  }
  return formattedBytes + ' ' + symbols[i]
}

// #region 单元格渲染：同一个值在不同取值下画不同内容

/**
 * 图标怎么画由**宿主注入**：包不认宿主的 `IconFont` 组件，也不替业务决定画哪个图标。
 * 类型直接复用 `IconSelect` 的 `iconRender`（同一个口径，不另造一份）。
 */
export type IconRender = NonNullable<IconSelectProps['iconRender']>

/** 带执行状态的记录（`BatchMessageEntity`、导出记录都是这个形状） */
export interface ExecuteStatusRecord {
  executeStatus?: NameValueEnumMetadata<number> | number
  exception?: string
}

/**
 * 执行状态单元格：状态名 +（失败时）一个图标、悬浮显示异常信息。
 *
 * 图标的**类型与渲染**都由宿主给（`iconType` + `renderIcon`），
 * 包只负责布局（图标 + 文本）和"哪个值算失败"这个判断。
 */
export function executeStatusCell(options: {
  renderIcon: IconRender
  iconType: string
  failureValue?: number
}) {
  const failure = options.failureValue ?? EXECUTE_STATUS_TYPE.FAILURE
  // ⚠️ 给**组件**传 children 必须走 slots（`{default: () => [...]}`）：直接传数组会被 Vue 认成
  // "非函数 default 槽"并每格 warn 一次（`normalizeVNodeSlots`）—— 表格里就是"很多警告"。
  return (_value: unknown, record: ExecuteStatusRecord) =>
    h(Space, null, {
      default: () => [
        getEnumValue(record.executeStatus) === failure
          ? h(
              Tooltip,
              {title: record.exception},
              {default: () => options.renderIcon(options.iconType, 'align')},
            )
          : null,
        getEnumName(record.executeStatus),
      ],
    })
}

/**
 * 图标 + 名称单元格（企业 / 插件 / 技能包那一列都长这样）。
 * 没图标时退化为名称首字（`IconSelect` 的 `INPUT` 形态）。
 */
export function iconNameCell<TRecord>(options: {
  renderIcon: IconRender
  nameOf: (record: TRecord) => string
  iconOf?: (record: TRecord) => string | undefined
}) {
  return (_value: unknown, record: TRecord) => {
    const name = options.nameOf(record)
    // 同上：组件的 children 走 slots，别直接给数组
    return h(Space, null, {
      default: () => [
        h(IconSelect, {
          preview: true,
          iconRender: options.renderIcon,
          value: options.iconOf?.(record) || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + name,
        }),
        name,
      ],
    })
  }
}

// #endregion
