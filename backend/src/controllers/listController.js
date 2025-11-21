const List = require('../models/List');
const Board = require('../models/Board');
const Card = require('../models/Card');

// @desc    Create list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { title, boardId } = req.body;

    // Check if board exists and user is a member
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add lists to this board' });
    }

    // Get the highest position
    const lastList = await List.findOne({ board: boardId }).sort({ position: -1 });
    const position = lastList ? lastList.position + 1 : 0;

    const list = await List.create({
      title,
      board: boardId,
      position
    });

    res.status(201).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(list.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this list' });
    }

    const { title } = req.body;
    list.title = title || list.title;

    await list.save();
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update list positions (reorder)
// @route   PUT /api/lists/reorder
// @access  Private
const reorderLists = async (req, res) => {
  try {
    const { boardId, lists } = req.body;

    // Check if user is a board member
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reorder lists' });
    }

    // Update positions
    const updatePromises = lists.map((list, index) =>
      List.findByIdAndUpdate(list._id, { position: index }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedLists = await List.find({ board: boardId }).sort({ position: 1 });
    res.json(updatedLists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(list.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this list' });
    }

    // Delete all cards in the list
    await Card.deleteMany({ list: list._id });
    await list.deleteOne();

    res.json({ message: 'List removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createList,
  updateList,
  reorderLists,
  deleteList
};
