const mongoose = require('mongoose');

// 메시지 스키마: 채팅방 단위 대화 내역을 시간순으로 저장한다.
const messageSchema = new mongoose.Schema(
  {
    // ChatRoom의 ObjectId를 문자열로 저장한다.
    chatRoomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    senderId: {
      type: String,
      default: null,
      trim: true,
    },
    senderNickname: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;
