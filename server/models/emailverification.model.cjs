const mongoose = require('mongoose');

// 이메일 인증이 끝나기 전까지는 가입 입력값과 약관 동의 시점만 임시로 저장한다.
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
    agreedToTermsAt: {
      type: Date,
      default: null,
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
