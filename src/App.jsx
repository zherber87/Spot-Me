// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  IonApp,
  IonPage,
  IonContent,
} from '@ionic/react';

import { auth, db, storage } from './firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import {
  Dumbbell,
  Star,
  MessageCircle,
  User as UserIcon,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';

import { PremiumModal } from './components/PremiumModal';
import { AuthScreen } from './components/AuthScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { ChatScreen } from './components/ChatScreen';

// -------------------- CONSTANTS --------------------
const DAILY_SWIPE_LIMIT = 50;
const SUPER_SWIPE_DEFAULT = 2;

// demo profiles...
const DEMO_PROFILES = [
  {
    id: 'demo-1',
    name: 'Sarah',
    age: 27,
    gym: 'Equinox',
    guestPass: true,
    favoriteWorkouts: ['Running', 'HIIT'],
    tags: ['Running', 'HIIT'],
    bio: 'Training for my first half marathon. Love early morning sessions.',
    emoji: '🏃‍♀️',
    photoURL: null,
    intent: 'workout',
  },
  {
    id: 'demo-2',
    name: 'Coach Mike',
    age: 32,
    gym: 'Gold’s Gym',
    guestPass: false,
    favoriteWorkouts: ['Lifting', 'Powerlifting'],
    tags: ['Lifting', 'Powerlifting'],
    bio: 'Personal trainer focused on strength and form. Looking for serious partners.',
    emoji: '💪',
    photoURL: null,
    intent: 'coach',
  },
];

// -------------------- FILTER SHEET --------------------
function FilterSheet({ open, onClose, current, onApply, isPremium }) {
  const [intent, setIntent] = useState(current.intent || 'any');
  const [distance, setDistance] = useState(current.distance || 25);
  const [location, setLocation] = useState(current.location || '');

  useEffect(() => {
    setIntent(current.intent || 'any');
    setDistance(current.distance || 25);
    setLocation(current.location || '');
  }, [current]);

  if (!open) return null;

  const apply = () => {
    const next = { intent };
    if (isPremium) {
      next.distance = distance;
      next.location = location;
    }
    onApply(next);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-40">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-6 shadow-2xl">
        {/* ...unchanged filter content... */}
      </div>
    </div>
  );
}

// -------------------- LIKES SCREEN --------------------
function LikesScreen({ likes }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* ...unchanged likes UI... */}
    </div>
  );
}

// -------------------- MAIN APP --------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    intent: 'any',
    distance: 25,
    location: '',
  });

  // --- all your useEffects + handleAuth + handleSwipe + handleUpgrade + handleLogout + handleLikesIcon stay the same ---

  // -------------------- RENDER STATES --------------------
  if (loading) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="flex items-center justify-center">
            Loading...
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  if (!user) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="bg-gray-100">
            <AuthScreen
              onLogin={(e, p) => handleAuth(false, e, p)}
              onSignup={(e, p, profile) => handleAuth(true, e, p, profile)}
              loading={authLoading}
            />
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  // -------------------- MAIN APP WITH PHONE SHELL --------------------
  return (
    <IonApp>
      <IonPage>
        {/* ✨ KEY CHANGE: make content a flex-center horizontally, no vertical scroll */}
        <IonContent className="bg-gray-200 font-sans text-gray-900 flex justify-center">
          {/* ✨ KEY CHANGE: phone shell uses h-screen so bottom nav is always at viewport bottom */}
          <div className="w-full max-w-md h-screen sm:h-[850px] sm:my-6 bg-white sm:rounded-3xl sm:border-8 sm:border-gray-800 sm:shadow-2xl overflow-hidden flex flex-col relative">
            {showPremium && (
              <PremiumModal
                onClose={() => setShowPremium(false)}
                onUpgrade={handleUpgrade}
              />
            )}

            {/* finish profile popup stays the same */}

            {!selectedMatch && (
              <div className="h-16 px-5 flex items-center justify-between bg-white z-20 shadow-sm">
                {/* header content unchanged */}
              </div>
            )}

            {/* MAIN CONTENT – this takes remaining space between header and bottom nav */}
            <div className="flex-1 overflow-hidden relative bg-gray-50 w-full">
              {selectedMatch ? (
                <ChatScreen
                  match={selectedMatch}
                  onBack={() => setSelectedMatch(null)}
                  currentUser={user}
                  db={db}
                />
              ) : activeTab === 'discover' ? (
                <DiscoverScreen
                  profiles={profiles}
                  onSwipe={handleSwipe}
                  user={userData}
                  onTriggerPremium={() => setShowPremium(true)}
                />
              ) : activeTab === 'matches' ? (
                <MatchesScreen
                  matches={matches}
                  onSelectMatch={setSelectedMatch}
                />
              ) : activeTab === 'likes' ? (
                <LikesScreen likes={likes} />
              ) : (
                <div className="h-full overflow-y-auto p-8">
                  {/* profile content unchanged */}
                </div>
              )}
            </div>

            {/* ✨ BOTTOM NAV: sits at bottom of the shell (which is h-screen) */}
            {!selectedMatch && (
              <div className="h-16 border-t border-gray-200 bg-white flex items-center justify-around">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] ${
                    activeTab === 'discover' ? 'text-rose-500' : 'text-gray-400'
                  }`}
                >
                  <Dumbbell size={20} />
                  <span className="font-semibold">Discover</span>
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] ${
                    activeTab === 'matches' ? 'text-rose-500' : 'text-gray-400'
                  }`}
                >
                  <MessageCircle size={20} />
                  <span className="font-semibold">Matches</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] ${
                    activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400'
                  }`}
                >
                  <UserIcon size={20} />
                  <span className="font-semibold">Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* FILTER SHEET OVERLAY (full-screen) */}
          <FilterSheet
            open={showFilter}
            onClose={() => setShowFilter(false)}
            current={filterOptions}
            onApply={setFilterOptions}
            isPremium={!!userData?.isPremium}
          />
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
