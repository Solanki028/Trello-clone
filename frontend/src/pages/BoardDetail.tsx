import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { boardAPI, listAPI, cardAPI } from '../services/api';
import { Board, List as ListType, Card as CardType, Recommendations } from '../types';
import ListComponent from '../components/List';
import CardComponent from '../components/Card';
import CardModal from '../components/CardModal';
import RecommendationsPanel from '../components/RecommendationsPanel';
import InviteMemberModal from '../components/InviteMemberModal';

const BoardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchBoard = useCallback(async () => {
    try {
      const data = await boardAPI.getBoard(id!);
      setBoard(data);
      setLists(data.lists || []);
    } catch (err) {
      console.error('Failed to fetch board:', err);
      navigate('/boards');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchBoard();
    }
  }, [id, fetchBoard]);

  const fetchRecommendations = async () => {
    try {
      const data = await boardAPI.getRecommendations(id!);
      setRecommendations(data);
      setShowRecommendations(true);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === 'card') {
      setActiveCard(active.data.current?.card);
    } else if (activeType === 'list') {
      setActiveList(active.data.current?.list);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== 'card') return;

    const activeListId = active.data.current?.listId;
    const overListId = overType === 'card' ? over.data.current?.listId : over.id;

    // For same-list moves, allow optimistic updates
    if (activeListId === overListId) {
      setLists((prev) => {
        const listIndex = prev.findIndex((l) => l._id === activeListId);
        if (listIndex === -1) return prev;

        const newLists = [...prev];
        const cards = [...(newLists[listIndex].cards || [])];

        const activeIndex = cards.findIndex((c) => c._id === active.id);
        const overIndex =
          overType === 'card' ? cards.findIndex((c) => c._id === over.id) : cards.length;

        if (activeIndex === -1 || overIndex === -1) return prev;

        const [movedCard] = cards.splice(activeIndex, 1);
        cards.splice(overIndex, 0, movedCard);

        newLists[listIndex] = { ...newLists[listIndex], cards };
        return newLists;
      });
    }
    // For cross-list moves, don't do optimistic updates - wait for API response
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveList(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'list') {
      if (active.id !== over.id) {
        const oldIndex = lists.findIndex((l) => l._id === active.id);
        const newIndex = lists.findIndex((l) => l._id === over.id);
        const newLists = arrayMove(lists, oldIndex, newIndex);
        setLists(newLists);
        await listAPI.reorderLists(id!, newLists);
      }
    } else if (activeType === 'card') {
      const activeListId = active.data.current?.listId;
      const overListId =
        over.data.current?.type === 'card' ? over.data.current?.listId : over.id;

      const listIndex = lists.findIndex((l) => l._id === overListId);
      if (listIndex === -1) return;

      const cards = lists[listIndex].cards || [];
      const cardIndex = cards.findIndex((c) => c._id === active.id);

      if (activeListId !== overListId) {
        await cardAPI.moveCard(active.id as string, overListId as string, cardIndex);
        // Reorder both old and new lists' positions after moving the card
        const oldListIndex = lists.findIndex((l) => l._id === activeListId);
        if (oldListIndex !== -1) {
          const oldListCards = lists[oldListIndex].cards || [];
          await cardAPI.reorderCards(activeListId as string, oldListCards);
        }
        await cardAPI.reorderCards(overListId as string, cards);
        setToastMessage('Card moved to different list');
        // Refresh board data to ensure consistency
        await fetchBoard();
      } else {
        await cardAPI.reorderCards(overListId as string, cards);
        setToastMessage('Card reordered');
      }
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const newList = await listAPI.createList(newListTitle, id!);
      setLists([...lists, { ...newList, cards: [] }]);
      setNewListTitle('');
      setIsAddingList(false);
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      const newCard = await cardAPI.createCard(title, listId, id!);
      setLists((prev) =>
        prev.map((list) =>
          list._id === listId
            ? { ...list, cards: [...(list.cards || []), newCard] }
            : list
        )
      );
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<CardType>) => {
    try {
      const updatedCard = await cardAPI.updateCard(cardId, updates);
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          cards: list.cards?.map((card) =>
            card._id === cardId ? updatedCard : card
          ),
        }))
      );
      if (selectedCard?._id === cardId) {
        setSelectedCard(updatedCard);
      }
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await cardAPI.deleteCard(cardId);
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          cards: list.cards?.filter((card) => card._id !== cardId),
        }))
      );
      setSelectedCard(null);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await listAPI.deleteList(listId);
      setLists((prev) => prev.filter((list) => list._id !== listId));
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  const handleApplyDueDate = async (cardId: string, dueDate: string) => {
    await handleUpdateCard(cardId, { dueDate });
    fetchRecommendations();
  };

  const handleApplyListMove = async (cardId: string, listId: string) => {
    const card = lists.flatMap((l) => l.cards || []).find((c) => c._id === cardId);
    if (!card) return;

    try {
      await cardAPI.moveCard(cardId, listId, 0);
      fetchBoard();
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to move card:', err);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
        style={{ backgroundColor: board?.backgroundColor || '#0b1120' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent" />
            <div className="absolute inset-0 blur-lg opacity-40 bg-white rounded-full" />
          </div>
          <p className="text-slate-100 text-sm tracking-wide uppercase">
            Loading board…
          </p>
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: board.backgroundColor }}
    >
      {/* Background gradient + noise overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/40 via-black/10 to-black/60" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),_transparent_55%)]" />

      {/* Main content container */}
      <div className="relative flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg shadow-black/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: back + title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/boards')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 hover:bg-white/15 hover:border-white/40 transition"
                >
                  <span className="text-base">←</span>
                  <span className="hidden sm:inline">All boards</span>
                  <span className="sm:hidden">Boards</span>
                </button>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white tracking-tight">
                    {board.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200/80 mt-0.5">
                    Organize tasks, track progress & collaborate in real-time.
                  </p>
                </div>
              </div>

              {/* Right: members + actions */}
              <div className="flex items-center gap-3">
                {/* Members Display */}
                <div className="flex items-center -space-x-2">
                  {board.members
                    .filter(
                      (member) =>
                        member && member.user && member.user._id && member.user.name
                    )
                    .slice(0, 5)
                    .map((member) => {
                      const isOwner = member.user._id === board.owner._id;
                      return (
                        <div
                          key={member.user._id}
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs border-2 border-white/80 shadow-sm ${
                            isOwner
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                              : 'bg-slate-600/90'
                          }`}
                          title={`${member.user.name}${
                            isOwner ? ' (Admin of board)' : ''
                          }`}
                        >
                          {isOwner && (
                            <span className="absolute -top-1 -right-1 text-[10px]">
                              👑
                            </span>
                          )}
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                  {board.members.filter((member) => member && member.user).length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-slate-700/90 border-2 border-white/70 flex items-center justify-center text-white text-[11px] font-semibold">
                      +
                      {board.members.filter((member) => member && member.user).length -
                        5}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRecommendations}
                    className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 px-3 py-1.5 text-xs sm:text-sm text-sky-50 font-medium transition"
                  >
                    <span>💡</span>
                    <span>Insights</span>
                  </button>
                  <button
                    onClick={fetchRecommendations}
                    className="sm:hidden inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/25 px-2.5 py-1.5 text-xs text-sky-50 font-medium transition"
                    title="AI Recommendations"
                  >
                    💡
                  </button>

                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-md shadow-sky-900/40 transition"
                  >
                    <span>👥</span>
                    <span className="hidden sm:inline">Invite</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Board Content */}
        <div className="flex-1 overflow-x-auto px-3 sm:px-4 pb-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 sm:gap-4 items-start h-full pb-6">
              <SortableContext
                items={lists.map((l) => l._id)}
                strategy={horizontalListSortingStrategy}
              >
                {lists.map((list) => (
                  <div
                    key={list._id}
                    className="flex-shrink-0 w-72 max-w-[18rem]"
                  >
                    <ListComponent
                      list={list}
                      onAddCard={handleAddCard}
                      onCardClick={setSelectedCard}
                      onDeleteList={handleDeleteList}
                    />
                  </div>
                ))}
              </SortableContext>

              {/* Add List */}
              <div className="w-72 flex-shrink-0">
                {isAddingList ? (
                  <form
                    onSubmit={handleAddList}
                    className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3 shadow-lg shadow-black/40"
                  >
                    <input
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Enter list title…"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-500/70 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 placeholder:text-slate-400 mb-3"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary text-xs sm:text-sm py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white border-0 shadow-sm shadow-sky-900/40 transition"
                      >
                        Add List
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingList(false)}
                        className="text-slate-300 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-700/70 transition"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingList(true)}
                    className="w-full rounded-2xl border border-dashed border-white/30 bg-white/10 hover:bg-white/15 text-slate-100/90 text-sm px-4 py-3 text-left flex items-center gap-2 shadow-sm shadow-black/40 transition"
                  >
                    <span className="text-lg">＋</span>
                    <span className="font-medium">Add another list</span>
                  </button>
                )}
              </div>
            </div>

            <DragOverlay>
              {activeCard && (
                <div className="transform scale-[1.02]">
                  <CardComponent card={activeCard} isDragging />
                </div>
              )}
              {activeList && (
                <div className="bg-slate-900/80 border border-white/15 rounded-xl p-3 w-72 opacity-90 shadow-2xl shadow-black/70">
                  <h3 className="font-semibold text-slate-50 text-sm">
                    {activeList.title}
                  </h3>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Card Modal */}
        {selectedCard && (
          <CardModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            boardMembers={board.members}
          />
        )}

        {/* Recommendations Panel */}
        {showRecommendations && recommendations && (
          <RecommendationsPanel
            recommendations={recommendations}
            onClose={() => setShowRecommendations(false)}
            onApplyDueDate={handleApplyDueDate}
            onApplyListMove={handleApplyListMove}
          />
        )}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <InviteMemberModal
            boardId={board._id}
            onClose={() => setShowInviteModal(false)}
            onMemberAdded={fetchBoard}
          />
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-slate-900/95 border border-slate-600/80 text-slate-50 px-4 py-2.5 rounded-xl shadow-xl shadow-black/60 text-sm flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardDetail;
