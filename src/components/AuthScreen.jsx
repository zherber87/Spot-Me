// src/components/AuthScreen.jsx
import React, { useState } from 'react';
import {
  Dumbbell,
  Mail,
  Lock,
  User,
  Camera,
  Check,
  Building,
  Ticket,
} from 'lucide-react';

const WORKOUT_OPTIONS = [
  'Weightlifting',
  'Running',
  'Hiking',
  'CrossFit',
  'Yoga',
  'Cycling',
  'HIIT',
];

export function AuthScreen({ onLogin, onSignup, loading }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState(1); // 1 = auth, 2 = onboarding

  // Step 1 (auth)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 (profile)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gym, setGym] = useState('');
  const [guestPass, setGuestPass] = useState(false);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]); // no <string[]>
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null); // no File | null
  const [photoPreview, setPhotoPreview] = useState(null);

  const toggleWorkout = (w) => {
    setFavoriteWorkouts((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetProfile = () => {
    setStep(1);
    setName('');
    setAge('');
    setGym('');
    setGuestPass(false);
    setFavoriteWorkouts([]);
    setBio('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStep(1);
    resetProfile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'login') {
      return onLogin(email, password);
    }

    // SIGNUP
    if (step === 1) {
      if (!email || !password) {
        alert('Please enter email and password.');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!name || !age) {
        alert('Please enter your name and age.');
        return;
      }
      if (favoriteWorkouts.length === 0) {
        alert('Pick at least one favorite workout type.');
        return;
      }

      const profileData = {
        name,
        age: Number(age),
        gym,
        guestPass,
        favoriteWorkouts,
        bio,
        photoFile, // File object; App will upload it
      };

      return onSignup(email, password, profileData);
    }
  };

  const showProfileStep = mode === 'signup' && step === 2;

  return (
    <div className="flex flex-col h-full bg-white p-6 sm:p-8 justify-center">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-rose-500 p-4 rounded-2xl shadow-lg mb-3">
          <Dumbbell className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-black italic text-gray-800 tracking-tighter">
          Spot<span className="text-rose-500">Me</span>
        </h1>
        {mode === 'signup' && (
          <p className="text-xs text-gray-500 mt-2 uppercase font-semibold tracking-wide">
            Find workout partners & coaches
          </p>
        )}
      </div>

      {/* Step indicator for signup */}
      {mode === 'signup' && (
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full ${
                step === 1
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-100 text-rose-500'
              }`}
            >
              1
            </span>
            <span>Account</span>
            <span className="w-6 border-t border-gray-300 mx-1" />
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full ${
                step === 2
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-100 text-rose-500'
              }`}
            >
              2
            </span>
            <span>Profile</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!showProfileStep && (
          <>
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                required
              />
            </div>
          </>
        )}

        {/* PROFILE STEP */}
        {showProfileStep && (
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-gray-400" size={28} />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1.5 shadow cursor-pointer">
                  <Camera className="text-white" size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-semibold text-gray-700">Profile photo</p>
                <p>Optional, but helps people recognize you.</p>
              </div>
            </div>

            {/* Name + Age */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="First name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                />
              </div>
              <input
                type="number"
                min="18"
                max="99"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
              />
            </div>

            {/* Gym + Guest Pass */}
            <div className="space-y-2">
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Home gym (optional)"
                  value={gym}
                  onChange={(e) => setGym(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setGuestPass((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-xs font-semibold ${
                  guestPass
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Ticket size={16} />
                  I can bring a guest pass
                </span>
                {guestPass && (
                  <span className="flex items-center gap-1 text-amber-700">
                    <Check size={14} /> Yes
                  </span>
                )}
              </button>
            </div>

            {/* Favorite workouts */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Favorite types of workouts (pick at least one)
              </p>
              <div className="flex flex-wrap gap-2">
                {WORKOUT_OPTIONS.map((w) => {
                  const active = favoriteWorkouts.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWorkout(w)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        active
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <textarea
                placeholder="Tell people what you’re looking for (times you train, goals, etc.)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-600 transition disabled:opacity-60 text-sm"
        >
          {loading
            ? 'Please wait...'
            : mode === 'login'
            ? 'Sign In'
            : step === 1
            ? 'Continue'
            : 'Create Account'}
        </button>
      </form>

      {/* Toggle login/signup */}
      <div className="mt-6 text-center">
        {mode === 'login' ? (
          <button
            onClick={() => switchMode('signup')}
            className="text-rose-500 font-bold text-sm hover:underline"
          >
            New here? Create an account
          </button>
        ) : (
          <button
            onClick={() => switchMode('login')}
            className="text-gray-500 font-semibold text-sm hover:underline"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
