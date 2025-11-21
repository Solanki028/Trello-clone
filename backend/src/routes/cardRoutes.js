const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCard,
  updateCard,
  moveCard,
  reorderCards,
  deleteCard
} = require('../controllers/cardController');

// @route   POST /api/cards
router.post('/', protect, createCard);

// @route   PUT /api/cards/reorder
router.put('/reorder', protect, reorderCards);

// @route   PUT /api/cards/:id
router.put('/:id', protect, updateCard);

// @route   PUT /api/cards/:id/move
router.put('/:id/move', protect, moveCard);

// @route   DELETE /api/cards/:id
router.delete('/:id', protect, deleteCard);

module.exports = router;
