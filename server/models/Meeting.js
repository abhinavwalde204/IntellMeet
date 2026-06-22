import mongoose from 'mongoose';

const transcriptEntrySchema = new mongoose.Schema({
  speaker: { type: String, default: 'Unknown' },
  text: { type: String, required: true },
  timestamp: { type: Number, required: true }, // seconds from meeting start
  confidence: { type: Number, default: 0 }
}, { _id: false });

const actionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assignee: { type: String, default: '' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Meeting' },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  roomId: { type: String, required: true, unique: true },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    joinedAt: { type: Date },
    leftAt: { type: Date }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds

  // AI Intelligence
  transcript: [transcriptEntrySchema],
  summary: { type: String, default: '' },
  decisions: [{ type: String }],
  actionItems: [actionItemSchema],
  messages: [messageSchema],

  // Recording
  recordingUrl: { type: String, default: '' },

  // Tags / Metadata
  tags: [{ type: String }]
}, { timestamps: true });

meetingSchema.index({ hostId: 1, createdAt: -1 });
meetingSchema.index({ workspaceId: 1 });

export default mongoose.model('Meeting', meetingSchema);
