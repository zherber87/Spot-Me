import React from 'react';
import { X, Star } from 'lucide-react';

export const PremiumModal = ({ onClose, onUpgrade, type = 'limit' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 opacity-20"></div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
      >
        <X size={20} />
      </button>

      <div className="relative z-10 flex flex-col items-center text-center mt-4">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-lg mb-4">
          <Star className="text-white fill-current" size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          {type === 'limit' ? 'Out of Swipes?' : 'See Who Likes You'}
        </h2>
        <p className="text-gray-500 mb-6 px-4">
          Upgrade to SpotMe Gold for unlimited access.
        </p>

        <button
          onClick={onUpgrade}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          Upgrade to Gold
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
            $9.99/mo
          </span>
        </button>
      </div>
    </div>
  </div>
);
