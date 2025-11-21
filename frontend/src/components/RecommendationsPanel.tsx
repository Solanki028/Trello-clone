import React from 'react';
import { Recommendations } from '../types';

interface RecommendationsPanelProps {
  recommendations: Recommendations;
  onClose: () => void;
  onApplyDueDate: (cardId: string, dueDate: string) => void;
  onApplyListMove: (cardId: string, listId: string) => void;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  onClose,
  onApplyDueDate,
  onApplyListMove,
}) => {
  const { dueDateSuggestions, listMovementSuggestions, relatedCards } = recommendations;
  const hasRecommendations = dueDateSuggestions.length > 0 || listMovementSuggestions.length > 0 || relatedCards.length > 0;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto animate-slide-up">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">💡 Recommendations</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
      </div>

      <div className="p-4 space-y-6">
        {!hasRecommendations && (
          <p className="text-gray-500 text-center py-8">No recommendations at this time. Add more cards to get suggestions!</p>
        )}

        {/* Due Date Suggestions */}
        {dueDateSuggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">📅 Suggested Due Dates</h3>
            <div className="space-y-3">
              {dueDateSuggestions.map((suggestion) => (
                <div key={suggestion.cardId} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm mb-1">{suggestion.cardTitle}</p>
                  <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-trello-blue">
                      {new Date(suggestion.suggestedDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onApplyDueDate(suggestion.cardId, suggestion.suggestedDate)}
                      className="btn btn-primary text-xs py-1 px-2"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List Movement Suggestions */}
        {listMovementSuggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">➡️ Suggested Moves</h3>
            <div className="space-y-3">
              {listMovementSuggestions.map((suggestion) => (
                <div key={suggestion.cardId} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm mb-1">{suggestion.cardTitle}</p>
                  <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {suggestion.currentList} → <span className="text-trello-blue">{suggestion.suggestedList}</span>
                    </span>
                    <button
                      onClick={() => onApplyListMove(suggestion.cardId, suggestion.suggestedListId)}
                      className="btn btn-primary text-xs py-1 px-2"
                    >
                      Move
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Cards */}
        {relatedCards.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">🔗 Related Cards</h3>
            <div className="space-y-3">
              {relatedCards.map((group, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm mb-2">{group.mainCard.cardTitle}</p>
                  <p className="text-xs text-gray-600 mb-2">{group.suggestion}</p>
                  <div className="space-y-1">
                    {group.relatedCards.map((related) => (
                      <div key={related.cardId} className="text-xs flex items-center gap-2">
                        <span>•</span>
                        <span>{related.cardTitle}</span>
                        <span className="text-gray-400">({related.commonKeywords.join(', ')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
