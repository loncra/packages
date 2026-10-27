import {h} from 'vue'
import {createFromIconfontCN} from '@antdv-next/icons'

const IconFont = createFromIconfontCN()

export function iconFontNode(type: string | undefined, attrs?: Record<string, unknown>) {
    if (!type) {
        return null
    }
    return h(IconFont, {type, ...attrs})
}
