// src/components/MatchesScreen.jsx
import React from 'react';
import { Dumbbell } from 'lucide-react';

export const MatchesScreen = ({ matches, onSelectMatch }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Matches</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(!matches || matches.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Dumbbell size={48} className="mb-4 opacity-50" />
            <p>No matches yet. Keep swiping 💪</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {m.otherUser?.emoji || '👤'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {m.otherUser?.name || 'User'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Tap to open chat
                  </p>
                </div>
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
