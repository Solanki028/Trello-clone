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

  const isOverdue =
    card.dueDate && new Date(card.dueDate) < new Date() && !card.isCompleted;
  const dueSoon =
    card.dueDate &&
    new Date(card.dueDate) > new Date() &&
    new Date(card.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group
        rounded-xl
        bg-slate-900/80
        border border-white/10
        px-3 py-3
        mb-2
        cursor-pointer
        shadow-sm shadow-black/40
        hover:shadow-xl
        hover:-translate-y-0.5
        transition-all
        select-none
      `}
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-slate-50 leading-snug">
          {card.title}
        </h4>

        {card.isCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold">
            <span className="text-xs">✓</span>
            Done
          </span>
        )}
      </div>

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.labels.map((label, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white/95 shadow-sm shadow-black/30"
              style={{ backgroundColor: label.color }}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}

      {/* Meta row: due date, description, assignee */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300/90">
        {card.dueDate && (
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full
              border text-[11px]
              ${
                isOverdue
                  ? 'bg-red-500/10 text-red-300 border-red-500/40'
                  : dueSoon
                  ? 'bg-amber-500/10 text-amber-200 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-200 border-slate-600/60'
              }
            `}
          >
            <span className="text-xs">📅</span>
            {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}

        {card.description && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600/70">
            <span className="text-xs">📝</span>
            <span>Description</span>
          </span>
        )}

        {card.assignee && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-600/70">
            <span className="text-xs">👤</span>
            <span className="truncate max-w-[120px]">
              {card.assignee.name}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;
