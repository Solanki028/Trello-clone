const Card = require('../models/Card');
const List = require('../models/List');

const URGENT_KEYWORDS = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'today', 'now', 'high priority'];
const SOON_KEYWORDS = ['soon', 'this week', 'important', 'priority'];
const LATER_KEYWORDS = ['later', 'low priority', 'someday', 'maybe', 'future'];

const IN_PROGRESS_KEYWORDS = ['started', 'working on', 'in progress', 'doing', 'currently', 'wip'];
const DONE_KEYWORDS = ['completed', 'done', 'finished', 'resolved', 'closed', 'tested', 'deployed'];
const BLOCKED_KEYWORDS = ['blocked', 'waiting', 'stuck', 'issue', 'problem'];

const suggestDueDate = (card) => {
  const text = `${card.title} ${card.description}`.toLowerCase();
  
  // Check for urgent keywords
  if (URGENT_KEYWORDS.some(keyword => text.includes(keyword))) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      cardId: card._id,
      cardTitle: card.title,
      suggestedDate: tomorrow,
      reason: 'Card contains urgent keywords',
      confidence: 'high'
    };
  }
  
  // Check for soon keywords
  if (SOON_KEYWORDS.some(keyword => text.includes(keyword))) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      cardId: card._id,
      cardTitle: card.title,
      suggestedDate: nextWeek,
      reason: 'Card indicates near-term priority',
      confidence: 'medium'
    };
  }
  
  // Check for later keywords
  if (LATER_KEYWORDS.some(keyword => text.includes(keyword))) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      cardId: card._id,
      cardTitle: card.title,
      suggestedDate: nextMonth,
      reason: 'Card indicates lower priority',
      confidence: 'low'
    };
  }
  
  return null;
};

const suggestListMovement = async (card, lists) => {
  const text = `${card.title} ${card.description}`.toLowerCase();
  const currentList = lists.find(l => l._id.toString() === card.list.toString());
  
  if (!currentList) return null;
  
  const currentListTitle = currentList.title.toLowerCase();
  
  // Suggest moving to "In Progress" if card indicates work has started
  if (IN_PROGRESS_KEYWORDS.some(keyword => text.includes(keyword))) {
    const inProgressList = lists.find(l => 
      l.title.toLowerCase().includes('progress') || 
      l.title.toLowerCase().includes('doing')
    );
    
    if (inProgressList && inProgressList._id.toString() !== card.list.toString()) {
      return {
        cardId: card._id,
        cardTitle: card.title,
        currentList: currentList.title,
        suggestedList: inProgressList.title,
        suggestedListId: inProgressList._id,
        reason: 'Card description indicates work in progress',
        confidence: 'high'
      };
    }
  }
  
  // Suggest moving to "Done" if card indicates completion
  if (DONE_KEYWORDS.some(keyword => text.includes(keyword))) {
    const doneList = lists.find(l => 
      l.title.toLowerCase().includes('done') || 
      l.title.toLowerCase().includes('complete')
    );
    
    if (doneList && doneList._id.toString() !== card.list.toString()) {
      return {
        cardId: card._id,
        cardTitle: card.title,
        currentList: currentList.title,
        suggestedList: doneList.title,
        suggestedListId: doneList._id,
        reason: 'Card description indicates completion',
        confidence: 'high'
      };
    }
  }
  
  // Suggest moving to "Blocked" if card indicates issues
  if (BLOCKED_KEYWORDS.some(keyword => text.includes(keyword))) {
    const blockedList = lists.find(l => 
      l.title.toLowerCase().includes('blocked') || 
      l.title.toLowerCase().includes('waiting')
    );
    
    if (blockedList && blockedList._id.toString() !== card.list.toString()) {
      return {
        cardId: card._id,
        cardTitle: card.title,
        currentList: currentList.title,
        suggestedList: blockedList.title,
        suggestedListId: blockedList._id,
        reason: 'Card description indicates blocking issues',
        confidence: 'medium'
      };
    }
  }
  
  return null;
};

const findRelatedCards = (cards) => {
  const relatedGroups = [];
  const processedCards = new Set();
  
  cards.forEach((card, index) => {
    if (processedCards.has(card._id.toString())) return;
    
    const cardWords = `${card.title} ${card.description}`
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3); // Only consider words longer than 3 chars
    
    const related = [];
    
    cards.forEach((otherCard, otherIndex) => {
      if (index === otherIndex || processedCards.has(otherCard._id.toString())) return;
      
      const otherWords = `${otherCard.title} ${otherCard.description}`
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      // Find common words
      const commonWords = cardWords.filter(word => otherWords.includes(word));
      
      // If there are 2 or more common words, consider them related
      if (commonWords.length >= 2) {
        related.push({
          cardId: otherCard._id,
          cardTitle: otherCard.title,
          commonKeywords: commonWords.slice(0, 3) // Show up to 3 common keywords
        });
        processedCards.add(otherCard._id.toString());
      }
    });
    
    if (related.length > 0) {
      relatedGroups.push({
        mainCard: {
          cardId: card._id,
          cardTitle: card.title
        },
        relatedCards: related,
        reason: 'Cards share common keywords',
        suggestion: 'Consider grouping these cards together or creating a label'
      });
      processedCards.add(card._id.toString());
    }
  });
  
  return relatedGroups;
};

const generateRecommendations = async (boardId) => {
  try {
    // Get all cards and lists for the board
    const cards = await Card.find({ board: boardId, isArchived: false });
    const lists = await List.find({ board: boardId, isArchived: false });
    
    const recommendations = {
      dueDateSuggestions: [],
      listMovementSuggestions: [],
      relatedCards: []
    };
    
    // Generate due date suggestions for cards without due dates
    for (const card of cards) {
      if (!card.dueDate) {
        const suggestion = suggestDueDate(card);
        if (suggestion) {
          recommendations.dueDateSuggestions.push(suggestion);
        }
      }
    }
    
    // Generate list movement suggestions
    for (const card of cards) {
      const suggestion = await suggestListMovement(card, lists);
      if (suggestion) {
        recommendations.listMovementSuggestions.push(suggestion);
      }
    }
    
    // Find related cards
    if (cards.length > 1) {
      recommendations.relatedCards = findRelatedCards(cards);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

module.exports = {
  generateRecommendations
};
