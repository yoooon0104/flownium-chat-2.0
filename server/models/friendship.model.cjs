const mongoose = require('mongoose');

// 사용자쌍을 방향과 무관하게 하나의 관계 문서로 고정하기 위한 키를 만든다.
const buildPairKey = (requesterId, addresseeId) => {
  return [String(requesterId || '').trim(), String(addresseeId || '').trim()].sort().join(':');
};

// 친구 관계 스키마: 친구 요청/수락/거절/차단 상태를 한 문서로 관리한다.
const friendshipSchema = new mongoose.Schema(
  {
    requesterId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    addresseeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 저장 직전에 항상 pairKey를 재계산해 역방향 중복 요청을 막는다.
friendshipSchema.pre('validate', function normalizePairKey(next) {
  this.requesterId = String(this.requesterId || '').trim();
  this.addresseeId = String(this.addresseeId || '').trim();
  this.pairKey = buildPairKey(this.requesterId, this.addresseeId);
  next();
});

const Friendship = mongoose.models.Friendship || mongoose.model('Friendship', friendshipSchema);

module.exports = {
  Friendship,
  buildPairKey,
};