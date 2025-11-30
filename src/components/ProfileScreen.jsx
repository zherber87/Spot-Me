// src/ProfileScreen.jsx
import React from 'react';

export function ProfileScreen({ userData, onLogout, onUpgradeClick }) {
  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col items-center bg-gray-50">
      <div className="w-full bg-white rounded-3xl p-6 shadow-sm mb-6 flex flex-col items-center border border-gray-100">
        <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-4xl ring-4 ring-white shadow-lg">
          {userData?.emoji || '👤'}
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          {userData?.name || 'User'}
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Member since 2024
        </p>
      </div>
      
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-600 font-bold">Daily Swipes</span>
          <span className="text-gray-900 font-black">
            {userData?.swipesLeft ?? 0}
          </span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-600 font-bold">Membership</span>
          <span
            className={`font-black uppercase text-sm px-2 py-1 rounded ${
              userData?.isPremium
                ? 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {userData?.isPremium ? 'Gold' : 'Free'}
          </span>
        </div>
        {!userData?.isPremium && (
          <button
            onClick={onUpgradeClick}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-100 active:scale-95 transition-all"
          >
            Upgrade to Gold
          </button>
        )}
      </div>

      <button
        onClick={onLogout}
        className="mt-auto py-6 text-gray-400 font-bold hover:text-rose-500 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
