import {defineComponent, h, type PropType} from 'vue'
import {Button, Input, SpaceCompact} from 'antdv-next'
import {CheckOutlined, CloseOutlined} from '@antdv-next/icons'
import type {AttachmentRenameTitleProps} from './types'

const AttachmentRenameTitle = defineComponent({
  name: 'LAttachmentRenameTitle',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<AttachmentRenameTitleProps['node']>,
      required: true,
    },
    onCommit: {
      type: Function as PropType<AttachmentRenameTitleProps['onCommit']>,
      required: true,
    },
    onCancel: {
      type: Function as PropType<AttachmentRenameTitleProps['onCancel']>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div
        onClick={(event: Event) => event.stopPropagation()}
        onMousedown={(event: Event) => event.stopPropagation()}
      >
        <SpaceCompact size="small" block>
          <Input
            value={props.node.editName}
            onUpdate:value={(value: string) => {
              props.node.editName = value
            }}
            onPressEnter={() => {
              void props.onCommit(props.node)
            }}
          />
          <Button type="primary" onClick={() => props.onCommit(props.node)}>
            {{icon: () => h(CheckOutlined)}}
          </Button>
          <Button type="primary" danger onClick={() => props.onCancel(props.node)}>
            {{icon: () => h(CloseOutlined)}}
          </Button>
        </SpaceCompact>
      </div>
    )
  },
})

export default AttachmentRenameTitle
