// src/LikesScreen.jsx
import React from "react";
import { Heart, Lock } from "lucide-react";

export function LikesScreen({ likes, isPremium, onUnlock }) {
  return (
    <div className="h-full bg-white p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Likes</h2>

      {likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 p-6">
          <Heart size={50} className="text-gray-300 mb-4" />
          <p>No likes yet. Keep swiping!</p>
        </div>
      ) : (
        <>

          {!isPremium && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-4 flex items-center gap-3">
              <Lock size={20} className="text-amber-600" />
              <p className="flex-1 text-sm text-amber-800 font-medium">
                Upgrade to Gold to see everyone who liked you.
              </p>
              <button
                onClick={onUnlock}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold"
              >
                Unlock
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-10">
            {likes.map((user, i) => (
              <div
                key={i}
                className={`bg-gray-50 rounded-2xl p-3 flex flex-col items-center shadow-sm border border-gray-100 ${
                  !isPremium ? "blur-[3px]" : ""
                }`}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-3xl">
                  {user.emoji || "👤"}
                </div>
                <p className="text-xs font-bold mt-2 text-gray-700">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-gray-400">{user.age}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
