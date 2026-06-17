import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Task title is required'] },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['backlog', 'in-progress', 'in-review', 'done'],
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigneeName: { type: String, default: '' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  dueDate: { type: Date },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ assigneeId: 1 });

export default mongoose.model('Task', taskSchema);
