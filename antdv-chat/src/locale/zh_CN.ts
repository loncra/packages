import type {Locale} from './index'

const locale: Locale = {
  locale: 'zh-CN',
  EmojiButton: {
    smileys_emotion: '笑脸与情感',
    animals_nature: '动物与自然',
    food_drink: '食物与饮品',
    travel_places: '旅行与地点',
    activities: '活动',
    objects: '物品',
  },
  // 照抄宿主 `common.noMore` / `chat.view.readable.systemMessage`（2026-10-03 迁入包 locale）
  BubbleList: {
    noMore: '没有更多的数据了',
    readableSystemMessage: '以下为最早未读消息',
  },
  // 照抄宿主 `common.me` / `chat.view.placeholder.*`（2026-10-03 迁入包 locale）
  ChatView: {
    me: '我',
    placeholder: '输入消息，可粘贴文件到此处发送文件内容',
    placeholderExitRoom: '您已退出本群',
    placeholderRoomRemove: '您已被本群移除',
    placeholderDisbandRoom: '本群已解散',
  },
  // 照抄宿主 `chat.conversation.*` / `chat.view.*Undo` / `attachment.type.*`
  ConversationList: {
    draft: '草稿',
    mentionCount: '{count}条消息中提到了你',
    selfUndo: '您已撤回此消息',
    othersUndo: '该消息已撤销',
    fileImage: '图片',
    fileVideo: '视频',
    fileAudio: '音频',
    fileUnknown: '文件',
  },
}

export default locale
