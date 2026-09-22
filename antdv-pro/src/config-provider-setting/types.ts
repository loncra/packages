export interface ConfigProviderSettingProps {
  /**
   * 语言下拉的数据（不传就不渲染"语言"这一项）。
   * 切换只改配置里的 `state.locale`，**同步 i18n / dayjs 归宿主**（pro 不引 vue-i18n）。
   */
  locales?: {name: string; value: string}[]
}

export interface ConfigProviderSettingSlots {
  /** 宿主自己的配置项（首页侧栏宽度、创建成功后的行为…），插在顶部那一排 */
  extra?: () => unknown
}
