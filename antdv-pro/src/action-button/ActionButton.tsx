import {defineComponent, h, type PropType} from 'vue'
import type {ButtonProps, ButtonSize} from 'antdv-next'
import {Button, Dropdown} from 'antdv-next'
import {EllipsisOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ResolvedAction} from '../_util/crud/actions'
import {useLocale} from '../_util/useLocale'
import {useActionButton} from './useActionButton'
import type {ActionButtonProps} from './types'

const ActionButton = defineComponent({
  name: 'LActionButton',
  inheritAttrs: false,
  props: {
    actions: {
      type: Array as PropType<ResolvedAction[]>,
      default: () => [],
    },
    size: {
      type: String as PropType<ButtonSize>,
      default: 'small',
    },
    alwaysDropdown: {
      type: Boolean,
      default: false,
    },
    type: String as PropType<ButtonProps['type']>,
    rootClass: String,
    classes: Object as PropType<ActionButtonProps['classes']>,
    styles: Object as PropType<ActionButtonProps['styles']>,
  },
  emits: {
    action: (_id: string) => true,
  },
  setup(props, {emit, attrs}) {
    const locale = useLocale('Crud')
    const {useDropdown, loneAction, menuItems, dispatchAction, onMenuClick} = useActionButton(
      props,
      emit,
    )

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const rootProps = {
        classes: props.classes?.button,
        styles: props.styles?.button,
        class: classNames(props.rootClass, attrClass),
        style: attrStyle,
      }

      if (useDropdown.value) {
        return (
          <Dropdown
            placement="bottomRight"
            menu={{items: menuItems.value, onClick: onMenuClick}}
            classes={props.classes?.dropdown}
            styles={props.styles?.dropdown}
          >
            <Button
              {...rest}
              {...rootProps}
              type={props.type}
              size={props.size}
              aria-label={(rest['aria-label'] as string | undefined) ?? locale.value.action}
              v-slots={{icon: () => h(EllipsisOutlined)}}
            />
          </Dropdown>
        )
      }

      const lone = loneAction.value
      if (!lone) {
        return null
      }

      return (
        <Button
          {...rest}
          {...rootProps}
          type={props.type}
          size={props.size}
          disabled={lone.disabled}
          loading={lone.loading}
          onClick={() => dispatchAction(lone)}
          v-slots={{icon: () => lone.icon}}
        >
          <span>{lone.label}</span>
        </Button>
      )
    }
  },
})

export default ActionButton
