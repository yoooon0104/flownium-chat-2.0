const mongoose = require('mongoose');

// 이메일 인증 전 가입 입력값을 임시로 저장해, 인증 성공 시점에만 실제 계정을 생성한다.
const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const EmailVerification =
  mongoose.models.EmailVerification || mongoose.model('EmailVerification', emailVerificationSchema);

module.exports = EmailVerification;
