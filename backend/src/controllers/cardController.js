const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');

// @desc    Create card
// @route   POST /api/cards
// @access  Private
const createCard = async (req, res) => {
  try {
    const { title, description, listId, boardId, dueDate, labels } = req.body;

    // Check if board exists and user is a member
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add cards to this board' });
    }

    // Check if list exists
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Get the highest position
    const lastCard = await Card.findOne({ list: listId }).sort({ position: -1 });
    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await Card.create({
      title,
      description,
      list: listId,
      board: boardId,
      position,
      dueDate,
      labels,
      createdBy: req.user._id
    });

    const populatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update card
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(card.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this card' });
    }

    const { title, description, dueDate, labels, assignee, isCompleted } = req.body;

    card.title = title !== undefined ? title : card.title;
    card.description = description !== undefined ? description : card.description;
    card.dueDate = dueDate !== undefined ? dueDate : card.dueDate;
    card.labels = labels !== undefined ? labels : card.labels;
    card.assignee = assignee !== undefined ? assignee : card.assignee;
    card.isCompleted = isCompleted !== undefined ? isCompleted : card.isCompleted;

    await card.save();

    const updatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Move card to different list
// @route   PUT /api/cards/:id/move
// @access  Private
const moveCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(card.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to move this card' });
    }

    const { listId, position } = req.body;

    // Check if new list exists
    const newList = await List.findById(listId);
    if (!newList) {
      return res.status(404).json({ message: 'List not found' });
    }

    const oldListId = card.list;

    // Update card's list and position
    card.list = listId;
    card.position = position;
    await card.save();

    // Reorder cards in old list
    if (oldListId.toString() !== listId.toString()) {
      const oldListCards = await Card.find({ list: oldListId }).sort({ position: 1 });
      for (let i = 0; i < oldListCards.length; i++) {
        oldListCards[i].position = i;
        await oldListCards[i].save();
      }
    }

    const updatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reorder cards within a list
// @route   PUT /api/cards/reorder
// @access  Private
const reorderCards = async (req, res) => {
  try {
    const { listId, cards } = req.body;

    // Check if list exists
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(list.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reorder cards' });
    }

    // Update positions
    const updatePromises = cards.map((card, index) =>
      Card.findByIdAndUpdate(card._id, { position: index }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedCards = await Card.find({ list: listId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ position: 1 });

    res.json(updatedCards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if user is a board member
    const board = await Board.findById(card.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this card' });
    }

    await card.deleteOne();
    res.json({ message: 'Card removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCard,
  updateCard,
  moveCard,
  reorderCards,
  deleteCard
};
