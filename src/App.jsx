// src/App.jsx
import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
} from 'firebase/firestore';
import {
  Dumbbell,
  MessageCircle,
  User as UserIcon,
  SlidersHorizontal,
  Heart,
  Loader2,
} from 'lucide-react';

// --------- Screens / Components ----------
import { AuthScreen } from './components/AuthScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { ChatScreen } from './components/ChatScreen';
import { FiltersModal } from './components/FiltersModal';
import { LikesScreen } from './components/LikesScreen';
import { UpgradeScreen } from './components/UpgradeScreen';

// -------------------- FIREBASE INIT --------------------

// Vite-style env access
const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

let appInstance = null;
let auth = null;
let db = null;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      'Missing Firebase API key. Check your .env (VITE_FIREBASE_API_KEY).'
    );
  }
  appInstance = initializeApp(firebaseConfig);
  auth = getAuth(appInstance);
  db = getFirestore(appInstance);
} catch (err) {
  console.error('Error initializing Firebase app:', err);
}

// -------------------- CONSTANTS --------------------
const DAILY_SWIPE_LIMIT = 50;
const SUPER_SWIPE_DEFAULT = 2;

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  // Navigation
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'matches' | 'likes' | 'profile' | 'upgrade'
  const [selectedMatch, setSelectedMatch] = useState(null);

  // UI
  const [showFilter, setShowFilter] = useState(false);

  // Data
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);

  const [filters, setFilters] = useState({
    distance: 25,
    intent: 'Any',
    ageMin: 18,
    ageMax: 50,
  });

  // If Firebase failed to init, show a friendly error
  useEffect(() => {
    if (!appInstance || !auth || !db) {
      setFirebaseError(
        'There was a problem connecting to Firebase. Check your Firebase configuration in .env.'
      );
      setLoading(false);
    }
  }, []);

  // 1. Initial Auth Check & Setup + fetch users
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // A) Fetch your profile
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ uid: currentUser.uid, email: currentUser.email });
          }

          // B) Fetch all users for Discover
          const q = query(collection(db, 'users'));
          const querySnapshot = await getDocs(q);

          let allUsers = querySnapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          // Remove yourself
          allUsers = allUsers.filter((u) => u.uid !== currentUser.uid);

          // Simple client-side filters (age + intent)
          const filtered = allUsers.filter((u) => {
            const age = Number(u.age) || 0;
            const matchesAge =
              age >= filters.ageMin && age <= filters.ageMax;
            const matchesIntent =
              filters.intent === 'Any' || u.intent === filters.intent;
            return matchesAge && matchesIntent;
          });

          console.log('Fetched Users:', filtered);
          setProfiles(filtered);

          // Fake likes so LikesScreen isn't empty for now
          setLikes(filtered.slice(0, 6));

          // Placeholder: no real matches logic yet
          setMatches([]);
        } catch (e) {
          console.error('Error fetching data:', e);
        }
      } else {
        setUserData(null);
        setProfiles([]);
        setMatches([]);
        setLikes([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [filters]);

  // 2. Auth Handler (login / signup)
  const handleAuth = async (email, password, profileData = null) => {
    if (!auth || !db) {
      alert('Firebase is not initialized. Check your config.');
      return;
    }

    setAuthLoading(true);
    try {
      if (profileData) {
        // --- SIGN UP ---
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCredential.user.uid;

        const newUserData = {
          uid,
          email,
          name: profileData.name || 'User',
          age: Number(profileData.age) || 18,
          intent: profileData.intent || 'Gym Partner',
          bio: profileData.bio || '',
          emoji: profileData.emoji || '👤',
          gym: profileData.gym || '',
          isPremium: false,
          superSwipes: SUPER_SWIPE_DEFAULT,
          swipesLeft: DAILY_SWIPE_LIMIT,
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', uid), newUserData);
        setUserData(newUserData);
      } else {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Logout
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setActiveTab('discover');
      setSelectedMatch(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  // 4. Upgrade Handler (called from UpgradeScreen)
  const handleUpgrade = async () => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        superSwipes: increment(5),
      });
      setUserData((prev) => ({ ...prev, isPremium: true }));
      setActiveTab('profile');
    } catch (err) {
      console.error('Upgrade failed', err);
      alert('Upgrade failed. Please try again.');
    }
  };

  // 5. Swipe Handler (like / pass)
  const handleSwipe = async (direction, profile) => {
    if (!user || !db) return;

    // Remove card from local state
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));

    if (direction === 'right') {
      console.log(`Liked ${profile.name}`);
      // TODO: store likes in Firestore if you want
    }
  };

  // 6. Save Profile (from ProfileScreen)
  const handleSaveProfile = async (updates) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserData((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Could not save profile. Please try again.');
    }
  };

  // -------------------- RENDER --------------------

  if (firebaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-500 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Firebase Error</h1>
          <p className="text-sm mb-4">{firebaseError}</p>
          <p className="text-xs text-gray-500">
            Open the console for more details and verify your Firebase configuration.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-rose-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // Not Logged In -> Auth screen
  if (!user) {
    return (
      <div className="flex justify-center min-h-screen bg-gray-200 font-sans">
        <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:my-6 sm:rounded-3xl sm:border-8 sm:border-gray-800 overflow-hidden shadow-2xl">
          <AuthScreen
            onLogin={(e, p) => handleAuth(e, p)}
            onSignup={(e, p, d) => handleAuth(e, p, d)}
            loading={authLoading}
          />
        </div>
      </div>
    );
  }

  // Logged In -> Main App
  return (
    <div className="flex justify-center min-h-screen bg-gray-200 font-sans text-gray-900">
      <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:my-6 sm:rounded-3xl sm:border-8 sm:border-gray-800 overflow-hidden shadow-2xl flex flex-col relative">
        {/* Filters Modal */}
        {showFilter && (
          <FiltersModal
            filters={filters}
            onClose={() => setShowFilter(false)}
            onApply={(newFilters) => setFilters(newFilters)}
          />
        )}

        {/* Header (hidden in chat + upgrade for cleaner look if you want) */}
        {!selectedMatch && activeTab !== 'upgrade' && (
          <header className="h-16 shrink-0 px-4 flex items-center justify-between bg-white z-30 relative shadow-sm border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-rose-200 shadow-md">
                <Dumbbell size={20} className="fill-white/20 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-gray-800">
                SpotMe
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <SlidersHorizontal size={20} strokeWidth={2.5} />
              </button>

              <button
                onClick={() => setActiveTab('likes')}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${
                  activeTab === 'likes'
                    ? 'bg-rose-50 text-rose-500'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Heart
                  size={20}
                  strokeWidth={2.5}
                  className={activeTab === 'likes' ? 'fill-rose-500' : ''}
                />
                {userData?.isPremium === false && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
              </button>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative w-full bg-white">
          {selectedMatch ? (
            <ChatScreen
              match={selectedMatch}
              onBack={() => setSelectedMatch(null)}
              currentUser={user}
            />
          ) : activeTab === 'discover' ? (
            <DiscoverScreen
              profiles={profiles}
              onSwipe={handleSwipe}
              onTriggerPremium={() => setActiveTab('upgrade')}
            />
          ) : activeTab === 'matches' ? (
            <MatchesScreen
              matches={matches}
              onSelectMatch={setSelectedMatch}
            />
          ) : activeTab === 'likes' ? (
            <LikesScreen
              likes={likes}
              isPremium={userData?.isPremium}
              onUnlock={() => setActiveTab('upgrade')}
            />
          ) : activeTab === 'profile' ? (
            <ProfileScreen
              userData={userData}
              onLogout={handleLogout}
              onUpgradeClick={() => setActiveTab('upgrade')}
              onSaveProfile={handleSaveProfile}
            />
          ) : activeTab === 'upgrade' ? (
            <UpgradeScreen
              userData={userData}
              onBack={() => setActiveTab('profile')}
              onConfirmUpgrade={handleUpgrade}
            />
          ) : null}
        </main>

        {/* Bottom Navigation (hide in chat + optional hide in upgrade) */}
        {!selectedMatch && activeTab !== 'upgrade' && (
          <nav className="h-[72px] shrink-0 border-t border-gray-100 bg-white flex items-center justify-around pb-2 px-2 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'discover'
                  ? 'text-rose-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Dumbbell
                size={26}
                strokeWidth={activeTab === 'discover' ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'discover' ? 'opacity-100' : 'opacity-0'
                } transition-opacity`}
              >
                Discover
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'matches'
                  ? 'text-rose-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <MessageCircle
                size={26}
                strokeWidth={activeTab === 'matches' ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'matches' ? 'opacity-100' : 'opacity-0'
                } transition-opacity`}
              >
                Matches
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'profile'
                  ? 'text-rose-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <UserIcon
                size={26}
                strokeWidth={activeTab === 'profile' ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-bold ${
                  activeTab === 'profile' ? 'opacity-100' : 'opacity-0'
                } transition-opacity`}
              >
                Profile
              </span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
