import type {FormProps, TabsProps} from 'antdv-next'

export interface ConfigProviderSettingProps {
  locales?: {name: string; value: string}[]
  classes?: ConfigProviderSettingClasses
  styles?: ConfigProviderSettingStyles
}

export interface ConfigProviderSettingSlots {
  extra?: () => unknown
}

export interface ConfigProviderSettingClasses {
  form?: FormProps['classes']
  tabs?: TabsProps['classes']
}

export interface ConfigProviderSettingStyles {
  form?: FormProps['styles']
  tabs?: TabsProps['styles']
}
