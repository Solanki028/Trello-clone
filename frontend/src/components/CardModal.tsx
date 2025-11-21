import React, { useState } from 'react';
import { Card as CardType, BoardMember } from '../types';

interface CardModalProps {
  card: CardType;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<CardType>) => void;
  onDelete: (cardId: string) => void;
  boardMembers: BoardMember[];
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose, onUpdate, onDelete, boardMembers }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [isCompleted, setIsCompleted] = useState(card.isCompleted);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f');

  const labelColors = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#00c2e0'];

  const handleSave = () => {
    onUpdate(card._id, {
      title,
      description,
      dueDate: dueDate || null,
      isCompleted,
    });
  };

  const handleAddLabel = () => {
    if (!newLabelText.trim()) return;
    const newLabels = [...card.labels, { text: newLabelText, color: newLabelColor }];
    onUpdate(card._id, { labels: newLabels });
    setNewLabelText('');
  };

  const handleRemoveLabel = (index: number) => {
    const newLabels = card.labels.filter((_, i) => i !== index);
    onUpdate(card._id, { labels: newLabels });
  };

  const handleAssign = (userId: string | null) => {
    onUpdate(card._id, { assignee: userId as any });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-trello-blue focus:outline-none w-full"
            />
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl ml-4">
              ×
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Add a more detailed description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-trello-blue resize-none"
                  rows={4}
                />
              </div>

              {/* Labels */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {card.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-sm text-white flex items-center gap-1"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.text}
                      <button
                        onClick={() => handleRemoveLabel(index)}
                        className="hover:bg-black hover:bg-opacity-20 rounded px-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    placeholder="Label text"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-1">
                    {labelColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={`w-6 h-6 rounded ${newLabelColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button onClick={handleAddLabel} className="btn btn-primary text-sm py-1">
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Due Date */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Due Date</h4>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    onUpdate(card._id, { dueDate: e.target.value || null });
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              {/* Completed */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) => {
                      setIsCompleted(e.target.checked);
                      onUpdate(card._id, { isCompleted: e.target.checked });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Mark as complete</span>
                </label>
              </div>

              {/* Assignee */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Assignee</h4>
                <select
                  value={card.assignee?._id || ''}
                  onChange={(e) => handleAssign(e.target.value || null)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Unassigned</option>
                  {boardMembers
                    .filter(member => member && member.user && member.user._id && member.user.name)
                    .map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete */}
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this card?')) {
                    onDelete(card._id);
                  }
                }}
                className="w-full btn btn-danger text-sm"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
