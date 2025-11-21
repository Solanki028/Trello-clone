const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a list title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for cards
listSchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'list'
});

// Index for efficient querying
listSchema.index({ board: 1, position: 1 });

module.exports = mongoose.model('List', listSchema);
