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
    // 카카오 계정 이메일(동의 범위에 따라 비어 있을 수 있음)
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      index: true,
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
    // 최초 가입 완료 시점을 기록해 로그인/온보딩 분기를 결정한다.
    signupCompletedAt: {
      type: Date,
      default: null,
    },
    // 약관 동의 여부를 서버에서 증적 형태로 남긴다.
    agreedToTermsAt: {
      type: Date,
      default: null,
    },
    nicknameUpdatedAt: {
      type: Date,
      default: null,
    },
    profileImageUpdatedAt: {
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
