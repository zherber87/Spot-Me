// src/components/ProfileScreen.jsx
import React, { useEffect, useState } from 'react';

export function ProfileScreen({ userData, onLogout, onUpgradeClick, onSaveProfile }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    intent: 'Gym Partner',
    bio: '',
    emoji: '👤',
    gym: '',
  });
  const [saving, setSaving] = useState(false);

  // When userData changes (first load or after update), sync local form
  useEffect(() => {
    if (!userData) return;
    setForm({
      name: userData.name || '',
      age: userData.age || '',
      intent: userData.intent || 'Gym Partner',
      bio: userData.bio || '',
      emoji: userData.emoji || '👤',
      gym: userData.gym || '',
    });
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSaveProfile) return;

    setSaving(true);
    try {
      await onSaveProfile({
        name: form.name,
        age: Number(form.age) || 18,
        intent: form.intent,
        bio: form.bio,
        emoji: form.emoji,
        gym: form.gym,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col items-center bg-gray-50">
      {/* Avatar / header */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-sm mb-6 flex flex-col items-center border border-gray-100">
        <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-4xl ring-4 ring-white shadow-lg">
          {form.emoji || '👤'}
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          {form.name || 'User'}
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Member since 2024
        </p>
      </div>

      {/* Editable profile form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
            Name
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
              Age
            </label>
            <input
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
              Emoji
            </label>
            <input
              name="emoji"
              type="text"
              maxLength={2}
              value={form.emoji}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="💪"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
            Looking for
          </label>
          <select
            name="intent"
            value={form.intent}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="Gym Partner">Gym Partner</option>
            <option value="Relationship">Relationship</option>
            <option value="Coach">Coach</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
            Home Gym
          </label>
          <input
            name="gym"
            type="text"
            value={form.gym}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Gold's, Equinox, etc."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
            Bio
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
            placeholder="Tell people about your training style, goals, schedule..."
          />
        </div>

        {/* Stats / membership */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-bold">Daily Swipes</span>
            <span className="text-gray-900 font-black">
              {userData?.swipesLeft ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
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
        </div>

        {/* Save + Upgrade */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

          {!userData?.isPremium && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-100 active:scale-95 transition-all"
            >
              Upgrade to Gold
            </button>
          )}
        </div>
      </form>

      <button
        onClick={onLogout}
        className="mt-6 mb-4 py-4 text-gray-400 font-bold hover:text-rose-500 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
