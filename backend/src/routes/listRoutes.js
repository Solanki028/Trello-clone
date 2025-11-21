const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createList,
  updateList,
  reorderLists,
  deleteList
} = require('../controllers/listController');

// @route   POST /api/lists
router.post('/', protect, createList);

// @route   PUT /api/lists/reorder
router.put('/reorder', protect, reorderLists);

// @route   PUT /api/lists/:id
router.put('/:id', protect, updateList);

// @route   DELETE /api/lists/:id
router.delete('/:id', protect, deleteList);

module.exports = router;
