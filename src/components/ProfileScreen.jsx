// src/ProfileScreen.jsx
import React, { useEffect, useState } from 'react';

export function ProfileScreen({
  userData,
  onLogout,
  onUpgradeClick,
  onSaveProfile,   // <- new callback from App
}) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    intent: 'Gym Partner',
    bio: '',
    emoji: '👤',
    gym: '',
  });
  const [saving, setSaving] = useState(false);

  // Sync form with latest userData
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

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col items-center bg-gray-50">
      {/* Avatar + basic info */}
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
        className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 mb-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Your Profile
        </h3>

        <div className="grid grid-cols-2 gap-3">
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
              required
            />
          </div>
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
              required
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
            placeholder="Gold's, 24 Hour, Equinox..."
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
            value={form.emoji}
            onChange={handleChange}
            maxLength={4}
            className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-center text-2xl"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Any emoji you want for your card (e.g. 💪 😈 🏋️‍♂️).
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
            Bio
          </label>
          <textarea
            name="bio"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell people about your training style, goals, schedule..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !onSaveProfile}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* Stats + membership */}
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
