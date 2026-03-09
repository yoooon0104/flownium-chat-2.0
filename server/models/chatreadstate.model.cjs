const mongoose = require('mongoose');

// 사용자별 채팅방 읽음 시점을 저장한다.
// unread count는 마지막 읽음 시점 이후, 다른 사용자가 보낸 메시지 수로 계산한다.
const chatReadStateSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    lastReadAt: {
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

chatReadStateSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const ChatReadState =
  mongoose.models.ChatReadState || mongoose.model('ChatReadState', chatReadStateSchema);

module.exports = ChatReadState;
