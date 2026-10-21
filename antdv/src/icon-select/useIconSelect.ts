import {computed, type Ref, ref, watch} from 'vue'
import {type ModelEmit, useTwoWayModel} from '../_util/useTwoWayModel'
import {glyphType, parseAvatarModel, toAvatarModel} from './iconSelectKinds'
import type {IconfontJson, IconSelectAvatarModeValueType} from './types'

interface IconSelectSource {
  value: string
  options: IconfontJson[]
}

export function useIconSelect(props: IconSelectSource, emit: ModelEmit) {
  const modelValue = useTwoWayModel(props, 'value', emit) as unknown as Ref<string>

  const state = ref({
    search: {
      dataSource: [] as IconfontJson[],
      text: '',
    },
  })

  function search() {
    const keyword = state.value.search.text.trim().toLowerCase()
    if (keyword === '') {
      state.value.search.dataSource = props.options
      return
    }
    state.value.search.dataSource = props.options.map((icon) => ({
      ...icon,
      glyphs: icon.glyphs.filter((glyph) =>
        glyphType(icon, glyph).toLowerCase().includes(keyword),
      ),
    }))
  }

  function onSearch(value: string) {
    state.value.search.text = value
    search()
  }

  function glyphsOf(name: string) {
    const pack = state.value.search.dataSource.find((icon) => icon.name === name)
    if (!pack) {
      return []
    }
    return pack.glyphs.map((glyph) => ({
      key: glyph.icon_id,
      value: glyphType(pack, glyph),
    }))
  }

  const tabItems = computed(() =>
    state.value.search.dataSource.map((icon) => ({
      key: `${icon.name}::${state.value.search.text}`,
      packName: icon.name,
      label: icon.name,
    })),
  )

  const localAvatarType = ref<IconSelectAvatarModeValueType>(
    parseAvatarModel(props.value ?? '').type,
  )

  const avatarType = computed<IconSelectAvatarModeValueType>({
    get: () => {
      const {type, payload} = parseAvatarModel(modelValue.value ?? '')
      return payload ? type : localAvatarType.value
    },
    set: (type: IconSelectAvatarModeValueType) => {
      localAvatarType.value = type
      modelValue.value = toAvatarModel(type, parseAvatarModel(modelValue.value ?? '').payload)
    },
  })

  const avatarPayload = computed({
    get() {
      return parseAvatarModel(modelValue.value ?? '').payload
    },
    set(payload: string) {
      modelValue.value = toAvatarModel(avatarType.value, payload)
    },
  })

  function selectedPackName() {
    return props.options.find((icon) =>
      icon.glyphs.some((glyph) => glyphType(icon, glyph) === String(modelValue.value)),
    )?.name
  }

  watch(() => props.options, () => search(), {immediate: true})

  return {
    modelValue,
    tabItems,
    onSearch,
    glyphsOf,
    selectedPackName,
    avatarType,
    avatarPayload,
  }
}
