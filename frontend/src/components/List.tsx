import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { List as ListType, Card as CardType } from '../types';
import CardComponent from './Card';

interface ListProps {
  list: ListType;
  onAddCard: (listId: string, title: string) => void;
  onCardClick: (card: CardType) => void;
  onDeleteList: (listId: string) => void;
}

const List: React.FC<ListProps> = ({ list, onAddCard, onCardClick, onDeleteList }) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list._id,
    data: {
      type: 'list',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(list._id, newCardTitle);
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full"
    >
      {/* List Header */}
      <div className="p-2 flex items-center justify-between" {...attributes} {...listeners}>
        <h3 className="font-semibold text-gray-800 px-2">{list.title}</h3>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-500 hover:text-gray-700 px-2"
        >
          ⋯
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-8 bg-white rounded shadow-lg py-1 z-10">
            <button
              onClick={() => {
                if (window.confirm('Delete this list and all its cards?')) {
                  onDeleteList(list._id);
                }
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete List
            </button>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <SortableContext
          items={(list.cards || []).map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {(list.cards || []).map((card) => (
              <CardComponent
                key={card._id}
                card={card}
                onClick={() => onCardClick(card)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Card Form */}
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="mt-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              className="w-full px-2 py-1 rounded border border-gray-300 resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button type="submit" className="btn btn-primary text-sm py-1">
                Add Card
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full text-left text-gray-600 hover:bg-gray-200 rounded px-2 py-1 mt-2"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
};

export default List;
