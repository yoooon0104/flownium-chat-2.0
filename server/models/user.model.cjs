const mongoose = require('mongoose');

// 사용자 스키마: 카카오 식별자와 로그인/리프레시 토큰 상태를 관리한다.
const userSchema = new mongoose.Schema(
  {
    kakaoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // refresh token 원문 대신 해시를 저장해 토큰 탈취 위험을 낮춘다.
    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
