// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  IonApp,
  IonPage,
  IonContent,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { fitnessOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';

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

import { Dumbbell, Star } from 'lucide-react';

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
  },
];

export default function App() {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [userData, setUserData] = useState(null);  // Firestore user document
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false); // auth button spinner
  const [activeTab, setActiveTab] = useState('discover');
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // -------------------- AUTH LISTENER --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);

      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            // Existing auth user but no profile doc yet
            setUserData({
              onboarded: false,
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
        userData.favoriteWorkouts.length === 0 ||
        !userData.photoURL;

      setShowCompleteProfile(incomplete);
    } else {
      setShowCompleteProfile(false);
    }
  }, [user, userData]);

  // -------------------- FETCH PROFILES --------------------
  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, 'users'), where('onboarded', '==', true));
        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== user.uid);

        if (users.length === 0) {
          // probably the only real user – show demo profiles so UI isn’t empty
          setProfiles(DEMO_PROFILES);
        } else {
          setProfiles(users);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setProfiles(DEMO_PROFILES); // fallback so Discover never looks dead
      }
    };

    fetchProfiles();
  }, [user]);

  // -------------------- FETCH MATCHES (REALTIME) --------------------
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'matches'),
      where('userIds', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const matchData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const otherId = data.userIds?.find((id) => id !== user.uid);
        const otherUser =
          data.userSnapshots?.[otherId] || { name: 'User', emoji: '👤' };
        return { id: docSnap.id, ...data, otherUser };
      });
      setMatches(matchData);
    });

    return () => unsub();
  }, [user]);

  // -------------------- AUTH ACTIONS --------------------
  const handleAuth = async (isSignup, email, password, profileData) => {
    try {
      setAuthLoading(true);

      if (!isSignup) {
        // LOGIN
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
        onboarded: true, // so they show in Discover
        swipesLeft: DAILY_SWIPE_LIMIT,           // 50 swipes
        superSwipesLeft: SUPER_SWIPE_DEFAULT,    // 2 super swipes
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
      setUserData((prev) =>
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
      swipesLeft: 99999,            // effectively unlimited
      superSwipesLeft: 20,          // more super swipes as paid perk
    });
    setUserData((prev) =>
      prev ? { ...prev, isPremium: true, swipesLeft: 99999, superSwipesLeft: 20 } : prev
    );
    setShowPremium(false);
    alert('Upgraded to Gold!');
  };

  const handleLogout = async () => {
    await signOut(auth);
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
          <IonContent className="flex items-center justify-center bg-gray-200">
            <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl overflow-hidden shadow-2xl">
              <AuthScreen
                onLogin={(e, p) => handleAuth(false, e, p)}
                onSignup={(e, p, profile) => handleAuth(true, e, p, profile)}
                loading={authLoading}
              />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  // -------------------- MAIN APP WITH TABS --------------------
  return (
    <IonApp>
      <IonPage>
        {/* no flex-center here so header isn’t pushed off-screen on iPhone */}
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
              <div className="h-16 px-6 flex items-center justify-between bg-white z-20 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-500 p-1.5 rounded-lg">
                    <Dumbbell className="text-white" size={20} />
                  </div>
                  <h1 className="text-2xl font-black italic text-gray-800">
                    Spot<span className="text-rose-500">Me</span>
                  </h1>
                </div>
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
              ) : (
                <div className="p-8">
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

            {/* TABS */}
            {!selectedMatch && (
              <IonFooter className="ion-no-border">
                <IonTabBar>
                  <IonTabButton
                    tab="discover"
                    onClick={() => setActiveTab('discover')}
                    selected={activeTab === 'discover'}
                  >
                    <IonIcon icon={fitnessOutline} />
                    <IonLabel>Discover</IonLabel>
                  </IonTabButton>
                  <IonTabButton
                    tab="matches"
                    onClick={() => setActiveTab('matches')}
                    selected={activeTab === 'matches'}
                  >
                    <IonIcon icon={chatbubblesOutline} />
                    <IonLabel>Matches</IonLabel>
                  </IonTabButton>
                  <IonTabButton
                    tab="profile"
                    onClick={() => setActiveTab('profile')}
                    selected={activeTab === 'profile'}
                  >
                    <IonIcon icon={personOutline} />
                    <IonLabel>Profile</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonFooter>
            )}
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
