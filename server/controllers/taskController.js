import Task from '../models/Task.js';

// @desc    Get all tasks for a workspace
// @route   GET /api/tasks?workspaceId=xxx
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspaceId } : { createdBy: req.user.id };

    const tasks = await Task.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('assigneeId', 'name email avatar')
      .populate('meetingId', 'title roomId')
      .lean();

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, assigneeName, workspaceId, meetingId, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status: status || 'backlog',
      priority: priority || 'medium',
      assigneeId,
      assigneeName,
      workspaceId,
      meetingId,
      dueDate,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task (status, details, order)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const updates = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assigneeId', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Batch create tasks from AI action items
// @route   POST /api/tasks/batch
// @access  Private
export const batchCreateTasks = async (req, res) => {
  try {
    const { tasks, workspaceId, meetingId } = req.body;

    const taskDocs = tasks.map((t, i) => ({
      title: t.title,
      description: t.description || '',
      status: 'backlog',
      priority: t.priority || 'medium',
      assigneeName: t.assignee || '',
      workspaceId,
      meetingId,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      order: i,
      createdBy: req.user.id
    }));

    const created = await Task.insertMany(taskDocs);
    res.status(201).json({ success: true, tasks: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
