const mongoose = require('mongoose');

// 채팅방 스키마: 그룹방 기본 메타데이터와 최근 메시지 요약 정보를 보관한다.
const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isGroup: {
      type: Boolean,
      default: true,
    },
    // 이번 단계에서는 사용자 식별자 문자열을 직접 저장한다.
    memberIds: {
      type: [String],
      default: [],
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ChatRoom = mongoose.models.ChatRoom || mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
