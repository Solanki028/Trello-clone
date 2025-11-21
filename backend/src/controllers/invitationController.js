const Invitation = require('../models/Invitation');
const Board = require('../models/Board');
const User = require('../models/User');

// @desc    Send invitation to board
// @route   POST /api/invitations
// @access  Private (Board Owner only)
const sendInvitation = async (req, res) => {
  try {
    const { boardId, email, message } = req.body;

    // Check if board exists and user is owner
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only board owner can send invitations' });
    }

    // Find invitee by email
    const invitee = await User.findOne({ email });
    if (!invitee) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    // Check if user is already a member
    if (board.isMember(invitee._id)) {
      return res.status(400).json({ message: 'User is already a board member' });
    }

    // Check for existing invitations
    const existingInvitation = await Invitation.findOne({
      board: boardId,
      invitee: invitee._id
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return res.status(400).json({ message: 'An active invitation already exists for this user' });
      } else if (existingInvitation.status === 'accepted') {
        return res.status(400).json({ message: 'User is already a board member' });
      } else if (existingInvitation.status === 'declined') {
        // Check cooldown for declined invitations
        const twoMinutesAgo = new Date();
        twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

        if (existingInvitation.updatedAt >= twoMinutesAgo) {
          return res.status(400).json({
            message: 'Please wait 2 minutes before sending another invitation to this user',
            cooldownUntil: new Date(existingInvitation.updatedAt.getTime() + 2 * 60 * 1000)
          });
        } else {
          // Cooldown passed, resend by updating existing invitation
          existingInvitation.status = 'pending';
          existingInvitation.message = message;
          existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset expiration
          await existingInvitation.save();

          const populatedInvitation = await Invitation.findById(existingInvitation._id)
            .populate('board', 'title backgroundColor')
            .populate('inviter', 'name email')
            .populate('invitee', 'name email');

          return res.status(200).json(populatedInvitation);
        }
      }
    }

    // Create new invitation
    const invitation = await Invitation.create({
      board: boardId,
      inviter: req.user._id,
      invitee: invitee._id,
      message
    });

    // Populate the invitation
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('board', 'title backgroundColor')
      .populate('inviter', 'name email')
      .populate('invitee', 'name email');

    res.status(201).json(populatedInvitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's invitations (notifications)
// @route   GET /api/invitations
// @access  Private
const getUserInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ 
      invitee: req.user._id,
      status: 'pending'
    })
    .populate('board', 'title backgroundColor')
    .populate('inviter', 'name email')
    .populate('invitee', 'name email')
    .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get board's invitations (for admin)
// @route   GET /api/invitations/board/:boardId
// @access  Private (Board Owner only)
const getBoardInvitations = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only board owner can view invitations' });
    }

    const invitations = await Invitation.find({ 
      board: req.params.boardId,
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('inviter', 'name email')
    .populate('invitee', 'name email')
    .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept invitation
// @route   PUT /api/invitations/:id/accept
// @access  Private
const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation is no longer valid' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Add user to board members (ensure they don't already exist)
    const board = await Board.findById(invitation.board);
    const userAlreadyMember = board.members.some(member => 
      member.user && member.user.toString() === req.user._id.toString()
    );
    
    if (!userAlreadyMember) {
      board.members.push({
        user: req.user._id,
        role: 'member'
      });
      await board.save();
    }

    // Return updated board with proper population
    const updatedBoard = await Board.findById(invitation.board)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ 
      message: 'Invitation accepted successfully',
      board: updatedBoard 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Decline invitation
// @route   PUT /api/invitations/:id/decline
// @access  Private
const declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation is no longer valid' });
    }

    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    await invitation.save();

    res.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel invitation (by inviter)
// @route   DELETE /api/invitations/:id
// @access  Private
const cancelInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.inviter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel an invitation that has been accepted or declined' });
    }

    await invitation.deleteOne();

    res.json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendInvitation,
  getUserInvitations,
  getBoardInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
};