import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['mention', 'action-item', 'meeting-invite', 'task-assigned', 'meeting-summary'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
