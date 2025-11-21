const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
} = require('../controllers/boardController');
const { generateRecommendations } = require('../services/recommendationService');
const Board = require('../models/Board');

router.get('/', protect, getBoards);

router.post('/', protect, createBoard);

router.get('/:id', protect, getBoard);

router.put('/:id', protect, updateBoard);

router.delete('/:id', protect, deleteBoard);

router.post('/:id/members', protect, addMember);

router.delete('/:id/members/:userId', protect, removeMember);

router.get('/:id/recommendations', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check if user is a member
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }
    
    const recommendations = await generateRecommendations(req.params.id);
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
