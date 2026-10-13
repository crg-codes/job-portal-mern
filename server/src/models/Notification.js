import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['APPLICATION_STATUS_UPDATE', 'NEW_APPLICATION', 'NEW_JOB_RECOMMENDATION', 'SYSTEM'],
      default: 'SYSTEM',
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String, // E.g., /profile/seeker/applications
    },
    relatedData: {
      type: mongoose.Schema.Types.Mixed, // flexible metadata
    }
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
