import React, { useState } from 'react';
import { Card as CardType, BoardMember } from '../types';

interface CardModalProps {
  card: CardType;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<CardType>) => void;
  onDelete: (cardId: string) => void;
  boardMembers: BoardMember[];
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  onClose,
  onUpdate,
  onDelete,
  boardMembers,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : ''
  );
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
    <div
      className="modal-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3"
      onClick={onClose}
    >
      <div
        className="
          modal-content
          w-full max-w-2xl
          max-h-[90vh]
          overflow-y-auto
          bg-slate-950/95
          text-slate-50
          rounded-2xl
          shadow-2xl shadow-black/80
          border border-white/10
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🗂️</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="
                    text-xl sm:text-2xl font-semibold
                    bg-transparent
                    border-b border-transparent
                    hover:border-slate-600
                    focus:border-sky-400
                    focus:outline-none
                    w-full
                    text-slate-50
                  "
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Edit card title, description, labels and more.
              </p>
            </div>
            <button
              onClick={onClose}
              className="
                text-slate-400 hover:text-slate-100
                text-2xl leading-none
                rounded-full
                w-9 h-9
                inline-flex items-center justify-center
                hover:bg-slate-800/80
                transition
              "
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <h3 className="font-semibold text-slate-100">Description</h3>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Add a more detailed description..."
                  className="
                    w-full px-3 py-2
                    bg-slate-950/80
                    border border-slate-700
                    rounded-lg
                    focus:outline-none
                    focus:ring-2 focus:ring-sky-500
                    text-sm
                    text-slate-100
                    placeholder:text-slate-500
                    resize-none
                  "
                  rows={4}
                />
              </div>

              {/* Labels */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <h3 className="font-semibold text-slate-100">Labels</h3>
                  </div>
                </div>

                {card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {card.labels.map((label, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs text-white flex items-center gap-1 shadow-sm shadow-black/40"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.text}
                        <button
                          onClick={() => handleRemoveLabel(index)}
                          className="hover:bg-black/20 rounded px-1 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="text"
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    placeholder="Label text"
                    className="
                      flex-1 px-2 py-1.5
                      bg-slate-950/80
                      border border-slate-700
                      rounded
                      text-sm
                      text-slate-100
                      placeholder:text-slate-500
                      focus:outline-none
                      focus:ring-1 focus:ring-sky-500
                    "
                  />
                  <div className="flex flex-wrap gap-1">
                    {labelColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabelColor(color)}
                        className={`
                          w-6 h-6 rounded
                          border border-white/40
                          ${newLabelColor === color ? 'ring-2 ring-offset-1 ring-slate-100' : ''}
                        `}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="
                      btn btn-primary
                      text-xs sm:text-sm
                      py-1.5 px-3
                      rounded-lg
                      bg-sky-500 hover:bg-sky-400
                      border-0
                      text-white
                      font-medium
                      shadow-sm shadow-sky-900/50
                      whitespace-nowrap
                    "
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Due Date */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-3">
                <h4 className="text-sm font-semibold text-slate-100 mb-1.5 flex items-center gap-2">
                  <span className="text-base">📅</span>
                  Due Date
                </h4>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    onUpdate(card._id, { dueDate: e.target.value || null });
                  }}
                  className="
                    w-full px-2 py-1.5
                    bg-slate-950/80
                    border border-slate-700
                    rounded
                    text-sm
                    text-slate-100
                    focus:outline-none
                    focus:ring-1 focus:ring-sky-500
                  "
                />
              </div>

              {/* Completed */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) => {
                      setIsCompleted(e.target.checked);
                      onUpdate(card._id, { isCompleted: e.target.checked });
                    }}
                    className="w-4 h-4 rounded border-slate-500 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-100">
                    Mark as complete
                  </span>
                </label>
              </div>

              {/* Assignee */}
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/70 p-3">
                <h4 className="text-sm font-semibold text-slate-100 mb-1.5 flex items-center gap-2">
                  <span className="text-base">👤</span>
                  Assignee
                </h4>
                <select
                  value={card.assignee?._id || ''}
                  onChange={(e) => handleAssign(e.target.value || null)}
                  className="
                    w-full px-2 py-1.5
                    bg-slate-950/80
                    border border-slate-700
                    rounded
                    text-sm
                    text-slate-100
                    focus:outline-none
                    focus:ring-1 focus:ring-sky-500
                  "
                >
                  <option value="">Unassigned</option>
                  {boardMembers
                    .filter(
                      (member) =>
                        member && member.user && member.user._id && member.user.name
                    )
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
                className="
                  w-full btn btn-danger text-sm
                  mt-1
                  bg-red-600 hover:bg-red-500
                  text-white
                  font-semibold
                  py-2
                  rounded-xl
                  shadow-sm shadow-red-900/70
                  border border-red-500/70
                "
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
