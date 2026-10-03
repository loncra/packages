import type {Locale} from './index'

const locale: Locale = {
  locale: 'en-US',
  EmojiButton: {
    smileys_emotion: 'Smileys & Emotion',
    animals_nature: 'Animals & Nature',
    food_drink: 'Food & Drink',
    travel_places: 'Travel & Places',
    activities: 'Activities',
    objects: 'Objects',
  },
  BubbleList: {
    noMore: 'No more data available',
    readableSystemMessage: 'The following are the earliest unread messages',
    undoMessageValue: 'This message has been undone',
    undoTime: 'Undone at {time}',
  },
  ChatView: {
    me: 'Me',
    everyone: 'Everyone',
    placeholder: 'Type a message; paste files here to send attachments',
    placeholderExitRoom: 'You have left this group',
    placeholderRoomRemove: 'You were removed from this group',
    placeholderDisbandRoom: 'This group has been disbanded',
    reference: 'Reference',
    selfUndo: 'You have undone this message',
    reedit: 'Re-edit',
    undoConfirmTitle: 'Undo confirmation',
    undoConfirmContent: 'Are you sure you want to undo this message?',
    undoAction: 'Undo',
    undoCountdown: '(Cannot be undone after s seconds)',
  },
  ConversationList: {
    draft: 'Draft',
    mentionCount: '{count} mentioned you in the message',
    selfUndo: 'You have undone this message',
    othersUndo: 'This message has been undone',
    fileImage: 'Image',
    fileVideo: 'Video',
    fileAudio: 'Audio',
    fileUnknown: 'File',
  },
}

export default locale
