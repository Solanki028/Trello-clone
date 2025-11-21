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
  const hasRecommendations =
    dueDateSuggestions.length > 0 ||
    listMovementSuggestions.length > 0 ||
    relatedCards.length > 0;

  return (
    <div
      className="
        fixed right-0 top-0
        h-full
        w-full sm:w-96
        z-50
        overflow-y-auto
        animate-slide-up
        flex
        justify-end
      "
    >
      <div
        className="
          h-full
          w-full sm:w-96
          bg-slate-950/95
          text-slate-50
          shadow-2xl shadow-black/70
          border-l border-white/10
          backdrop-blur-xl
          flex flex-col
        "
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900/90 to-slate-800/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-lg">
              💡
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                Smart Recommendations
              </h2>
              <p className="text-[11px] text-slate-300">
                AI suggestions to keep your board organized
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              text-slate-400 hover:text-slate-100
              text-xl leading-none
              rounded-full
              w-8 h-8
              flex items-center justify-center
              hover:bg-slate-800/80
              transition
            "
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {!hasRecommendations && (
            <div className="text-center py-10 px-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/80 mb-3">
                💭
              </div>
              <p className="text-sm text-slate-300">
                No recommendations at this time.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add more cards or update details to get fresh suggestions.
              </p>
            </div>
          )}

          {/* Due Date Suggestions */}
          {dueDateSuggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2 text-sm">
                <span className="text-base">📅</span>
                <span>Suggested Due Dates</span>
              </h3>
              <div className="space-y-3">
                {dueDateSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.cardId}
                    className="
                      bg-slate-900/80
                      rounded-xl
                      p-3
                      border border-slate-700/80
                      shadow-sm shadow-black/60
                    "
                  >
                    <p className="font-medium text-xs text-slate-50 mb-1.5">
                      {suggestion.cardTitle}
                    </p>
                    <p className="text-[11px] text-slate-300 mb-2">
                      {suggestion.reason}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/40">
                        <span>📆</span>
                        {new Date(suggestion.suggestedDate).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() =>
                          onApplyDueDate(
                            suggestion.cardId,
                            suggestion.suggestedDate
                          )
                        }
                        className="
                          btn btn-primary
                          text-[11px]
                          py-1 px-3
                          rounded-lg
                          bg-sky-500 hover:bg-sky-400
                          text-white
                          border-0
                          font-medium
                          shadow-sm shadow-sky-900/60
                        "
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
              <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2 text-sm">
                <span className="text-base">➡️</span>
                <span>Suggested Moves</span>
              </h3>
              <div className="space-y-3">
                {listMovementSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.cardId}
                    className="
                      bg-slate-900/80
                      rounded-xl
                      p-3
                      border border-slate-700/80
                      shadow-sm shadow-black/60
                    "
                  >
                    <p className="font-medium text-xs text-slate-50 mb-1.5">
                      {suggestion.cardTitle}
                    </p>
                    <p className="text-[11px] text-slate-300 mb-2">
                      {suggestion.reason}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-200">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">
                          {suggestion.currentList}
                        </span>
                        <span className="text-slate-500 text-[10px]">→</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-200">
                          {suggestion.suggestedList}
                        </span>
                      </span>
                      <button
                        onClick={() =>
                          onApplyListMove(
                            suggestion.cardId,
                            suggestion.suggestedListId
                          )
                        }
                        className="
                          btn btn-primary
                          text-[11px]
                          py-1 px-3
                          rounded-lg
                          bg-emerald-500 hover:bg-emerald-400
                          text-white
                          border-0
                          font-medium
                          shadow-sm shadow-emerald-900/60
                        "
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
              <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2 text-sm">
                <span className="text-base">🔗</span>
                <span>Related Cards</span>
              </h3>
              <div className="space-y-3">
                {relatedCards.map((group, index) => (
                  <div
                    key={index}
                    className="
                      bg-slate-900/80
                      rounded-xl
                      p-3
                      border border-slate-700/80
                      shadow-sm shadow-black/60
                    "
                  >
                    <p className="font-medium text-xs text-slate-50 mb-1.5">
                      {group.mainCard.cardTitle}
                    </p>
                    <p className="text-[11px] text-slate-300 mb-2">
                      {group.suggestion}
                    </p>
                    <div className="space-y-1">
                      {group.relatedCards.map((related) => (
                        <div
                          key={related.cardId}
                          className="text-[11px] flex items-center gap-2 text-slate-200"
                        >
                          <span className="text-slate-500">•</span>
                          <span className="truncate">
                            {related.cardTitle}
                          </span>
                          {related.commonKeywords.length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              ({related.commonKeywords.join(', ')})
                            </span>
                          )}
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
    </div>
  );
};

export default RecommendationsPanel;
