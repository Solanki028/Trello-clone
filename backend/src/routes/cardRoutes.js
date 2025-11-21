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

router.post('/', protect, createCard);

router.put('/reorder', protect, reorderCards);

router.put('/:id', protect, updateCard);

router.put('/:id/move', protect, moveCard);

router.delete('/:id', protect, deleteCard);

module.exports = router;
