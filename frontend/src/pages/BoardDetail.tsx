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
        const overIndex = overType === 'card' ? cards.findIndex((c) => c._id === over.id) : cards.length;

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
      const overListId = over.data.current?.type === 'card' 
        ? over.data.current?.listId 
        : over.id;

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: board?.backgroundColor || '#0079bf' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: board.backgroundColor }}>
      {/* Header */}
      <header className="bg-black bg-opacity-20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/boards')}
              className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded"
            >
              ← Boards
            </button>
            <h1 className="text-xl font-bold text-white">{board.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Members Display */}
            <div className="flex items-center -space-x-2 mr-2">
              {board.members
                .filter(member => member && member.user && member.user._id && member.user.name)
                .slice(0, 5)
                .map((member) => {
                  const isOwner = member.user._id === board.owner._id;
                  return (
                    <div
                      key={member.user._id}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white ${
                        isOwner ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                      title={`${member.user.name}${isOwner ? ' (Admin of board)' : ''}`}
                    >
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                  );
                })}
              {board.members.filter(member => member && member.user).length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                  +{board.members.filter(member => member && member.user).length - 5}
                </div>
              )}
            </div>
            <button
              onClick={fetchRecommendations}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm"
            >
              💡 Recommendations
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm"
            >
              👥 Invite
            </button>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start h-full">
            <SortableContext
              items={lists.map((l) => l._id)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <ListComponent
                  key={list._id}
                  list={list}
                  onAddCard={handleAddCard}
                  onCardClick={setSelectedCard}
                  onDeleteList={handleDeleteList}
                />
              ))}
            </SortableContext>

            {/* Add List */}
            <div className="w-72 flex-shrink-0">
              {isAddingList ? (
                <form onSubmit={handleAddList} className="bg-gray-100 rounded-lg p-2">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-2 py-1 rounded border border-gray-300 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary text-sm py-1">
                      Add List
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-3 text-left"
                >
                  + Add another list
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardComponent card={activeCard} isDragging />}
            {activeList && (
              <div className="bg-gray-100 rounded-lg p-2 w-72 opacity-80">
                <h3 className="font-semibold">{activeList.title}</h3>
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
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default BoardDetail;
