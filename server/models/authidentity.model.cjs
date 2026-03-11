const mongoose = require('mongoose');

// 로그인 수단을 사용자 본체와 분리해 tombstone/재가입 정책을 유연하게 유지한다.
const authIdentitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    providerUserId: {
      type: String,
      required: true,
      trim: true,
    },
    providerEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    secretHash: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

authIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

const AuthIdentity =
  mongoose.models.AuthIdentity || mongoose.model('AuthIdentity', authIdentitySchema);

module.exports = AuthIdentity;
