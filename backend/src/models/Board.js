const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a board title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  backgroundColor: {
    type: String,
    default: '#0079bf'
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

boardSchema.virtual('lists', {
  ref: 'List',
  localField: '_id',
  foreignField: 'board'
});

boardSchema.methods.isMember = function(userId) {
  const userIdStr = userId.toString();
  const ownerId = this.owner && this.owner._id ? this.owner._id.toString() : this.owner.toString();
  if (ownerId === userIdStr) return true;

  return this.members.some(member => {
    if (!member || !member.user) return false;

    const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberId === userIdStr;
  });
};

boardSchema.methods.removeMember = function(userId) {
  const userIdStr = userId.toString();
  this.members = this.members.filter(member => {
    if (!member || !member.user) return true;

    const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberId !== userIdStr;
  });
};

module.exports = mongoose.model('Board', boardSchema);
