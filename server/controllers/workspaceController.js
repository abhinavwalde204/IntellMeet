import Workspace from '../models/Workspace.js';
import crypto from 'crypto';

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      ownerId: req.user.id,
      members: [{ userId: req.user.id, role: 'Admin' }]
    });

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get workspaces for the logged-in user
// @route   GET /api/workspaces
// @access  Private
export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.userId': req.user.id
    }).populate('members.userId', 'name email avatar').lean();

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single workspace
// @route   GET /api/workspaces/:id
// @access  Private
export const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('members.userId', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite a member to workspace
// @route   POST /api/workspaces/:id/invite
// @access  Private (Admin only)
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Check if requester is admin
    const requester = workspace.members.find(
      m => m.userId.toString() === req.user.id
    );
    if (!requester || requester.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only admins can invite members' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    workspace.invites.push({
      email,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending'
    });

    await workspace.save();

    res.status(200).json({ 
      success: true, 
      inviteLink: `${process.env.CLIENT_URL}/invite/${token}`,
      message: `Invitation created for ${email}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to workspace (via invite acceptance)
// @route   POST /api/workspaces/join/:token
// @access  Private
export const joinWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      'invites.token': req.params.token,
      'invites.status': 'pending',
      'invites.expiresAt': { $gt: new Date() }
    });

    if (!workspace) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite link' });
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(
      m => m.userId.toString() === req.user.id
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this workspace' });
    }

    workspace.members.push({ userId: req.user.id, role: 'Member' });

    const invite = workspace.invites.find(i => i.token === req.params.token);
    if (invite) invite.status = 'accepted';

    await workspace.save();

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
