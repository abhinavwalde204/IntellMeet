import Meeting from '../models/Meeting.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// Helper: build date range from range string
function getDateRange(range) {
  const now = new Date();
  const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, days };
}

// @desc    Get analytics summary for user/workspace
// @route   GET /api/analytics/summary
// @access  Private
export const getAnalyticsSummary = async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end, days } = getDateRange(range);

    const userQuery = {
      $or: [{ hostId: req.user.id }, { 'participants.userId': req.user.id }],
      status: 'ended',
      createdAt: { $gte: start, $lte: end }
    };

    const meetings = await Meeting.find(userQuery).lean();

    const totalMeetings = meetings.length;
    const totalDurationSec = meetings.reduce((acc, m) => acc + (m.duration || 0), 0);
    const avgDurationMin = totalMeetings > 0 ? Math.round(totalDurationSec / totalMeetings / 60) : 0;

    // Action items across all meetings
    const allActionItems = meetings.flatMap(m => m.actionItems || []);
    const totalActionItems = allActionItems.length;
    const doneActionItems = allActionItems.filter(a => a.status === 'done').length;
    const completionRate = totalActionItems > 0 ? Math.round((doneActionItems / totalActionItems) * 100) : 0;

    // Build daily meeting counts for chart (last N days)
    const dailyCounts = [];
    const dayLabels = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
      const count = meetings.filter(m => {
        const mDate = new Date(m.createdAt);
        return mDate.toDateString() === day.toDateString();
      }).length;
      dayLabels.push(dayStr);
      dailyCounts.push(count);
    }

    // Task completion breakdown
    const tasks = await Task.find({
      createdAt: { $gte: start, $lte: end }
    }).lean();

    const taskBreakdown = {
      done: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      backlog: tasks.filter(t => t.status === 'backlog').length,
      todo: tasks.filter(t => t.status === 'todo').length,
    };

    res.status(200).json({
      success: true,
      metrics: {
        totalMeetings,
        avgDurationMin,
        totalActionItems,
        completionRate,
      },
      chart: {
        labels: dayLabels,
        data: dailyCounts,
      },
      taskBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team analytics
// @route   GET /api/analytics/team
// @access  Private
export const getTeamAnalytics = async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getDateRange(range);

    // Get all meetings in range where user is involved
    const meetings = await Meeting.find({
      $or: [{ hostId: req.user.id }, { 'participants.userId': req.user.id }],
      status: 'ended',
      createdAt: { $gte: start, $lte: end }
    }).populate('hostId', 'name email avatarUrl').lean();

    // Collect all unique participant user IDs
    const userMeetingMap = new Map();

    for (const meeting of meetings) {
      const participantIds = [
        meeting.hostId?._id?.toString(),
        ...((meeting.participants || []).map(p => p.userId?.toString()).filter(Boolean))
      ].filter(Boolean);

      for (const uid of new Set(participantIds)) {
        if (!userMeetingMap.has(uid)) {
          userMeetingMap.set(uid, { meetings: 0, durationSec: 0 });
        }
        const entry = userMeetingMap.get(uid);
        entry.meetings += 1;
        entry.durationSec += meeting.duration || 0;
      }
    }

    // Fetch users and join their tasks
    const userIds = [...userMeetingMap.keys()];
    const users = await User.find({ _id: { $in: userIds } }).select('name email avatarUrl').lean();

    const teamStats = await Promise.all(users.map(async (user) => {
      const stats = userMeetingMap.get(user._id.toString()) || { meetings: 0, durationSec: 0 };
      const tasks = await Task.find({
        assigneeId: user._id,
        createdAt: { $gte: start, $lte: end }
      }).lean();

      const doneTasks = tasks.filter(t => t.status === 'done').length;
      const completion = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
      const talkMinutes = Math.round(stats.durationSec / 60);
      const talkHours = Math.floor(talkMinutes / 60);
      const talkMins = talkMinutes % 60;
      const talkTimeFormatted = talkHours > 0 ? `${talkHours}h ${talkMins}m` : `${talkMins}m`;

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        meetings: stats.meetings,
        talkTime: talkTimeFormatted,
        tasks: tasks.length,
        completion,
      };
    }));

    // Sort by meetings descending
    teamStats.sort((a, b) => b.meetings - a.meetings);

    res.status(200).json({ success: true, teamStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
