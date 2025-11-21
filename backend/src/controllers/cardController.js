const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');

const createCard = async (req, res) => {
  try {
    const { title, description, listId, boardId, dueDate, labels } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add cards to this board' });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

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

const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

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

const moveCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const board = await Board.findById(card.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to move this card' });
    }

    const { listId, position } = req.body;

    const newList = await List.findById(listId);
    if (!newList) {
      return res.status(404).json({ message: 'List not found' });
    }

    const oldListId = card.list;

    card.list = listId;
    card.position = position;
    await card.save();

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

const reorderCards = async (req, res) => {
  try {
    const { listId, cards } = req.body;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const board = await Board.findById(list.board);
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reorder cards' });
    }

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

const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

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
