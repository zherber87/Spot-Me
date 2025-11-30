import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithCustomToken 
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
  query 
} from 'firebase/firestore';
import { 
  Dumbbell, 
  MessageCircle, 
  User as UserIcon, 
  SlidersHorizontal, 
  Heart, 
  Loader2,
  Lock,
  Check,
  X,
  MapPin,
  ChevronRight,
  MoreVertical,
  Send,
  Search
} from 'lucide-react';

// ------------------------------------------------------------------
// INSTRUCTIONS FOR LOCAL USE:
// 1. Uncomment the imports below.
// 2. Delete the component definitions found at the bottom of this file.
// ------------------------------------------------------------------

// import { PremiumModal } from './PremiumModal';
// import { AuthScreen } from './AuthScreen';
// import { DiscoverScreen } from './DiscoverScreen';
// import { MatchesScreen } from './MatchesScreen';
// import { ChatScreen } from './ChatScreen';
// import { OnboardingScreen } from './OnboardingScreen';

// -------------------- FIREBASE INIT --------------------
// Use a safe check for the preview environment, or your direct config locally
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -------------------- CONSTANTS --------------------
const DAILY_SWIPE_LIMIT = 50;
const SUPER_SWIPE_DEFAULT = 2;

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // UI States
  const [showPremium, setShowPremium] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  // Data States
  const [profiles, setProfiles] = useState([]); // Will hold REAL users
  const [matches, setMatches] = useState([]);

  // 1. Initial Auth Check & Setup
  useEffect(() => {
    // Check for environment token (Preview only)
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) {}
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // A) Fetch YOUR profile
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              setUserData({ uid: currentUser.uid, email: currentUser.email });
            }
            
            // B) Fetch REAL USERS for Discover
            // NOTE: This fetches ALL users. In production, use limit(20) and paging.
            const q = query(collection(db, "users")); 
            const querySnapshot = await getDocs(q);
            
            const allUsers = querySnapshot.docs.map(d => ({
                id: d.id, 
                ...d.data()
            }));
            
            // Filter out yourself from the deck
            const discoverableUsers = allUsers.filter(u => u.uid !== currentUser.uid);
            
            console.log("Fetched Users:", discoverableUsers);
            setProfiles(discoverableUsers);
            setMatches([]); 

        } catch (e) {
            console.error("Error fetching data:", e);
        }
      } else {
        setUserData(null);
        setProfiles([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Auth Handler
  const handleAuth = async (email, password, profileData = null) => {
    setAuthLoading(true);
    try {
      if (profileData) {
        // --- SIGN UP ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Save full profile to Firestore
        const newUserData = {
            uid,
            email,
            name: profileData.name || 'User',
            age: profileData.age || 18,
            intent: profileData.intent || 'Gym Partner',
            bio: profileData.bio || '',
            emoji: profileData.emoji || '👤',
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
      console.error("Auth error:", error);
      alert(error.message); 
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('discover');
      setSelectedMatch(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // 4. Upgrade Handler
  const handleUpgrade = async () => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', user.uid), {
            isPremium: true,
            superSwipes: increment(5)
        });
        setUserData(prev => ({ ...prev, isPremium: true }));
        setShowPremium(false);
    } catch (err) {
        console.error("Upgrade failed", err);
    }
  };

  // 5. Swipe Handler
  const handleSwipe = (direction, profile) => {
    if (!user) return;
    
    // Remove card from local state
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    
    if (direction === 'right') {
        console.log(`Liked ${profile.name}`);
        // Add Firestore 'like' logic here if needed
    }
  };

  // -------------------- RENDER --------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-rose-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // Not Logged In -> Show Auth
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
        
        {/* Premium Modal Overlay */}
        {showPremium && (
          <PremiumModal
            onClose={() => setShowPremium(false)}
            onUpgrade={handleUpgrade}
          />
        )}
        
        {/* Header */}
        {!selectedMatch && (
          <header className="h-16 shrink-0 px-4 flex items-center justify-between bg-white z-30 relative shadow-sm border-b border-gray-100">
             <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-rose-200 shadow-md">
                    <Dumbbell size={20} className="fill-white/20 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-gray-800">SpotMe</span>
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
                    <Heart size={20} strokeWidth={2.5} className={activeTab === 'likes' ? 'fill-rose-500' : ''} />
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
              db={db}
            />
          ) : activeTab === 'discover' ? (
            <DiscoverScreen
              profiles={profiles}
              onSwipe={handleSwipe}
              onTriggerPremium={() => setShowPremium(true)}
            />
          ) : activeTab === 'matches' ? (
            <MatchesScreen
              matches={matches}
              onSelectMatch={setSelectedMatch}
            />
          ) : activeTab === 'likes' ? (
             // Placeholder for Likes if you don't have a component for it
            <div className="p-10 text-center text-gray-500">
                <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="font-bold text-lg">Likes Screen</h2>
                <p>Import your LikesScreen component to see who liked you.</p>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="h-full overflow-y-auto p-6 flex flex-col items-center bg-gray-50">
               <div className="w-full bg-white rounded-3xl p-6 shadow-sm mb-6 flex flex-col items-center border border-gray-100">
                   <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-4xl ring-4 ring-white shadow-lg">
                     {userData?.emoji || '👤'}
                   </div>
                   <h2 className="text-2xl font-black text-gray-900 mb-1">{userData?.name || 'User'}</h2>
                   <p className="text-gray-400 text-sm font-medium">Member since 2024</p>
               </div>
               
               <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-bold">Daily Swipes</span>
                    <span className="text-gray-900 font-black">{userData?.swipesLeft || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-bold">Membership</span>
                    <span className={`font-black uppercase text-sm px-2 py-1 rounded ${userData?.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                      {userData?.isPremium ? 'Gold' : 'Free'}
                    </span>
                  </div>
                  {!userData?.isPremium && (
                      <button 
                        onClick={() => setShowPremium(true)}
                        className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-100 active:scale-95 transition-all"
                      >
                        Upgrade to Gold
                      </button>
                  )}
               </div>

               <button onClick={handleLogout} className="mt-auto py-6 text-gray-400 font-bold hover:text-rose-500 transition-colors">
                 Sign Out
               </button>
            </div>
          ) : null}
        </main>

        {/* Bottom Navigation */}
        {!selectedMatch && (
          <nav className="h-[72px] shrink-0 border-t border-gray-100 bg-white flex items-center justify-around pb-2 px-2 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'discover' ? 'text-rose-500' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Dumbbell size={26} strokeWidth={activeTab === 'discover' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${activeTab === 'discover' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>Discover</span>
            </button>
            
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'matches' ? 'text-rose-500' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <MessageCircle size={26} strokeWidth={activeTab === 'matches' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${activeTab === 'matches' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>Matches</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                activeTab === 'profile' ? 'text-rose-500' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <UserIcon size={26} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${activeTab === 'profile' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>Profile</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

// =================================================================
// COMPONENTS - COPY THESE TO SEPARATE FILES OR DELETE IF EXISTING
// =================================================================

function PremiumModal({ onClose, onUpgrade }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10" style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 3px)', backgroundSize: '20px 20px'}}></div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-white/30">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-1">SPOTME GOLD</h2>
          <p className="text-white/90 font-medium text-sm">Unlock your full potential</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {["See who likes you", "Unlimited Swipes", "Filter by distance", "5 Super Swipes"].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-orange-500 stroke-[3]" />
                </div>
                <span className="font-medium text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <button onClick={onUpgrade} className="w-full py-4 mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
            Upgrade for $9.99/mo
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin, onSignup, loading }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', age: '', intent: 'Gym Partner', bio: '', emoji: '👤' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) onLogin(formData.email, formData.password);
    else onSignup(formData.email, formData.password, formData);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-500 to-orange-500 text-white overflow-y-auto">
      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-4 rotate-3 shrink-0">
        <Dumbbell size={32} className="text-rose-500" />
      </div>
      <h1 className="text-3xl font-extrabold mb-1 tracking-tight">SpotMe</h1>
      <p className="mb-6 text-white/80 font-medium text-sm">Find your perfect gym partner.</p>

      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl text-gray-800">
        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`} onClick={() => setIsLogin(true)}>Log In</button>
          <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`} onClick={() => setIsLogin(false)}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="space-y-3 animate-in slide-in-from-top-4 fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Name</label>
                    <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Age</label>
                    <input name="age" type="number" value={formData.age} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500" required />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Looking for</label>
                 <select name="intent" value={formData.intent} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500">
                    <option value="Gym Partner">Gym Partner</option>
                    <option value="Relationship">Relationship</option>
                    <option value="Coach">Coach</option>
                 </select>
               </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 font-medium" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 font-medium" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl mt-2 active:scale-95 transition-transform disabled:opacity-70 flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Welcome Back' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

function DiscoverScreen({ profiles, onSwipe, onTriggerPremium }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!profiles || profiles.length === 0) return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Search size={40} className="text-gray-400" /></div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No users found</h3>
        <p className="text-gray-500 mb-8 max-w-[200px]">We couldn't find any users nearby.</p>
      </div>
  );

  if (currentIndex >= profiles.length) return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Check size={40} className="text-green-500" /></div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h3>
        <p className="text-gray-500 mb-8 max-w-[200px]">Check back later for new people.</p>
        <button onClick={() => setCurrentIndex(0)} className="px-6 py-3 bg-white border-2 border-gray-200 rounded-full font-bold text-gray-600">Review Again</button>
      </div>
  );

  const currentProfile = profiles[currentIndex];
  const handleSwipe = (direction) => {
      onSwipe(direction, currentProfile);
      setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="h-full relative overflow-hidden bg-gray-50">
      {profiles[currentIndex + 1] && <div className="absolute inset-4 top-2 bottom-6 bg-white rounded-3xl shadow-sm border border-gray-100 scale-95 translate-y-4 opacity-60 z-0"></div>}
      <div className="absolute inset-3 top-2 bottom-6 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="h-[60%] bg-gray-200 relative group">
           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-9xl select-none">{currentProfile.emoji || '👤'}</div>
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-white/50">{currentProfile.distance || '5'} miles away</div>
           {currentProfile.gym && <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"><MapPin size={12} />{currentProfile.gym}</div>}
        </div>
        <div className="flex-1 p-5 flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <div><h2 className="text-2xl font-black text-gray-900 leading-tight">{currentProfile.name}, {currentProfile.age}</h2><div className="text-rose-500 font-bold text-xs uppercase tracking-wide mt-1">{currentProfile.intent || 'Gym Partner'}</div></div>
           </div>
           <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">{currentProfile.bio || 'No bio yet.'}</p>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-6">
        <button onClick={() => handleSwipe('left')} className="w-14 h-14 bg-white rounded-full shadow-xl shadow-red-100 text-red-500 flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-red-50"><X size={28} strokeWidth={3} /></button>
        <button onClick={onTriggerPremium} className="w-10 h-10 bg-white rounded-full shadow-lg text-blue-400 flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><div className="rotate-12"><SlidersHorizontal size={20} /></div></button>
        <button onClick={() => handleSwipe('right')} className="w-14 h-14 bg-rose-500 rounded-full shadow-xl shadow-rose-200 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all"><Heart size={28} strokeWidth={3} className="fill-current" /></button>
      </div>
    </div>
  );
}

function MatchesScreen({ matches, onSelectMatch }) {
  return (
    <div className="h-full bg-white p-4">
      <h2 className="text-2xl font-bold mb-4">Matches</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">New Matches</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
             <div className="flex flex-col items-center gap-1 min-w-[70px] opacity-50"><div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"><span className="text-xs text-gray-400">Wait...</span></div></div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Messages</h3>
          {matches.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><MessageCircle className="text-gray-300" /></div>
              <p className="text-gray-500 text-sm">No messages yet. Get swiping!</p>
            </div>
          ) : (
             <div className="space-y-1">
               {matches.map(match => (
                 <button key={match.id} onClick={() => onSelectMatch(match)} className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                   <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">{match.emoji || '👤'}</div>
                   <div className="flex-1 text-left">
                     <div className="flex justify-between items-center mb-0.5"><span className="font-bold text-gray-900">{match.name}</span><span className="text-[10px] text-gray-400 font-medium">9:41 AM</span></div>
                     <p className="text-sm text-gray-500 truncate">Hey! Do you train at Gold's?</p>
                   </div>
                 </button>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatScreen({ match, onBack, currentUser }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([{ id: 1, text: "Hey! I saw you train at Equinox too.", senderId: 'them', timestamp: new Date() }]);
  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now(), text, senderId: currentUser.uid, timestamp: new Date() }]);
    setText('');
  };
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronRight size={24} className="rotate-180" /></button>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">{match.emoji || '👤'}</div>
        <div className="flex-1"><h3 className="font-bold text-gray-900 leading-none">{match.name}</h3><span className="text-xs text-rose-500 font-medium">Active now</span></div>
        <button className="p-2 text-gray-400"><MoreVertical size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.uid;
          return <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'}`}>{msg.text}</div></div>;
        })}
      </div>
      <div className="p-3 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center bg-gray-100 rounded-full px-4 py-2">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent outline-none text-sm py-2" />
          <button type="submit" disabled={!text.trim()} className="p-2 bg-rose-500 text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition-colors"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}