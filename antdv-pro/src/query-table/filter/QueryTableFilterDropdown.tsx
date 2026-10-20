import {defineComponent, h, type PropType} from 'vue'
import {Button, Space, SpaceCompact} from 'antdv-next'
import {DeleteOutlined, SearchOutlined, UndoOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {FilterRequest} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'
import type {ColumnSearchConfig} from '../types'

const QueryTableFilterDropdown = defineComponent({
  name: 'LQueryTableFilterDropdown',
  inheritAttrs: false,
  props: {
    prefixCls: {type: String, required: true},
    hashId: String,
    cssVarCls: String,
    search: {type: Object as PropType<ColumnSearchConfig>, required: true},
    query: {type: Object as PropType<FilterRequest>, required: true},
    locale: {type: Object as PropType<CrudLocale>, required: true},
    onUpdateValue: Function as PropType<(value: unknown) => void>,
    onSearch: Function as PropType<() => void>,
    onReset: Function as PropType<() => void>,
    onClear: Function as PropType<() => void>,
    onEnter: Function as PropType<(event: KeyboardEvent) => void>,
  },
  setup(props) {
    return () => {
      const SearchComponent = props.search.component
      if (!SearchComponent) {
        return null
      }
      const value = props.query[props.search.queryName ?? '']
      return (
        <div
          class={classNames(
            props.prefixCls,
            props.hashId,
            props.cssVarCls,
            `${props.prefixCls}-filter-dropdown`,
          )}
          onKeydown={(e: KeyboardEvent) => {
            e.stopPropagation()
            props.onEnter?.(e)
          }}
        >
          <Space orientation="vertical">
            {h(SearchComponent, {
              ...(props.search.props ?? {}),
              value,
              'onUpdate:value': (next: FilterRequest[string]) => props.onUpdateValue?.(next),
            })}
            <SpaceCompact block>
              <Button
                block
                type="primary"
                onClick={() => props.onSearch?.()}
                v-slots={{icon: () => h(SearchOutlined)}}
              >
                <span>{props.locale.search}</span>
              </Button>
              <Button block onClick={() => props.onReset?.()} v-slots={{icon: () => h(UndoOutlined)}}>
                <span>{props.locale.reset}</span>
              </Button>
              <Button block onClick={() => props.onClear?.()} v-slots={{icon: () => h(DeleteOutlined)}}>
                <span>{props.locale.clear}</span>
              </Button>
            </SpaceCompact>
          </Space>
        </div>
      )
    }
  },
})

export default QueryTableFilterDropdown
