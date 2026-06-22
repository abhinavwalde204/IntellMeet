import Meeting from '../models/Meeting.js';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { generateMeetingSummary } from '../services/aiService.js';
import crypto from 'crypto';

// Helper to extract assignee names and map them to actual members, then insert tasks to Kanban
async function autoCreateTasksFromActionItems(meeting, actionItems, hostId) {
  if (!meeting.workspaceId) return [];

  try {
    const workspace = await Workspace.findById(meeting.workspaceId).populate('members.userId', 'name email');
    if (!workspace) return [];

    const owner = await User.findById(workspace.ownerId);
    const candidates = [];
    if (owner) {
      candidates.push({ id: owner._id, name: owner.name });
    }
    
    workspace.members.forEach(member => {
      if (member.userId) {
        candidates.push({ id: member.userId._id, name: member.userId.name });
      }
    });

    const createdTasks = [];

    for (const item of actionItems) {
      let assigneeId = null;
      let assigneeName = item.assignee || '';

      if (assigneeName) {
        const match = candidates.find(c => 
          c.name.toLowerCase().includes(assigneeName.toLowerCase()) || 
          assigneeName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) {
          assigneeId = match.id;
          assigneeName = match.name;
        }
      }

      const priorityMap = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'urgent': 'urgent'
      };
      const priority = priorityMap[item.priority?.toLowerCase()] || 'medium';

      let dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const task = await Task.create({
        title: item.title || 'Extracted Task',
        description: `Automatically extracted from meeting "${meeting.title}"`,
        status: 'backlog',
        priority,
        assigneeId,
        assigneeName,
        workspaceId: meeting.workspaceId,
        meetingId: meeting._id,
        dueDate,
        createdBy: hostId
      });

      createdTasks.push(task);
    }

    return createdTasks;
  } catch (error) {
    console.error('Error auto-creating tasks:', error);
    return [];
  }
}

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req, res) => {
  try {
    const { title, workspaceId } = req.body;
    const roomId = crypto.randomBytes(4).toString('hex');

    const meeting = await Meeting.create({
      title: title || 'Untitled Meeting',
      hostId: req.user.id,
      workspaceId,
      roomId,
      status: 'scheduled'
    });

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all meetings for the logged-in user
// @route   GET /api/meetings
// @access  Private
export const getMeetings = async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = {
      $or: [
        { hostId: req.user.id },
        { 'participants.userId': req.user.id }
      ]
    };

    if (status) {
      query.status = status;
    }

    let meetingQuery = Meeting.find(query)
      .sort({ createdAt: -1 })
      .populate('hostId', 'name email avatarUrl')
      .populate('participants.userId', 'name email avatarUrl');

    if (limit) {
      meetingQuery = meetingQuery.limit(parseInt(limit, 10));
    }

    const meetings = await meetingQuery.lean();

    res.status(200).json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
export const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('hostId', 'name email avatar')
      .populate('actionItems.assigneeId', 'name email');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start a meeting (set status to live)
// @route   PUT /api/meetings/:id/start
// @access  Private
export const startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, hostId: req.user.id },
      { status: 'live', startTime: new Date() },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not authorized' });
    }

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End a meeting and trigger AI summary
// @route   PUT /api/meetings/:id/end
// @access  Private
export const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, hostId: req.user.id });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not authorized' });
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();
    if (meeting.startTime) {
      meeting.duration = Math.round((meeting.endTime - meeting.startTime) / 1000);
    }

    // Generate AI summary if transcript exists
    if (meeting.transcript && meeting.transcript.length > 0) {
      const aiResult = await generateMeetingSummary(meeting.transcript);
      meeting.summary = aiResult.summary;
      meeting.decisions = aiResult.decisions;
      meeting.actionItems = aiResult.actionItems.map(item => ({
        title: item.title,
        assignee: item.assignee,
        priority: item.priority,
        status: 'pending',
        dueDate: item.dueDate ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
      }));

      // Auto-create tasks on the Kanban board
      if (meeting.workspaceId && aiResult.actionItems && aiResult.actionItems.length > 0) {
        const createdTasks = await autoCreateTasksFromActionItems(meeting, aiResult.actionItems, req.user.id);
        
        // Emit Socket.io event to synchronize Kanban board in real time
        const io = req.app.get('io');
        if (io && createdTasks.length > 0) {
          io.to(`workspace-${meeting.workspaceId.toString()}`).emit('tasks-created', createdTasks);
        }
      }
    }

    await meeting.save();
    res.status(200).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add transcript entry to a meeting
// @route   POST /api/meetings/:id/transcript
// @access  Private
export const addTranscript = async (req, res) => {
  try {
    const { speaker, text, timestamp } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { $push: { transcript: { speaker, text, timestamp } } },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.status(200).json({ success: true, transcript: meeting.transcript });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate AI summary for a meeting (manual trigger)
// @route   POST /api/meetings/:id/summarize
// @access  Private
export const summarizeMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Use existing transcript or mock data for demo
    const transcript = meeting.transcript.length > 0 
      ? meeting.transcript 
      : [
          { speaker: 'Host', text: 'Welcome everyone to the sprint review.', timestamp: 0 },
          { speaker: 'Sarah', text: 'I completed the auth flow and dashboard.', timestamp: 10 },
          { speaker: 'Mike', text: 'Backend API endpoints are done. Working on WebRTC now.', timestamp: 25 },
          { speaker: 'Alex', text: 'Whisper integration is set up with 5-second chunks.', timestamp: 40 },
          { speaker: 'Host', text: 'Great. Mike, please set up CI/CD by next week.', timestamp: 55 },
          { speaker: 'Mike', text: 'On it. GitHub Actions with Docker.', timestamp: 65 }
        ];

    const aiResult = await generateMeetingSummary(transcript);
    
    meeting.summary = aiResult.summary;
    meeting.decisions = aiResult.decisions;
    meeting.actionItems = aiResult.actionItems.map(item => ({
      title: item.title,
      assignee: item.assignee,
      priority: item.priority,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }));

    if (meeting.transcript.length === 0) {
      meeting.transcript = transcript;
    }

    await meeting.save();

    // Auto-create tasks on the Kanban board
    if (meeting.workspaceId && aiResult.actionItems && aiResult.actionItems.length > 0) {
      const createdTasks = await autoCreateTasksFromActionItems(meeting, aiResult.actionItems, req.user.id);
      
      // Emit Socket.io event to synchronize Kanban board in real time
      const io = req.app.get('io');
      if (io && createdTasks.length > 0) {
        io.to(`workspace-${meeting.workspaceId.toString()}`).emit('tasks-created', createdTasks);
      }
    }

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update action item status
// @route   PUT /api/meetings/:id/action-items/:itemId
// @access  Private
export const updateActionItem = async (req, res) => {
  try {
    const { status, assignee } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const item = meeting.actionItems.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Action item not found' });
    }

    if (status) item.status = status;
    if (assignee) item.assignee = assignee;

    await meeting.save();
    res.status(200).json({ success: true, actionItem: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a meeting
// @route   DELETE /api/meetings/:id
// @access  Private
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, hostId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not authorized' });
    }
    res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get meeting participants
// @route   GET /api/meetings/:id/participants
// @access  Private
export const getParticipants = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('participants.userId', 'name email avatarUrl');
    
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    res.status(200).json({ success: true, participants: meeting.participants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get meeting messages
// @route   GET /api/meetings/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('messages.senderId', 'name avatarUrl');
      
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    res.status(200).json({ success: true, messages: meeting.messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a message to a meeting
// @route   POST /api/meetings/:id/messages
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { text } = req.body;
    
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          messages: { 
            senderId: req.user.id, 
            senderName: req.user.name, 
            text, 
            timestamp: new Date() 
          } 
        } 
      },
      { new: true }
    ).populate('messages.senderId', 'name avatarUrl');
    
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    const newMessage = meeting.messages[meeting.messages.length - 1];
    res.status(200).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

