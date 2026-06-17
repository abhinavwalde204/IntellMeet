import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' }
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Workspace name is required'] },
  description: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  invites: [inviteSchema],
  avatar: { type: String, default: '' }
}, { timestamps: true });

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ 'members.userId': 1 });

export default mongoose.model('Workspace', workspaceSchema);
