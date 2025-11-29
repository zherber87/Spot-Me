// src/components/DiscoverScreen.jsx
import React, { useState } from 'react';
import {
  Dumbbell,
  Heart,
  X,
  User,
  Award,
  Ticket,
  Building
} from 'lucide-react';

export const DiscoverScreen = ({ profiles, onSwipe, user, onTriggerPremium }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = (dir) => {
    if (!currentProfile) return;

    // Right swipe = like
    if (dir === 'right') {
      if (!user?.isPremium && (user?.swipesLeft ?? 0) <= 0) {
        onTriggerPremium?.();
        return;
      }
    }

    setDirection(dir);

    setTimeout(() => {
      onSwipe?.(dir, currentProfile);
      setDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  };

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Dumbbell className="text-gray-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">No more profiles!</h3>
        <p className="text-gray-500 text-sm mt-2">
          Check back later as more people join SpotMe.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-gray-50">
      <div className="flex-1 px-4 py-4 relative">
        <div
          className={`w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transform transition-all duration-300 ${
            direction === 'left'
              ? '-translate-x-full rotate-[-10deg]'
              : direction === 'right'
              ? 'translate-x-full rotate-[10deg]'
              : ''
          }`}
        >
          <div
            className={`h-3/5 ${
              currentProfile.imageColor || 'bg-blue-100'
            } relative flex items-center justify-center`}
          >
            <span className="text-9xl drop-shadow-xl">
              {currentProfile.emoji || '💪'}
            </span>

            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 uppercase flex items-center gap-1 shadow-sm">
              {currentProfile.role === 'Coach' ? (
                <Award size={12} className="text-blue-500" />
              ) : (
                <User size={12} className="text-rose-500" />
              )}
              {currentProfile.role || 'Partner'}
            </div>

            {currentProfile.guestPass && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                <Ticket size={12} />
                Guest Pass
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentProfile.name || 'User'}
              {currentProfile.age ? `, ${currentProfile.age}` : ''}
            </h2>

            {currentProfile.gym && (
              <div className="flex items-center text-rose-500 text-sm font-medium mt-1">
                <Building size={14} className="mr-1" />
                {currentProfile.gym}
            </div>
            )}

            <p className="text-gray-600 leading-snug my-4 line-clamp-3">
              {currentProfile.bio || 'No bio yet.'}
            </p>

            <div className="flex flex-wrap gap-2">
              {currentProfile.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Swipe buttons */}
      <div className="h-24 px-8 pb-6 flex items-center justify-center gap-8">
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-white rounded-full shadow-lg text-gray-400 flex items-center justify-center border border-gray-100"
        >
          <X size={32} />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-rose-500 rounded-full shadow-lg text-white flex items-center justify-center ring-4 ring-rose-100"
        >
          <Heart size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
