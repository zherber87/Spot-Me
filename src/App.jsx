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
        <h3 className="text-xl font-bold mb-4">Filters</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Looking for</label>
          <div className="flex gap-2">
            {['any', 'workout', 'coach'].map((type) => (
              <button
                key={type}
                onClick={() => setIntent(type)}
                className={`px-4 py-2 rounded-full text-sm capitalize ${
                  intent === type ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {isPremium ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance ({distance}mi)</label>
              <input 
                type="range" 
                min="1" max="100" 
                value={distance} 
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Gym/Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Gold's Gym Venice"
                className="w-full p-3 bg-gray-100 rounded-xl"
              />
            </div>
          </>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800 border border-yellow-200">
             Upgrade to Premium to filter by distance and specific gyms.
          </div>
        )}

        <button 
            onClick={apply}
            className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl"
        >
            Apply Filters
        </button>
      </div>
    </div>
  );
}

// -------------------- LIKES SCREEN --------------------
function LikesScreen({ likes }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4">
      <h2 className="text-2xl font-bold mb-4">Your Likes</h2>
      {likes.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No likes yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
           {/* Add map logic here if needed */}
        </div>
      )}
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

  // -------------------- RESTORED LOGIC --------------------
  
  // 1. Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user data from Firestore
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        // Load demo profiles for swipe deck
        setProfiles(DEMO_PROFILES);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Handle Auth (Login/Signup)
  const handleAuth = async (isSignup, email, password, profileData) => {
    setAuthLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Initial user document
        const newUserData = {
            uid,
            email,
            ...profileData,
            isPremium: false,
            superSwipes: SUPER_SWIPE_DEFAULT,
            swipesLeft: DAILY_SWIPE_LIMIT,
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', uid), newUserData);
        setUserData(newUserData);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('discover');
  };

  // 4. Handle Upgrade
  const handleUpgrade = async () => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), {
            isPremium: true,
            superSwipes: increment(5)
        });
        setUserData(prev => ({ ...prev, isPremium: true }));
        setShowPremium(false);
        alert("Welcome to Premium!");
    } catch (err) {
        console.error(err);
    }
  };

  // 5. Handle Swipe
  const handleSwipe = async (direction, profile) => {
    if (!user) return;
    
    // Remove card from UI immediately
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));

    if (direction === 'right') {
        // Record the like in Firestore (simplified)
        // Check for match logic would go here
        console.log("Liked:", profile.name);
    }
  };

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
        <IonContent className="bg-gray-200 font-sans text-gray-900 flex justify-center">
          <div className="w-full max-w-md h-screen sm:h-[850px] sm:my-6 bg-white sm:rounded-3xl sm:border-8 sm:border-gray-800 sm:shadow-2xl overflow-hidden flex flex-col relative">
            
            {showPremium && (
              <PremiumModal
                onClose={() => setShowPremium(false)}
                onUpgrade={handleUpgrade}
              />
            )}

            {!selectedMatch && (
              <div className="h-16 px-5 flex items-center justify-between bg-white z-20 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                        Fit
                    </div>
                    <span className="font-bold text-xl tracking-tight">GymRat</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowFilter(true)}>
                        <SlidersHorizontal size={22} className="text-gray-600" />
                    </button>
                    <button onClick={handleLogout}>
                         {/* Simple logout trigger */}
                        <UserIcon size={22} className="text-gray-600" />
                    </button>
                </div>
              </div>
            )}

            {/* MAIN CONTENT */}
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
                <div className="h-full overflow-y-auto p-8 flex flex-col items-center">
                   <h2 className="text-2xl font-bold mb-4">{userData?.name || 'User'}</h2>
                   <button onClick={handleLogout} className="text-red-500 font-bold">Log Out</button>
                </div>
              )}
            </div>

            {/* BOTTOM NAV */}
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