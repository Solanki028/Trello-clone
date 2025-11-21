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

router.post('/', protect, sendInvitation);

router.get('/', protect, getUserInvitations);

router.get('/board/:boardId', protect, getBoardInvitations);

router.put('/:id/accept', protect, acceptInvitation);

router.put('/:id/decline', protect, declineInvitation);

router.delete('/:id', protect, cancelInvitation);

module.exports = router;