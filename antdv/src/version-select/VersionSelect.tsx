import {computed, defineComponent, type PropType} from 'vue'
import type {SelectProps} from 'antdv-next'
import {Badge, Button, Select, SpaceAddon, SpaceCompact, Tooltip, Typography} from 'antdv-next'
import {ArrowUpOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '../_util/classNames'
import {useFormItemTrigger} from '../_util/useFormItemTrigger'
import {useLocale} from '../_util/context/useLocale'
import {pickLatest} from './versionSelectKinds'
import useStyle from './style'
import type {VersionSelectClasses, VersionSelectStyles} from './types'

const VersionSelect = defineComponent({
  name: 'LVersionSelect',
  inheritAttrs: false,
  props: {
    value: {type: String},
    options: {type: Array as PropType<SelectProps['options']>, default: () => []},
    disabled: {type: Boolean},
    separator: {type: String, default: ' → '},
    prefixCls: {type: String},
    rootClass: {type: String},
    classes: {type: Object as PropType<VersionSelectClasses>},
    styles: {type: Object as PropType<VersionSelectStyles>},
  },
  emits: ['update:value', 'change', 'upgrade'],
  setup(props, {attrs, emit}) {
    const locale = useLocale('VersionSelect')
    useFormItemTrigger(() => props.value)
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('version-select', props.prefixCls ?? 'loncra-version-select'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const latest = computed(() => pickLatest(props.options))
    const outdated = computed(() =>
      props.value != null && latest.value != null && props.value !== latest.value,
    )

    function onChange(value: string): void {
      emit('update:value', value)
      emit('change', value)
    }

    function onUpgrade(): void {
      if (latest.value != null) {
        emit('upgrade', latest.value)
      }
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const classes = props.classes ?? {}
      const styles = props.styles ?? {}
      const scope = classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass)
      const rootClass = classNames(scope, classes.root, attrClass)
      const rootStyle = styles.root ? ([styles.root, attrStyle] as never) : (attrStyle as never)
      const prefix = prefixCls.value

      return (
        <Badge dot={outdated.value} class={rootClass} style={rootStyle}>
          <SpaceCompact>
            <Select
              value={props.value ?? latest.value}
              disabled={props.disabled}
              size="small"
              class={classNames(hashId.value, `${prefix}-select`, classes.select)}
              style={styles.select}
              classes={classes.select}
              options={props.options}
              onChange={onChange}
              {...rest}
            />
            {outdated.value ? (
              <>
                <SpaceAddon>{props.separator}</SpaceAddon>
                <SpaceAddon>
                  <Typography.Text
                    type="warning"
                    class={classNames(hashId.value, `${prefix}-latest`, classes.latest)}
                    style={styles.latest}
                  >
                    {latest.value}
                  </Typography.Text>
                </SpaceAddon>
                <Tooltip title={locale.value.upgrade}>
                  <Button
                    size="small"
                    type="primary"
                    onClick={onUpgrade}
                    class={classNames(hashId.value, `${prefix}-upgrade`, classes.upgrade)}
                    style={styles.upgrade}
                    v-slots={{icon: () => <ArrowUpOutlined/>}}
                  />
                </Tooltip>
              </>
            ) : null}
          </SpaceCompact>
        </Badge>
      )
    }
  },
})

export default VersionSelect
