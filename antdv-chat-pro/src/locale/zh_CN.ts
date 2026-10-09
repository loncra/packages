import type {Locale} from './index'

const locale: Locale = {
  locale: 'zh-CN',
  ImConversation: {
    search: '',
    draft: '草稿',
    mention: '{count}条消息中提到了你',
    mentionLine: '{principal} 在消息中提到了你',
    detail: '详情',
    pin: '置顶聊天',
    unpin: '取消置顶聊天',
    mute: '消息免打扰',
    unmute: '取消免打扰',
    delete: '删除',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
  },
  AgentConversation: {
    pluginMarket: '插件市场',
    workspaceTitle: '工作空间',
    workspacePlaceholder: '工作空间名称',
    createAgent: '创建智能体',
    rename: '修改名称',
    delete: '删除',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
  },
}

export default locale
