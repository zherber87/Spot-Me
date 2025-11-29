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

import { auth, db } from './firebase';
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

import { Dumbbell, Star } from 'lucide-react';

import { PremiumModal } from './components/PremiumModal';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { ChatScreen } from './components/ChatScreen';

const DAILY_SWIPE_LIMIT = 5;

export default function App() {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [userData, setUserData] = useState(null);  // Firestore user document
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPremium, setShowPremium] = useState(false);

  // AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);

      const loadUserDoc = async () => {
        try {
          if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
              setUserData(snap.data());
            } else {
              // New user, create default state in memory
              setUserData({
                onboarded: false,
                swipesLeft: DAILY_SWIPE_LIMIT,
                isPremium: false,
              });
            }
          } else {
            // Not logged in
            setUserData(null);
          }
        } catch (err) {
          console.error('Error loading user document:', err);
          // Fail-safe: treat as logged-out / no profile
          setUserData(null);
        } finally {
          // Always clear loading, even on error
          setLoading(false);
        }
      };

      loadUserDoc();
    });

    return () => unsubscribe();
  }, []);

  // FETCH PROFILES
  useEffect(() => {
    if (!user || !userData?.onboarded) return;

    const fetchProfiles = async () => {
      const q = query(collection(db, 'users'), where('onboarded', '==', true));
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== user.uid);

      setProfiles(users);
    };

    fetchProfiles();
  }, [user, userData]);

  // FETCH MATCHES (realtime)
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

  // AUTH ACTIONS
  const handleAuth = async (isSignup, email, password) => {
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          onboarded: false,
          swipesLeft: DAILY_SWIPE_LIMIT,
          isPremium: false,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOnboarding = async (data) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      ...data,
      onboarded: true,
    });
    setUserData((prev) => ({ ...(prev || {}), ...data, onboarded: true }));
  };

  const handleSwipe = async (direction, targetProfile) => {
    if (!user || !userData) return;
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
          [user.uid]: { name: userData.name, emoji: userData.emoji },
          [targetProfile.id]: {
            name: targetProfile.name,
            emoji: targetProfile.emoji,
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

  const handleUpgrade = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      isPremium: true,
      swipesLeft: 99999,
    });
    setUserData((prev) =>
      prev ? { ...prev, isPremium: true, swipesLeft: 99999 } : prev
    );
    setShowPremium(false);
    alert('Upgraded to Gold!');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // RENDER STATES

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
                onSignup={(e, p) => handleAuth(true, e, p)}
                loading={false}
              />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  if (userData && !userData.onboarded) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="flex items-center justify-center bg-gray-200">
            <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl overflow-hidden shadow-2xl">
              <OnboardingScreen onComplete={handleOnboarding} />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  // MAIN APP WITH TABS
  return (
    <IonApp>
      <IonPage>
        <IonContent className="flex items-center justify-center bg-gray-200 font-sans text-gray-900">
          <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl sm:border-8 sm:border-gray-800 sm:shadow-2xl overflow-hidden flex flex-col relative">
            {showPremium && (
              <PremiumModal
                onClose={() => setShowPremium(false)}
                onUpgrade={handleUpgrade}
              />
            )}

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
                {activeTab === 'discover' && (
                  <div className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                    {userData?.isPremium
                      ? 'GOLD'
                      : `${userData?.swipesLeft ?? 0} Swipes`}
                  </div>
                )}
              </div>
            )}

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
                  <div className="bg-white p-4 rounded-xl shadow mb-4">
                    <p className="font-bold text-lg">
                      {userData?.name || user.email}
                    </p>
                    <p className="text-gray-500">
                      {userData?.gym || 'No Gym Set'}
                    </p>
                    {!userData?.isPremium && (
                      <button
                        onClick={() => setShowPremium(true)}
                        className="mt-4 w-full py-2 bg-yellow-400 font-bold rounded-lg text-yellow-900 flex items-center justify-center gap-2"
                      >
                        <Star size={16} /> Upgrade
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-500 font-bold"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

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
