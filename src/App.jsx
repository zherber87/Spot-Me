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

// simple demo profiles so Discover never looks empty while testing alone
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              What are you looking for?
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'any', label: 'Any' },
                { value: 'workout', label: 'Gym partner' },
                { value: 'relationship', label: 'Relationship' },
                { value: 'coach', label: 'Coach' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntent(opt.value)}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    intent === opt.value
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Premium location block */}
          <div className="relative mt-2">
            <div
              className={`p-3 rounded-2xl border ${
                isPremium ? 'border-gray-200 bg-gray-50' : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  Location & distance
                </p>
                {!isPremium && (
                  <span className="text-[10px] font-semibold text-yellow-700">
                    Gold feature
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-gray-600">
                    Distance (miles)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    disabled={!isPremium}
                    className="w-full"
                  />
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Up to {distance} miles
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-gray-600">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    disabled={!isPremium}
                    placeholder="City / Zip (Gold only)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {!isPremium && (
              <div className="absolute inset-0 rounded-2xl bg-white/40 pointer-events-none flex items-center justify-center px-4">
                <p className="text-[11px] text-center font-semibold text-yellow-800">
                  Upgrade to SpotMe Gold to set location & distance filters.
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={apply}
          className="mt-5 w-full py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-rose-600 transition"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}

// -------------------- LIKES SCREEN --------------------
function LikesScreen({ likes }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">People you liked</h2>
        <p className="text-xs text-gray-500 mt-1">
          These are profiles you&apos;ve liked. When they like you back, you&apos;ll match.
        </p>
      </div>

      {likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-xs">
          <Heart size={32} className="mb-3 opacity-60" />
          <p>No likes yet. Start swiping on Discover.</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {likes.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
            >
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt={u.name}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                  {u.emoji || '🏋️‍♂️'}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {u.name || 'SpotMe user'}
                  {u.age && <span className="text-gray-500 text-xs">, {u.age}</span>}
                </p>
                {u.gym && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {u.gym}
                  </p>
                )}
                {u.favoriteWorkouts?.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Likes: {u.favoriteWorkouts.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------- MAIN APP --------------------
export default function App() {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [userData, setUserData] = useState(null);  // Firestore user document
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'matches' | 'profile' | 'likes'
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

  // -------------------- AUTH LISTENER --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);

      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            setUserData({
              swipesLeft: DAILY_SWIPE_LIMIT,
              superSwipesLeft: SUPER_SWIPE_DEFAULT,
              isPremium: false,
            });
          }
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error('Error loading user document:', err);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // -------------------- FINISH PROFILE POPUP --------------------
  useEffect(() => {
    if (user && userData) {
      const incomplete =
        !userData.name ||
        !userData.age ||
        !userData.favoriteWorkouts ||
        userData.favoriteWorkouts.length === 0;

      setShowCompleteProfile(incomplete);
    } else {
      setShowCompleteProfile(false);
    }
  }, [user, userData]);

  // -------------------- FETCH PROFILES (APPLY INTENT FILTER) --------------------
  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, 'users'), where('onboarded', '==', true));
        const snapshot = await getDocs(q);
        let usersList = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== user.uid);

        // filter by intent if user set it (workout / relationship / coach)
        if (filterOptions.intent && filterOptions.intent !== 'any') {
          usersList = usersList.filter(
            u => u.intent === filterOptions.intent
          );
        }

        if (usersList.length === 0) {
          setProfiles(DEMO_PROFILES);
        } else {
          setProfiles(usersList);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setProfiles(DEMO_PROFILES);
      }
    };

    fetchProfiles();
  }, [user, filterOptions.intent]);

  // -------------------- FETCH MATCHES (REALTIME) --------------------
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'matches'),
      where('userIds', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, snapshot => {
      const matchData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const otherId = data.userIds?.find(id => id !== user.uid);
        const otherUser =
          data.userSnapshots?.[otherId] || { name: 'User', emoji: '👤' };
        return { id: docSnap.id, ...data, otherUser };
      });
      setMatches(matchData);
    });

    return () => unsub();
  }, [user]);

  // -------------------- FETCH LIKES (WHEN PREMIUM & IN LIKES TAB) --------------------
  useEffect(() => {
    if (!user || !userData?.isPremium || activeTab !== 'likes') return;

    const fetchLikes = async () => {
      try {
        const likesCol = collection(db, 'users', user.uid, 'likes');
        const snap = await getDocs(likesCol);

        const likedUsers = await Promise.all(
          snap.docs.map(async d => {
            const uSnap = await getDoc(doc(db, 'users', d.id));
            if (uSnap.exists()) {
              return { id: uSnap.id, ...uSnap.data() };
            }
            return null;
          })
        );

        setLikes(likedUsers.filter(Boolean));
      } catch (err) {
        console.error('Error fetching likes:', err);
        setLikes([]);
      }
    };

    fetchLikes();
  }, [user, userData, activeTab]);

  // -------------------- AUTH ACTIONS --------------------
  const handleAuth = async (isSignup, email, password, profileData) => {
    try {
      setAuthLoading(true);

      if (!isSignup) {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      }

      // SIGNUP + ONBOARDING IN ONE
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      let photoURL = null;
      if (profileData?.photoFile) {
        const storageRef = ref(storage, `profilePhotos/${uid}`);
        await uploadBytes(storageRef, profileData.photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const docData = {
        email,
        name: profileData.name,
        age: profileData.age,
        gym: profileData.gym || '',
        guestPass: profileData.guestPass || false,
        tags: profileData.favoriteWorkouts || [],
        favoriteWorkouts: profileData.favoriteWorkouts || [],
        bio: profileData.bio || '',
        photoURL: photoURL,
        // default intent: looking for gym partner
        intent: profileData.intent || 'workout',
        onboarded: true,
        swipesLeft: DAILY_SWIPE_LIMIT,
        superSwipesLeft: SUPER_SWIPE_DEFAULT,
        isPremium: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid), docData);
      setUserData(docData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // -------------------- SWIPE LOGIC --------------------
  const handleSwipe = async (direction, targetProfile) => {
    if (!user || !userData || !targetProfile) return;
    if (direction === 'left') return;

    // decrement swipes if not premium
    if (!userData.isPremium) {
      await updateDoc(doc(db, 'users', user.uid), {
        swipesLeft: increment(-1),
      });
      setUserData(prev =>
        prev
          ? { ...prev, swipesLeft: (prev.swipesLeft || 1) - 1 }
          : prev
      );
    }

    const theirLikeRef = doc(
      db,
      'users',
      targetProfile.id,
      'likes',
      user.uid
    );
    const theirLikeSnap = await getDoc(theirLikeRef);

    if (theirLikeSnap.exists()) {
      await addDoc(collection(db, 'matches'), {
        userIds: [user.uid, targetProfile.id],
        userSnapshots: {
          [user.uid]: {
            name: userData.name,
            emoji: '💪',
            photoURL: userData.photoURL || null,
          },
          [targetProfile.id]: {
            name: targetProfile.name,
            emoji: targetProfile.emoji || '🏋️‍♂️',
            photoURL: targetProfile.photoURL || null,
          },
        },
        createdAt: serverTimestamp(),
      });
      alert("It's a Match! 🎉");
    } else {
      await setDoc(
        doc(db, 'users', user.uid, 'likes', targetProfile.id),
        {
          timestamp: serverTimestamp(),
        }
      );
    }
  };

  // -------------------- PAYWALL / UPGRADE --------------------
  const handleUpgrade = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      isPremium: true,
      swipesLeft: 99999,
      superSwipesLeft: 20,
    });
    setUserData(prev =>
      prev
        ? { ...prev, isPremium: true, swipesLeft: 99999, superSwipesLeft: 20 }
        : prev
    );
    setShowPremium(false);
    alert('Upgraded to Gold!');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleLikesIcon = () => {
    if (!userData?.isPremium) {
      setShowPremium(true);
    } else {
      setActiveTab('likes');
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
        <IonContent className="bg-gray-200 font-sans text-gray-900">
          <div className="w-full max-w-md h-full min-h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl sm:border-8 sm:border-gray-800 sm:shadow-2xl overflow-hidden flex flex-col relative mx-auto">
            {showPremium && (
              <PremiumModal
                onClose={() => setShowPremium(false)}
                onUpgrade={handleUpgrade}
              />
            )}

            {/* 🔔 Finish profile popup for incomplete accounts */}
            {showCompleteProfile && !selectedMatch && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                <div className="bg-white rounded-2xl p-5 w-80 shadow-xl">
                  <h3 className="font-bold text-lg mb-1">Finish your profile</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your name, age, workouts, and a photo so people know who
                    they&apos;re matching with.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowCompleteProfile(false);
                    }}
                    className="w-full mb-2 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold"
                  >
                    Complete profile
                  </button>
                  <button
                    onClick={() => setShowCompleteProfile(false)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            )}

            {/* HEADER */}
            {!selectedMatch && (
              <div className="h-16 px-5 flex items-center justify-between bg-white z-20 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-500 p-1.5 rounded-lg">
                    <Dumbbell className="text-white" size={20} />
                  </div>
                  <h1 className="text-2xl font-black italic text-gray-800">
                    Spot<span className="text-rose-500">Me</span>
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full leading-tight text-right">
                    {userData?.isPremium ? (
                      'GOLD'
                    ) : (
                      <>
                        {userData?.swipesLeft ?? 0} swipes
                        <br />
                        ⚡ {userData?.superSwipesLeft ?? 0} super
                      </>
                    )}
                  </div>

                  {activeTab === 'discover' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLikesIcon}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                      >
                        <Heart
                          size={18}
                          className={userData?.isPremium ? 'text-rose-500' : 'text-gray-500'}
                        />
                      </button>
                      <button
                        onClick={() => setShowFilter(true)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                      >
                        <SlidersHorizontal size={18} className="text-gray-600" />
                      </button>
                    </div>
                  )}
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
                <div className="h-full overflow-y-auto p-8">
                  <h2 className="text-2xl font-bold mb-4">Profile</h2>
                  <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-4 items-center">
                    {userData?.photoURL && (
                      <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    )}
                    <div>
                      <p className="font-bold text-lg">
                        {userData?.name || user.email}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {userData?.gym || 'No Gym Set'}
                      </p>
                      {userData?.favoriteWorkouts?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Likes: {userData.favoriteWorkouts.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {!userData?.isPremium && (
                    <button
                      onClick={() => setShowPremium(true)}
                      className="mb-4 w-full py-2 bg-yellow-400 font-bold rounded-lg text-yellow-900 flex items-center justify-center gap-2"
                    >
                      <Star size={16} /> Upgrade
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-500 font-bold text-sm"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* BOTTOM NAV (inside shell so always visible) */}
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

          {/* FILTER SHEET OVERLAY */}
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
