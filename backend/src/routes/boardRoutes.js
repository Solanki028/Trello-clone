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

// @route   GET /api/boards
router.get('/', protect, getBoards);

// @route   POST /api/boards
router.post('/', protect, createBoard);

// @route   GET /api/boards/:id
router.get('/:id', protect, getBoard);

// @route   PUT /api/boards/:id
router.put('/:id', protect, updateBoard);

// @route   DELETE /api/boards/:id
router.delete('/:id', protect, deleteBoard);

// @route   POST /api/boards/:id/members
router.post('/:id/members', protect, addMember);

// @route   DELETE /api/boards/:id/members/:userId
router.delete('/:id/members/:userId', protect, removeMember);

// @route   GET /api/boards/:id/recommendations
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
