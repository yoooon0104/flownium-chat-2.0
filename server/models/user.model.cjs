const mongoose = require('mongoose');

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
    refreshToken: {
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