import {computed, defineComponent, onMounted, type PropType, ref} from 'vue'
import {Select} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {AuthServerService} from '@loncra/client/auth'
import type {PlatformUser} from '@loncra/client/auth'
import {
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  type IdNameValueMetadata,
  type NameValueEnumMetadata,
  type PageRequest,
  type RestResult,
} from '@loncra/client/commons'
import {ResourceServerService} from '@loncra/client/resource'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useLocale} from '../_util/useLocale'

interface UserSelectOption {
  label?: string
  value?: string | number
  options?: UserSelectOption[]
  payload?: PlatformUser
  data?: {
    payload?: PlatformUser
    label?: string
  }
}

export interface UserSelectProps {
  value?: string | string[]
  ignoreTypes?: string[]
  valueField?: keyof PlatformUser
  compactButton?: boolean
  query?: Record<string, string>
  mode?: 'multiple' | 'tags'
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface UserSelectEmits {
  'update:value': (value: string | string[]) => void
  change: (value: string, option: Record<string, unknown>) => void
}

export interface UserSelectSlots {
  optionRender?: (ctx: {option: UserSelectOption}) => unknown
  popupRender?: (ctx: {menu: unknown}) => unknown
  labelRender?: (ctx: Record<string, unknown>) => unknown
  tagRender?: (ctx: Record<string, unknown>) => unknown
}

const UserSelect = defineComponent({
  name: 'LUserSelect',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Array] as PropType<string | string[]>,
      default: () => [],
    },
    ignoreTypes: Array as PropType<string[]>,
    valueField: String as PropType<keyof PlatformUser>,
    compactButton: {
      type: Boolean,
      default: true,
    },
    query: Object as PropType<Record<string, string>>,
    mode: {
      type: String as PropType<'multiple' | 'tags'>,
      default: 'multiple',
    },
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:value': (_value: string | string[]) => true,
    change: (_value: string, _option: Record<string, unknown>) => true,
  },
  setup(props, {emit, slots, attrs}) {
    const locale = useLocale('UserSelect')
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('user-select', props.prefixCls ?? 'loncra-user-select'),
    )

    const userTypeOptions = ref<UserSelectOption[]>([])
    const loading = ref(false)
    const options = ref<UserSelectOption[]>([])
    const currentIgnoreTypes = ref<string[]>([])

    async function searchUser(value: string) {
      let searchData: UserSelectOption[] = []
      if (value !== '') {
        const param: PageRequest = {
          ...props.query || {},
          size: 10,
          number: 1,
          ignoreTypes: currentIgnoreTypes.value,
          idNameValueMetadata: true,
        }
        param['filter_[real_name_like]_or_[phone_number_eq]_or_[email_eq]_or_[id_eq]'] = value
        const result: RestResult<IdNameValueMetadata<PlatformUser[]>[]> =
          await AuthServerService.systemUsers(param)
        searchData = (result.data || []).map((d) => ({
          label: d.name,
          value: d.id,
          options: d.value.map((item) => ({
            label: AuthServerService.getPrincipalNameByUserDetails(item),
            value: item.systemName,
            payload: item,
          })),
        }))
      }
      options.value = [...userTypeOptions.value, ...searchData]
    }

    function onDeselect(value: string) {
      const userTypeOption = userTypeOptions.value.find((t) => t.value === value)
      if (userTypeOption && currentIgnoreTypes.value.includes(String(userTypeOption.value))) {
        currentIgnoreTypes.value = currentIgnoreTypes.value.filter(
          (v) => v !== String(userTypeOption.value),
        )
        void searchUser(value)
      }
    }

    function onSelect(value: string) {
      const userTypeOption = userTypeOptions.value.find((t) => t.value === value)
      if (userTypeOption && !currentIgnoreTypes.value.includes(String(userTypeOption.value))) {
        currentIgnoreTypes.value.push(String(userTypeOption.value))
        options.value = options.value.filter(
          (v) => !currentIgnoreTypes.value.includes(String(v.value)),
        )
      }
    }

    async function mounted() {
      const enums: RestResult<EnumBucketsResponseBody> =
        await ResourceServerService.getServiceEnumerates({
          [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [{id: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM}],
        })
      if (enums.data) {
        const userTypeOptionsData = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
          SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM
        ] as NameValueEnumMetadata<string>[] | undefined
        userTypeOptions.value = (userTypeOptionsData || []).map((v) => ({
          label: locale.value.all.replace('{name}', ' ' + v.name),
          value: v.value,
        }))
      }
      currentIgnoreTypes.value = [...(props.ignoreTypes || [])]
    }

    onMounted(() => {
      void mounted()
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const mergedStyle =
        attrStyle && typeof attrStyle === 'object'
          ? {width: '100%', ...(attrStyle as Record<string, unknown>)}
          : {width: '100%'}
      return (
        <Select
          {...rest}
          class={classNames(prefixCls.value, props.rootClass, attrClass)}
          style={mergedStyle as never}
          filterOption={false}
          maxTagCount="responsive"
          notFoundContent={loading.value ? undefined : null}
          mode={props.mode}
          showSearch
          value={props.value}
          options={options.value}
          onSelect={(value) => onSelect(String(value))}
          onDeselect={(value) => onDeselect(String(value))}
          onSearch={searchUser}
          onUpdate:value={(value) => emit('update:value', value as string | string[])}
          onChange={(value, option) =>
            emit('change', value as string, option as Record<string, unknown>)
          }
          v-slots={{
            optionRender: slots.optionRender
              ? (ctx: {option: UserSelectOption}) => slots.optionRender!(ctx)
              : ({option}: {option: UserSelectOption}) =>
                  AuthServerService.getPrincipalNameByUserDetails(
                    option.data?.payload,
                    option.data?.label,
                  ),
            popupRender: slots.popupRender
              ? (menu: unknown) => slots.popupRender!({menu})
              : undefined,
            labelRender: slots.labelRender,
            tagRender: slots.tagRender,
          }}
        />
      )
    }
  },
})

export default UserSelect
