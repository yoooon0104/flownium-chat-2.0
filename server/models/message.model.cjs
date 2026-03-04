const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
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