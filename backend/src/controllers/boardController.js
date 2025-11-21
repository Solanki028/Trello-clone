const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');

const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ],
      isArchived: false
    })
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    const lists = await List.find({ board: board._id, isArchived: false })
      .sort({ position: 1 });

    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const cards = await Card.find({ list: list._id, isArchived: false })
          .populate('assignee', 'name email')
          .populate('createdBy', 'name email')
          .sort({ position: 1 });
        return {
          ...list.toObject(),
          cards
        };
      })
    );

    res.json({
      ...board.toObject(),
      lists: listsWithCards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBoard = async (req, res) => {
  try {
    const { title, description, backgroundColor } = req.body;

    const board = await Board.create({
      title,
      description,
      backgroundColor,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner'
      }]
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    const { title, description, backgroundColor } = req.body;

    board.title = title || board.title;
    board.description = description !== undefined ? description : board.description;
    board.backgroundColor = backgroundColor || board.backgroundColor;

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    await List.deleteMany({ board: board._id });
    await Card.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ message: 'Board removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only board owner can add members' });
    }

    const { email } = req.body;

    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    if (board.isMember(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    board.members.push({
      user: userToAdd._id,
      role: 'member'
    });

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only board owner can remove members' });
    }

    if (req.params.userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove board owner' });
    }

    board.removeMember(req.params.userId);
    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(updatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
};
