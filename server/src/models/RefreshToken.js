import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    token: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    revoked: {
      type: Boolean,
      default: false
    },

    replacedByToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for faster token lookup
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-clean expired tokens

const RefreshToken = mongoose.model(
  'RefreshToken',
  refreshTokenSchema
);

export default RefreshToken;