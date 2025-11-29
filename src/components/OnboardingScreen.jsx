import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Building, Ticket } from 'lucide-react';

const AVAILABLE_TAGS = [
  'Running', 'Lifting', 'Yoga', 'CrossFit', 'HIIT', 
  'Pilates', 'Cycling', 'Hiking', 'Swimming', 'Boxing',
  'Nutrition', 'Meditation', 'Calisthenics', 'Dance'
];

export const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    age: '',
    role: 'Partner',
    intent: 'workout',
    tags: [],
    emoji: '💪',
    gym: '',
    guestPass: false,
    bio: ''
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(data);
  };

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) {
      setData({ ...data, tags: data.tags.filter(t => t !== tag) });
    } else if (data.tags.length < 5) {
      setData({ ...data, tags: [...data.tags, tag] });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mb-6 text-gray-400"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">The Basics</h2>
            <input
              type="text"
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4"
              placeholder="First Name"
            />
            <input
              type="number"
              value={data.age}
              onChange={e => setData({ ...data, age: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4"
              placeholder="Age"
            />
            <div className="flex gap-4 overflow-x-auto pb-2">
              {['💪', '🏃‍♀️', '🧘‍♂️', '🥊', '🚴‍♀️', '🤸', '🏋️‍♂️'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setData({ ...data, emoji })}
                  className={`text-3xl p-3 rounded-full border-2 transition ${
                    data.emoji === emoji ? 'border-rose-500 bg-rose-50' : 'border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Role</h2>
            <button
              onClick={() => setData({ ...data, role: 'Partner' })}
              className={`w-full p-6 rounded-2xl border-2 text-left ${
                data.role === 'Partner' ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-bold">Workout Partner</span>
                {data.role === 'Partner' && <Check className="text-rose-500" />}
              </div>
            </button>
            <button
              onClick={() => setData({ ...data, role: 'Coach' })}
              className={`w-full p-6 rounded-2xl border-2 text-left ${
                data.role === 'Coach' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-bold">Coach</span>
                {data.role === 'Coach' && <Check className="text-blue-500" />}
              </div>
            </button>
            <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">
              Goal
            </label>
            <select
              value={data.intent}
              onChange={e => setData({ ...data, intent: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4"
            >
              <option value="workout">Find Partners</option>
              <option value="relationship">Relationship</option>
              <option value="coach">Find Clients</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Gym & Access</h2>
            <div className="relative mb-6">
              <Building className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                value={data.gym}
                onChange={e => setData({ ...data, gym: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-12"
                placeholder="Home Gym Name"
              />
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="text-orange-500" size={24} />
                <div>
                  <h4 className="font-bold">Guest Pass</h4>
                  <p className="text-xs text-gray-500">I can bring a guest</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={data.guestPass}
                onChange={() =>
                  setData({ ...data, guestPass: !data.guestPass })
                }
                className="w-6 h-6 text-rose-500"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-3 rounded-full text-sm transition ${
                    data.tags.includes(tag) ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Bio</h2>
            <textarea
              value={data.bio}
              onChange={e => setData({ ...data, bio: e.target.value })}
              className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        )}
      </div>
      <div className="p-6 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          disabled={step === 1 && !data.name}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {step === 5 ? 'Complete Profile' : 'Continue'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
