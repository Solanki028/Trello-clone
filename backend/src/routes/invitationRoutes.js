const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendInvitation,
  getUserInvitations,
  getBoardInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
} = require('../controllers/invitationController');

// @route   POST /api/invitations
router.post('/', protect, sendInvitation);

// @route   GET /api/invitations
router.get('/', protect, getUserInvitations);

// @route   GET /api/invitations/board/:boardId
router.get('/board/:boardId', protect, getBoardInvitations);

// @route   PUT /api/invitations/:id/accept
router.put('/:id/accept', protect, acceptInvitation);

// @route   PUT /api/invitations/:id/decline
router.put('/:id/decline', protect, declineInvitation);

// @route   DELETE /api/invitations/:id
router.delete('/:id', protect, cancelInvitation);

module.exports = router;