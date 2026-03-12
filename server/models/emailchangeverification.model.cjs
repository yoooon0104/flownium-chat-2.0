const mongoose = require('mongoose');

// 이메일 변경은 현재 로그인한 사용자 기준으로 1건만 진행되도록 임시 인증 레코드를 저장한다.
const emailChangeVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    nextEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    codeHash: {
      type: String,
      required: true,
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

const EmailChangeVerification =
  mongoose.models.EmailChangeVerification || mongoose.model('EmailChangeVerification', emailChangeVerificationSchema);

module.exports = EmailChangeVerification;
