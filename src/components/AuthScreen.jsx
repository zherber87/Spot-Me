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
    setIsLogin((prev) => !prev);
    resetAll();
  };

  const toggleWorkout = (w) => {
    setFavoriteWorkouts((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  // ---------- LOGIN SUBMIT ----------
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    onLogin(email, password);
  };

  // ---------- SIGNUP STEP 1: CHECK EMAIL + MOVE TO STEP 2 ----------
  const handleSignupStep1 = async (e) => {
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
        setError('An account with this email already exists. Please log in instead.');
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
  const handleSignupComplete = (e) => {
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top logo / branding (fixed, not cut off) */}
      <div className="w-full px-6 pt-10 pb-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500 p-2 rounded-xl shadow-md">
            <Dumbbell className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic text-gray-900 leading-tight">
              Spot<span className="text-rose-500">Me</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Find workout partners & coaches
            </p>
          </div>
        </div>
      </div>

      {/* Card container */}
      <div className="flex-1 w-full flex justify-center px-4 pb-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
          {/* Tabs: Login / Sign Up */}
          <div className="flex border-b border-gray-100">
            <button
              className={`flex-1 py-3 text-sm font-semibold ${
                isLogin ? 'text-gray-900 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
              onClick={() => {
                if (!isLogin) handleToggleMode();
              }}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold ${
                !isLogin ? 'text-gray-900 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
              onClick={() => {
                if (isLogin) handleToggleMode();
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* ERROR BANNER */}
            {error && (
              <div className="mb-4 text-xs bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* LOGIN MODE */}
            {isLogin && (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="email"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 transition disabled:opacity-60"
                >
                  {loading ? 'Please wait…' : 'Log In'}
                </button>
              </form>
            )}

            {/* SIGNUP MODE */}
            {!isLogin && (
              <>
                {/* STEP HEADER WITH BACK ARROW ON STEP 2 */}
                <div className="flex items-center justify-between mb-4">
                  {step === 2 ? (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center text-xs text-gray-500"
                    >
                      <ArrowLeft size={16} className="mr-1" /> Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <p className="text-[11px] text-gray-400">
                    Step {step} of 2
                  </p>
                </div>

                {/* STEP 1: Email + password */}
                {step === 1 && (
                  <form className="space-y-4" onSubmit={handleSignupStep1}>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                          type="email"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                          type="password"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                          type="password"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Repeat your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 transition disabled:opacity-60"
                    >
                      {loading ? 'Checking…' : 'Continue'}
                    </button>
                  </form>
                )}

                {/* STEP 2: Profile */}
                {step === 2 && (
                  <form className="space-y-4" onSubmit={handleSignupComplete}>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Zach"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Age
                      </label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="27"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Home Gym
                      </label>
                      <div className="relative">
                        <Building
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={18}
                        />
                        <input
                          type="text"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Gold's Gym, EOS, LA Fitness…"
                          value={gym}
                          onChange={(e) => setGym(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Ticket className="text-orange-500" size={18} />
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            Guest pass
                          </p>
                          <p className="text-[10px] text-gray-500">
                            I can bring a partner with me
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuestPass((prev) => !prev)}
                        className={`w-10 h-6 rounded-full flex items-center ${
                          guestPass ? 'bg-rose-500 justify-end' : 'bg-gray-300 justify-start'
                        } px-1 transition`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Favorite workouts
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FAVORITE_WORKOUT_OPTIONS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => toggleWorkout(w)}
                            className={`text-[11px] px-3 py-1.5 rounded-full border ${
                              favoriteWorkouts.includes(w)
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
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

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Short bio
                      </label>
                      <textarea
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                        rows={3}
                        placeholder="Share your goals, training style, schedule..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        Profile photo
                      </label>
                      <label className="flex items-center justify-between bg-gray-50 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-500 cursor-pointer">
                        <span className="flex items-center gap-2">
                          <ImageIcon size={16} className="text-gray-400" />
                          {photoFile ? photoFile.name : 'Tap to upload a photo'}
                        </span>
                        <span className="text-[10px] text-gray-400">
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
                      className="w-full mt-4 bg-rose-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md hover:bg-rose-600 transition disabled:opacity-60"
                    >
                      {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
