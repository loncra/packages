import {defineComponent, h, type PropType} from 'vue'
import {Button, Tooltip} from 'antdv-next'
import {SaveOutlined} from '@antdv-next/icons'
import type {AttachmentSaveButtonProps} from './types'

const AttachmentSaveButton = defineComponent({
  name: 'LAttachmentSaveButton',
  inheritAttrs: false,
  props: {
    entry: {
      type: Object as PropType<AttachmentSaveButtonProps['entry']>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <Tooltip title={props.label}>
        <Button size="small" onClick={() => props.entry.save()}>
          {{icon: () => h(SaveOutlined)}}
        </Button>
      </Tooltip>
    )
  },
})

export default AttachmentSaveButton
