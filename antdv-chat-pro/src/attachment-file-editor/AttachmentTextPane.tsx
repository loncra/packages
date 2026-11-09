import {computed, defineComponent, type PropType} from 'vue'
import {Empty, Flex, Spin} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {FileTextCodeEditor} from '../file-view'
import {useLocale} from '../_util/useLocale'
import type {AttachmentTextPaneProps} from './types'
import {useAttachmentText} from './useAttachmentText'
import useStyle from './style'

const AttachmentTextPane = defineComponent({
  name: 'LAttachmentTextPane',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<AttachmentTextPaneProps['node']>,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    prefixCls: {
      type: String,
      required: true,
    },
    register: {
      type: Function as PropType<AttachmentTextPaneProps['register']>,
      required: true,
    },
  },
  setup(props) {
    const locale = useLocale('FileView')
    const prefixCls = computed(() => props.prefixCls)
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const text = useAttachmentText({
      node: () => props.node,
      bucket: () => props.bucket,
      register: props.register,
    })

    return () => (
      <Spin
        spinning={text.loading.value}
        class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-full-spin`)}
      >
        <div class={classNames(hashId.value, `${prefixCls.value}-pane`)}>
          {!text.ready.value ? null : text.failed.value ? (
            <Flex
              class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-pane`)}
              align="center"
              justify="center"
            >
              <Empty description={locale.value.unsupported} />
            </Flex>
          ) : (
            <FileTextCodeEditor
              ext={text.context.value.ext}
              readonly={false}
              modelValue={text.content.value}
              prefixCls={prefixCls.value}
              hashId={hashId.value}
              cssVarCls={cssVarCls.value}
              onUpdate:modelValue={text.setContent}
            />
          )}
        </div>
      </Spin>
    )
  },
})

export default AttachmentTextPane
