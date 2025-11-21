import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isDragging?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: card._id,
    data: {
      type: 'card',
      card,
      listId: card.list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.isCompleted;
  const dueSoon = card.dueDate && 
    new Date(card.dueDate) > new Date() && 
    new Date(card.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="card p-3 cursor-pointer hover:shadow-md"
    >
      <h4 className="text-sm font-medium text-gray-800 mb-2">{card.title}</h4>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {card.labels.map((label, index) => (
          <span
            key={index}
            className="px-2 py-0.5 rounded text-xs text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.text}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        {card.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : dueSoon ? 'text-yellow-600' : ''}`}>
            📅 {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}
        {card.description && (
          <span className="flex items-center gap-1">
            📝
          </span>
        )}
        {card.assignee && (
          <span className="flex items-center gap-1">
            👤 {card.assignee.name}
          </span>
        )}
        {card.isCompleted && (
          <span className="text-green-600">✓</span>
        )}
      </div>
    </div>
  );
};

export default Card;
