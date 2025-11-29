// src/components/AuthScreen.jsx
import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowLeft,
  Dumbbell,
  Building,
  Ticket,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

import { auth } from '../firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

// Local options for favorite workouts
const FAVORITE_WORKOUT_OPTIONS = [
  'Weight Lifting',
  'Running',
  'Hiking',
  'CrossFit',
  'HIIT',
  'Cycling',
  'Yoga',
];

export function AuthScreen({ onLogin, onSignup, loading }) {
  const [isLogin, setIsLogin] = useState(true);

  // Step 1: basic auth info
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: profile info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gym, setGym] = useState('');
  const [guestPass, setGuestPass] = useState(false);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const [error, setError] = useState('');

  const resetAll = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setAge('');
    setGym('');
    setGuestPass(false);
    setFavoriteWorkouts([]);
    setBio('');
    setPhotoFile(null);
    setError('');
  };

  const handleToggleMode = () => {
    setIsLogin(prev => !prev);
    resetAll();
  };

  const toggleWorkout = w => {
    setFavoriteWorkouts(prev =>
      prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
    );
  };

  const handlePhotoChange = e => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  // ---------- LOGIN SUBMIT ----------
  const handleLoginSubmit = e => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    onLogin(email, password);
  };

  // ---------- SIGNUP STEP 1: CHECK EMAIL + MOVE TO STEP 2 ----------
  const handleSignupStep1 = async e => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Check if email already has sign-in methods
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setError(
          'An account with this email already exists. Please log in instead.'
        );
        return;
      }

      // OK to proceed to profile step (no account created yet)
      setError('');
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error checking email.');
    }
  };

  // ---------- SIGNUP STEP 2: COMPLETE PROFILE + CREATE ACCOUNT ----------
  const handleSignupComplete = e => {
    e.preventDefault();
    setError('');

    if (!name || !age || favoriteWorkouts.length === 0) {
      setError('Please add your name, age, and at least one workout type.');
      return;
    }

    const profileData = {
      name,
      age,
      gym,
      guestPass,
      favoriteWorkouts,
      bio,
      photoFile,
    };

    onSignup(email, password, profileData);
  };

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-start sm:items-center justify-center px-4 py-6">
      {/* Phone-style shell */}
      <div className="w-full max-w-md bg-slate-950/80 border border-white/10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden relative">
        {/* Top brand strip */}
        <div className="bg-gradient-to-br from-rose-500 via-rose-400 to-orange-400 px-6 pt-7 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black/15 backdrop-blur-sm p-2.5 rounded-2xl shadow-inner">
              <Dumbbell className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic text-white leading-tight tracking-tight">
                Spot<span className="text-black/90">Me</span>
              </h1>
              <p className="text-[11px] text-white/80 mt-0.5">
                Find workout partners &amp; coaches
              </p>
            </div>
          </div>

          {/* Tiny app badge */}
          <div className="hidden sm:flex flex-col items-end text-[10px] text-white/80">
            <span className="px-2 py-0.5 rounded-full bg-black/20 font-semibold">
              Beta
            </span>
          </div>
        </div>

        {/* White card content area */}
        <div className="bg-slate-950/80 px-3 pb-4 pt-3">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Mode switch (Login / Signup) */}
            <div className="px-4 pt-4">
              <div className="bg-slate-100 rounded-full p-1 flex">
                <button
                  className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                    isLogin
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-500'
                  }`}
                  onClick={() => {
                    if (!isLogin) handleToggleMode();
                  }}
                >
                  Log In
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                    !isLogin
                      ? 'bg-white shadow text-slate-900'
                      : 'text-slate-500'
                  }`}
                  onClick={() => {
                    if (isLogin) handleToggleMode();
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="max-h-[520px] overflow-y-auto px-5 pb-5 pt-3">
              {/* ERROR BANNER */}
              {error && (
                <div className="mb-4 text-[11px] bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              {/* LOGIN MODE */}
              {isLogin && (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-2.5 text-slate-400"
                        size={18}
                      />
                      <input
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="you@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-2.5 text-slate-400"
                        size={18}
                      />
                      <input
                        type="password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 active:bg-rose-700 transition disabled:opacity-60"
                  >
                    {loading ? 'Please wait…' : 'Log In'}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    By continuing, you agree to our Terms &amp; Privacy.
                  </p>
                </form>
              )}

              {/* SIGNUP MODE */}
              {!isLogin && (
                <>
                  {/* STEP HEADER WITH BACK ARROW ON STEP 2 */}
                  <div className="flex items-center justify-between mb-3 mt-1">
                    {step === 2 ? (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center text-[11px] text-slate-500"
                      >
                        <ArrowLeft size={16} className="mr-1" /> Back
                      </button>
                    ) : (
                      <span className="text-[11px] text-transparent">Back</span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            step === 1 ? 'bg-rose-500' : 'bg-rose-200'
                          }`}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            step === 2 ? 'bg-rose-500' : 'bg-rose-200'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Step {step} of 2
                      </p>
                    </div>
                  </div>

                  {/* STEP 1: Email + password */}
                  {step === 1 && (
                    <form className="space-y-4" onSubmit={handleSignupStep1}>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Email
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-2.5 text-slate-400"
                            size={18}
                          />
                          <input
                            type="email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="you@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-2.5 text-slate-400"
                            size={18}
                          />
                          <input
                            type="password"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-2.5 text-slate-400"
                            size={18}
                          />
                          <input
                            type="password"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={e =>
                              setConfirmPassword(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 active:bg-rose-700 transition disabled:opacity-60"
                      >
                        {loading ? 'Checking…' : 'Continue'}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: Profile */}
                  {step === 2 && (
                    <form className="space-y-4" onSubmit={handleSignupComplete}>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          First name
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Zach"
                          value={name}
                          onChange={e => setName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Age
                        </label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="27"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Home gym
                        </label>
                        <div className="relative">
                          <Building
                            className="absolute left-3 top-2.5 text-slate-400"
                            size={18}
                          />
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="Gold's Gym, EOS, LA Fitness…"
                            value={gym}
                            onChange={e => setGym(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Ticket className="text-orange-500" size={18} />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              Guest pass
                            </p>
                            <p className="text-[10px] text-slate-500">
                              I can bring a partner with me
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGuestPass(prev => !prev)}
                          className={`w-10 h-6 rounded-full flex items-center ${
                            guestPass
                              ? 'bg-rose-500 justify-end'
                              : 'bg-slate-300 justify-start'
                          } px-1 transition`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Favorite workouts
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {FAVORITE_WORKOUT_OPTIONS.map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => toggleWorkout(w)}
                              className={`text-[11px] px-3 py-1.5 rounded-full border ${
                                favoriteWorkouts.includes(w)
                                  ? 'bg-rose-500 text-white border-rose-500'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              } flex items-center gap-1`}
                            >
                              {favoriteWorkouts.includes(w) && (
                                <Check size={12} className="shrink-0" />
                              )}
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Short bio
                        </label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                          rows={3}
                          placeholder="Share your goals, training style, schedule..."
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Profile photo
                        </label>
                        <label className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-500 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-slate-400" />
                            {photoFile
                              ? photoFile.name
                              : 'Tap to upload a photo'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            JPG or PNG
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 active:bg-rose-700 transition disabled:opacity-60"
                      >
                        {loading ? 'Creating account…' : 'Create account'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
