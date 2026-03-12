const mongoose = require('mongoose');

// 비밀번호 재설정은 실제 메일 발송 전 단계에서는 인증 코드와 새 비밀번호 해시만 임시 저장한다.
const passwordResetVerificationSchema = new mongoose.Schema(
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

const PasswordResetVerification =
  mongoose.models.PasswordResetVerification || mongoose.model('PasswordResetVerification', passwordResetVerificationSchema);

module.exports = PasswordResetVerification;
