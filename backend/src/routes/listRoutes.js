const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createList,
  updateList,
  reorderLists,
  deleteList
} = require('../controllers/listController');

router.post('/', protect, createList);

router.put('/reorder', protect, reorderLists);

router.put('/:id', protect, updateList);

router.delete('/:id', protect, deleteList);

module.exports = router;
