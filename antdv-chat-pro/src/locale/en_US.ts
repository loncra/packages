import type {Locale} from './index'

const locale: Locale = {
  locale: 'en-US',
  ImConversation: {
    search: '',
    draft: 'Draft',
    mention: '{count} mentioned you in the message',
    mentionLine: '{principal} mentioned you in the message',
    detail: 'Details',
    pin: 'Pin chat',
    unpin: 'Unpin chat',
    mute: 'Mute notifications',
    unmute: 'Unmute notifications',
    delete: 'Delete',
    deleteConfirmTitle: 'Confirm deletion',
    deleteConfirmSingle: 'Are you sure you want to delete this record?',
  },
  AgentConversation: {
    pluginMarket: 'Plugin Hub',
    workspaceTitle: 'Workspace',
    workspacePlaceholder: 'Workspace name',
    createAgent: 'Create agent',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirmTitle: 'Confirm deletion',
    deleteConfirmSingle: 'Are you sure you want to delete this record?',
  },
}

export default locale
