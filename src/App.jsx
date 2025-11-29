import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Heart, X, MessageCircle, User, Settings, MapPin, 
  ChevronLeft, Send, Filter, Award, ChevronRight, Mail, Lock, 
  Check, Building, Ticket, Star 
} from 'lucide-react';

/**
 * SPOTME - PRODUCTION BUILD
 * Project ID: spotme-bd660
 */

/* ========================================================================== */
/* CONFIGURATION SECTION                                                     */
/* Toggle between DEMO mode (for preview) and REAL mode (for production)     */
/* ========================================================================== */

const USE_REAL_FIREBASE = true; // ⚠️ Set to TRUE locally after adding API Key

/* ========================================================================== */
/* 1. REAL FIREBASE SETUP                                                    */
/* ========================================================================== */

// NOTE: In your local VS Code, you can uncomment these imports and the logic below
/*
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, increment, addDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKWQJX_LA2Aq2qwqrh35RSFP5MwvYNFE8", // 🔴 PASTE YOUR API KEY FROM FIREBASE CONSOLE
  authDomain: "spotme-bd660.firebaseapp.com",
  projectId: "spotme-bd660",
  storageBucket: "spotme-bd660.firebasestorage.app",
  messagingSenderId: "608686898570",
  appId: "1:608686898570:web:1a38e638e5c7ab4e6b1c73"   // 🔴 PASTE YOUR APP ID FROM FIREBASE CONSOLE
};

// Initialize only if enabled to prevent crashes without API Key
let auth, db;
if (USE_REAL_FIREBASE) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
*/

/* ========================================================================== */
/* 2. MOCK / DEMO BACKEND (Active for Preview)                               */
/* ========================================================================== */

// Mock Data Stores
let MOCK_DB = {
  users: [
    { id: '2', name: 'Sarah', age: 28, role: 'Partner', intent: 'workout', emoji: '🏃‍♀️', bio: 'Marathon training', tags: ['Running'], gym: 'Equinox', guestPass: true, swipesLeft: 5, onboarded: true },
    { id: '3', name: 'Coach Mike', age: 34, role: 'Coach', intent: 'coach', emoji: '💪', bio: 'Personal Trainer', tags: ['Lifting'], gym: 'Golds', guestPass: false, swipesLeft: 5, onboarded: true },
    { id: '4', name: 'Jess', age: 26, role: 'Partner', intent: 'workout', emoji: '🧘‍♀️', bio: 'Yoga lover', tags: ['Yoga'], gym: 'CorePower', guestPass: true, swipesLeft: 5, onboarded: true }
  ],
  matches: []
};

// Mock Auth Functions
const mockAuth = { currentUser: null };
const mockOnAuthStateChanged = (auth, callback) => {
  const storedUser = localStorage.getItem('spotme_demo_user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    auth.currentUser = user;
    callback(user);
  } else {
    callback(null);
  }
  return () => {}; 
};
const mockCreateUser = async (auth, email, password) => {
  const newUser = { uid: Date.now().toString(), email };
  localStorage.setItem('spotme_demo_user', JSON.stringify(newUser));
  auth.currentUser = newUser;
  return { user: newUser };
};
const mockSignIn = async (auth, email, password) => {
  const user = { uid: 'demo_user_123', email };
  localStorage.setItem('spotme_demo_user', JSON.stringify(user));
  auth.currentUser = user;
  return { user };
};
const mockSignOut = async (auth) => {
  localStorage.removeItem('spotme_demo_user');
  auth.currentUser = null;
  window.location.reload();
};

// Mock Firestore Functions
const mockDb = {}; 
const mockServerTimestamp = () => new Date().toISOString();
const mockIncrement = (n) => n; 
const mockSetDoc = async (path, data) => {
  console.log(`[DB Write] ${path}:`, data);
  if (path.startsWith('users/')) {
    const id = path.split('/')[1];
    const existing = MOCK_DB.users.find(u => u.id === id);
    if(existing) Object.assign(existing, data);
    else MOCK_DB.users.push({ id, ...data });
  }
};
const mockUpdateDoc = async (path, data) => {
  console.log(`[DB Update] ${path}:`, data);
  if (data.swipesLeft && path.startsWith('users/')) {
    const id = path.split('/')[1];
    const user = MOCK_DB.users.find(u => u.id === id);
    if(user) user.swipesLeft += data.swipesLeft;
  }
};
const mockAddDoc = async (path, data) => {
  console.log(`[DB Add] ${path}:`, data);
  if (path === 'matches') {
    MOCK_DB.matches.push({ id: Date.now().toString(), ...data });
  }
};
const mockGetDoc = async (path) => {
  if (path.includes('likes')) return { exists: () => Math.random() > 0.7 };
  const id = path.split('/')[1];
  const user = MOCK_DB.users.find(u => u.id === id);
  return { exists: () => !!user, data: () => user };
};
const mockGetDocs = async (query) => {
  return { docs: MOCK_DB.users.map(u => ({ id: u.id, data: () => u })) };
};
const mockQuery = (col, ...constraints) => ({ col, constraints });
const mockCollection = (db, ...path) => path.join('/');
const mockDoc = (db, ...path) => path.join('/');
const mockWhere = (field, op, val) => ({ field, op, val });
const mockOrderBy = (field) => ({ field });
const mockOnSnapshot = (query, callback) => {
  if (typeof query === 'string' && query.startsWith('users/')) {
    const id = query.split('/')[1];
    const user = MOCK_DB.users.find(u => u.id === id);
    callback({ exists: () => !!user, data: () => user || { onboarded: false } });
  } else if (query.col === 'matches') {
    callback({ docs: MOCK_DB.matches.map(m => ({ id: m.id, data: () => m })) });
  } else {
    callback({ docs: [] }); 
  }
  return () => {};
};

/* ========================================================================== */
/* 3. APP LOGIC (Agnostic of Backend)                                        */
/* ========================================================================== */

const AVAILABLE_TAGS = [
  'Running', 'Lifting', 'Yoga', 'CrossFit', 'HIIT', 
  'Pilates', 'Cycling', 'Hiking', 'Swimming', 'Boxing',
  'Nutrition', 'Meditation', 'Calisthenics', 'Dance'
];

const DAILY_SWIPE_LIMIT = 5;

// --- UI COMPONENTS ---

const PremiumModal = ({ onClose, onUpgrade, type = 'limit' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 opacity-20"></div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"><X size={20} /></button>

        <div className="relative z-10 flex flex-col items-center text-center mt-4">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-lg mb-4">
            <Star className="text-white fill-current" size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">{type === 'limit' ? 'Out of Swipes?' : 'See Who Likes You'}</h2>
          <p className="text-gray-500 mb-6 px-4">Upgrade to SpotMe Gold for unlimited access.</p>

          <button onClick={onUpgrade} className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            Upgrade to Gold <span className="bg-white/20 px-2 py-0.5 rounded text-xs">$9.99/mo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onLogin, onSignup, loading }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) onLogin(email, password);
    else onSignup(email, password);
  };

  return (
    <div className="flex flex-col h-full bg-white p-8 justify-center">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-rose-500 p-4 rounded-2xl shadow-lg mb-4"><Dumbbell className="text-white" size={40} /></div>
        <h1 className="text-3xl font-black italic text-gray-800 tracking-tighter">Spot<span className="text-rose-500">Me</span></h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-rose-500 outline-none" required />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-rose-500 outline-none" required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-rose-600 transition disabled:opacity-50">
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      <div className="mt-8 text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-rose-500 font-bold mt-2 hover:underline">
          {isLogin ? 'Sign Up Free' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: '', age: '', role: 'Partner', intent: 'workout', tags: [], emoji: '💪', gym: '', guestPass: false, bio: '' });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(data);
  };

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) setData({...data, tags: data.tags.filter(t => t !== tag)});
    else if (data.tags.length < 5) setData({...data, tags: [...data.tags, tag]});
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="w-full h-1 bg-gray-100"><div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div></div>
      <div className="flex-1 p-8 overflow-y-auto">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="mb-6 text-gray-400"><ChevronLeft size={24} /></button>}
        
        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">The Basics</h2>
            <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4" placeholder="First Name" />
            <input type="number" value={data.age} onChange={e => setData({...data, age: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4" placeholder="Age" />
            <div className="flex gap-4 overflow-x-auto pb-2">{['💪', '🏃‍♀️', '🧘‍♂️', '🥊', '🚴‍♀️', '🤸', '🏋️‍♂️'].map(emoji => (
              <button key={emoji} onClick={() => setData({...data, emoji})} className={`text-3xl p-3 rounded-full border-2 transition ${data.emoji === emoji ? 'border-rose-500 bg-rose-50' : 'border-transparent'}`}>{emoji}</button>
            ))}</div>
          </div>
        )}
        
        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Role</h2>
            <button onClick={() => setData({...data, role: 'Partner'})} className={`w-full p-6 rounded-2xl border-2 text-left ${data.role === 'Partner' ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}>
              <div className="flex justify-between"><span className="font-bold">Workout Partner</span>{data.role === 'Partner' && <Check className="text-rose-500" />}</div>
            </button>
            <button onClick={() => setData({...data, role: 'Coach'})} className={`w-full p-6 rounded-2xl border-2 text-left ${data.role === 'Coach' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex justify-between"><span className="font-bold">Coach</span>{data.role === 'Coach' && <Check className="text-blue-500" />}</div>
            </button>
            <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">Goal</label>
            <select value={data.intent} onChange={e => setData({...data, intent: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4">
              <option value="workout">Find Partners</option><option value="relationship">Relationship</option><option value="coach">Find Clients</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Gym & Access</h2>
            <div className="relative mb-6">
              <Building className="absolute left-4 top-4 text-gray-400" size={20} />
              <input type="text" value={data.gym} onChange={e => setData({...data, gym: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-12" placeholder="Home Gym Name" />
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="text-orange-500" size={24} />
                <div><h4 className="font-bold">Guest Pass</h4><p className="text-xs text-gray-500">I can bring a guest</p></div>
              </div>
              <input type="checkbox" checked={data.guestPass} onChange={() => setData({...data, guestPass: !data.guestPass})} className="w-6 h-6 text-rose-500" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-3 rounded-full text-sm transition ${data.tags.includes(tag) ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Bio</h2>
            <textarea value={data.bio} onChange={e => setData({...data, bio: e.target.value})} className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none" placeholder="Tell us about yourself..." />
          </div>
        )}
      </div>
      <div className="p-6 bg-white border-t border-gray-100">
        <button onClick={handleNext} disabled={step === 1 && !data.name} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {step === 5 ? 'Complete Profile' : 'Continue'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const DiscoverScreen = ({ profiles, onSwipe, user, onTriggerPremium }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const currentProfile = profiles[currentIndex];

  const handleSwipe = (dir) => {
    if (dir === 'right') {
      if (!user.isPremium && user.swipesLeft <= 0) {
        onTriggerPremium();
        return;
      }
    }
    setDirection(dir);
    setTimeout(() => {
      onSwipe(dir, currentProfile);
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  if (!currentProfile) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Dumbbell className="text-gray-400" size={32} /></div>
      <h3 className="text-xl font-bold text-gray-800">No more profiles!</h3>
      <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-gray-100 rounded-full">Refresh</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-gray-50">
      <div className="flex-1 px-4 py-4 relative">
        <div className={`w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transform transition-all duration-300 ${direction === 'left' ? '-translate-x-full rotate-[-10deg]' : direction === 'right' ? 'translate-x-full rotate-[10deg]' : ''}`}>
          <div className={`h-3/5 ${currentProfile.imageColor || 'bg-blue-100'} relative flex items-center justify-center`}>
            <span className="text-9xl drop-shadow-xl">{currentProfile.emoji}</span>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 uppercase flex items-center gap-1 shadow-sm">
              {currentProfile.role === 'Coach' ? <Award size={12} className="text-blue-500"/> : <User size={12} className="text-rose-500"/>}
              {currentProfile.role}
            </div>
            {currentProfile.guestPass && <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><Ticket size={12} /> Guest Pass</div>}
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">{currentProfile.name}, {currentProfile.age}</h2>
            {currentProfile.gym && <div className="flex items-center text-rose-500 text-sm font-medium mt-1"><Building size={14} className="mr-1" />{currentProfile.gym}</div>}
            <p className="text-gray-600 leading-snug my-4 line-clamp-3">{currentProfile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {currentProfile.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 px-8 pb-6 flex items-center justify-center gap-8">
        <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white rounded-full shadow-lg text-gray-400 flex items-center justify-center border border-gray-100"><X size={32} /></button>
        <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-rose-500 rounded-full shadow-lg text-white flex items-center justify-center ring-4 ring-rose-100"><Heart size={32} fill="currentColor" /></button>
      </div>
    </div>
  );
};

const ChatScreen = ({ match, onBack, currentUser, db, actions }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  // REALTIME CHAT LISTENER
  useEffect(() => {
    if (!match?.id) return;
    let unsubscribe = () => {};
    
    // Abstracted Listener for Real or Mock
    if (USE_REAL_FIREBASE) {
      /* // UNCOMMENT FOR REAL FIREBASE
      const q = query(collection(db, 'matches', match.id, 'messages'), orderBy('createdAt', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      */
    } else {
       // Mock Listener
       setMessages([{id: 1, text: "Hey! Nice to match!", senderId: "other", createdAt: new Date().toISOString()}]);
    }
    return () => unsubscribe();
  }, [match, db]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    if (USE_REAL_FIREBASE) {
      /* await addDoc(collection(db, 'matches', match.id, 'messages'), {
        text: inputText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      */
    } else {
      setMessages([...messages, {id: Date.now(), text: inputText, senderId: currentUser.uid, createdAt: new Date().toISOString()}]);
    }
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="h-16 bg-white shadow-sm flex items-center px-4 z-10 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <div className="w-8 h-8 rounded-full bg-gray-200 ml-2 flex items-center justify-center">{match.otherUser?.emoji}</div>
        <span className="font-bold text-gray-800 ml-3">{match.otherUser?.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser.uid ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 focus:outline-none" />
        <button type="submit" className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white"><Send size={18} /></button>
      </form>
    </div>
  );
};

const MatchesScreen = ({ matches, onSelectMatch }) => (
  <div className="flex flex-col h-full bg-white">
    <div className="p-4 border-b border-gray-100"><h1 className="text-2xl font-bold text-gray-800">Matches</h1></div>
    <div className="flex-1 overflow-y-auto">
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400"><Dumbbell size={48} className="mb-4 opacity-50" /><p>No matches yet.</p></div>
      ) : (
        <div className="divide-y divide-gray-50">
          {matches.map(m => (
            <button key={m.id} onClick={() => onSelectMatch(m)} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl">{m.otherUser?.emoji}</div>
              <div className="flex-1"><h3 className="font-semibold text-gray-900">{m.otherUser?.name}</h3></div>
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

// --- MAIN APP ---

export default function SpotMeApp() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPremium, setShowPremium] = useState(false);

  // ABSTRACTION LAYER FOR BACKEND
  const backend = USE_REAL_FIREBASE ? {
    // auth: auth, 
    // db: db,
    // onAuthStateChanged: onAuthStateChanged,
    // createUser: createUserWithEmailAndPassword,
    // signIn: signInWithEmailAndPassword,
    // signOut: signOut,
    // doc: doc,
    // collection: collection,
    // setDoc: setDoc,
    // updateDoc: updateDoc,
    // getDoc: getDoc,
    // addDoc: addDoc,
    // increment: increment,
    // serverTimestamp: serverTimestamp
  } : {
    auth: mockAuth,
    db: mockDb,
    onAuthStateChanged: mockOnAuthStateChanged,
    createUser: mockCreateUser,
    signIn: mockSignIn,
    signOut: mockSignOut,
    doc: mockDoc,
    collection: mockCollection,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    getDoc: mockGetDoc,
    addDoc: mockAddDoc,
    increment: mockIncrement,
    serverTimestamp: mockServerTimestamp
  };

  // 1. AUTH LISTENER
  useEffect(() => {
    const unsub = backend.onAuthStateChanged(backend.auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch User Data real-time (Simulated or Real)
        if (USE_REAL_FIREBASE) {
          /*
          const unsubDoc = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
            else setUserData({ onboarded: false });
          });
          return () => unsubDoc();
          */
        } else {
           const unsubDoc = mockOnSnapshot(`users/${currentUser.uid}`, (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
            else setUserData({ onboarded: false });
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  // 2. FETCH PROFILES (For Discover)
  useEffect(() => {
    if (!user || !userData?.onboarded) return;
    const fetchProfiles = async () => {
      let users = [];
      if (USE_REAL_FIREBASE) {
        /*
        const q = query(collection(db, "users"), where("onboarded", "==", true));
        const snapshot = await getDocs(q);
        users = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid);
        */
      } else {
        const snapshot = await mockGetDocs();
        users = snapshot.docs.map(d => ({ id: d.data().id, ...d.data() })).filter(u => u.id !== user.uid);
      }
      setProfiles(users);
    };
    fetchProfiles();
  }, [user, userData]);

  // 3. FETCH MATCHES
  useEffect(() => {
    if (!user) return;
    if (USE_REAL_FIREBASE) {
        /*
        const q = query(collection(db, "matches"), where("userIds", "array-contains", user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
          const matchData = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            const otherId = data.userIds ? data.userIds.find(id => id !== user.uid) : null;
            const otherUser = data.userSnapshots?.[otherId] || { name: 'User', emoji: '👤' };
            return { id: docSnap.id, ...data, otherUser };
          });
          setMatches(matchData);
        });
        return () => unsub();
        */
    } else {
        const unsub = mockOnSnapshot({col: "matches"}, (snapshot) => {
          const matchData = snapshot.docs.map(docSnap => {
             // Basic mock match logic
             return { id: docSnap.id, ...docSnap.data(), otherUser: { name: 'Mock Match', emoji: '🔥' }};
          });
          setMatches(matchData);
        });
        return () => unsub();
    }
  }, [user]);

  // --- ACTIONS ---

  const handleAuth = async (isSignup, email, password) => {
    try {
      if (isSignup) {
        const cred = await backend.createUser(backend.auth, email, password);
        await backend.setDoc(backend.doc(backend.db, "users", cred.user.uid), {
          email, onboarded: false, swipesLeft: DAILY_SWIPE_LIMIT, isPremium: false,
          createdAt: backend.serverTimestamp()
        });
      } else {
        await backend.signIn(backend.auth, email, password);
      }
    } catch (err) { alert(err.message); }
  };

  const handleOnboarding = async (data) => {
    if (!user) return;
    await backend.updateDoc(backend.doc(backend.db, "users", user.uid), { ...data, onboarded: true });
  };

  const handleSwipe = async (direction, targetProfile) => {
    if (direction === 'left') return; // Pass

    if (!userData.isPremium) {
      await backend.updateDoc(backend.doc(backend.db, "users", user.uid), { swipesLeft: backend.increment(-1) });
    }

    const theirLikeRef = backend.doc(backend.db, "users", targetProfile.id, "likes", user.uid);
    const theirLikeSnap = await backend.getDoc(theirLikeRef);

    if (theirLikeSnap.exists()) {
      await backend.addDoc(backend.collection(backend.db, "matches"), {
        userIds: [user.uid, targetProfile.id],
        userSnapshots: {
          [user.uid]: { name: userData.name, emoji: userData.emoji },
          [targetProfile.id]: { name: targetProfile.name, emoji: targetProfile.emoji }
        },
        createdAt: backend.serverTimestamp()
      });
      alert("It's a Match! 🎉");
    } else {
      await backend.setDoc(backend.doc(backend.db, "users", user.uid, "likes", targetProfile.id), {
        timestamp: backend.serverTimestamp()
      });
    }
  };

  const handleUpgrade = async () => {
    await backend.updateDoc(backend.doc(backend.db, "users", user.uid), { isPremium: true, swipesLeft: 99999 });
    setShowPremium(false);
    alert("Upgraded to Gold!");
  };

  const handleLogout = () => backend.signOut(backend.auth);

  // --- RENDER ---

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl overflow-hidden shadow-2xl">
        <AuthScreen onLogin={(e, p) => handleAuth(false, e, p)} onSignup={(e, p) => handleAuth(true, e, p)} />
      </div>
    </div>
  );

  if (userData && !userData.onboarded) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl overflow-hidden shadow-2xl">
        <OnboardingScreen onComplete={handleOnboarding} />
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 font-sans text-gray-900">
      <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:rounded-3xl sm:border-8 sm:border-gray-800 sm:shadow-2xl overflow-hidden flex flex-col relative">
        {showPremium && <PremiumModal onClose={() => setShowPremium(false)} onUpgrade={handleUpgrade} />}
        
        {!selectedMatch && (
          <div className="h-16 px-6 flex items-center justify-between bg-white z-20 shadow-sm">
            <div className="flex items-center gap-2"><div className="bg-rose-500 p-1.5 rounded-lg"><Dumbbell className="text-white" size={20} /></div><h1 className="text-2xl font-black italic text-gray-800">Spot<span className="text-rose-500">Me</span></h1></div>
            {activeTab === 'discover' && <div className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">{userData?.isPremium ? 'GOLD' : `${userData?.swipesLeft} Swipes`}</div>}
          </div>
        )}

        <div className="flex-1 overflow-hidden relative bg-gray-50">
          {selectedMatch ? (
            <ChatScreen match={selectedMatch} onBack={() => setSelectedMatch(null)} currentUser={user} db={backend.db} />
          ) : activeTab === 'discover' ? (
            <DiscoverScreen profiles={profiles} onSwipe={handleSwipe} user={userData} onTriggerPremium={() => setShowPremium(true)} />
          ) : activeTab === 'matches' ? (
            <MatchesScreen matches={matches} onSelectMatch={setSelectedMatch} />
          ) : (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <div className="bg-white p-4 rounded-xl shadow mb-4">
                <p className="font-bold text-lg">{userData?.name}</p>
                <p className="text-gray-500">{userData?.gym || 'No Gym Set'}</p>
                {!userData?.isPremium && <button onClick={() => setShowPremium(true)} className="mt-4 w-full py-2 bg-yellow-400 font-bold rounded-lg text-yellow-900 flex items-center justify-center gap-2"><Star size={16}/> Upgrade</button>}
              </div>
              <button onClick={handleLogout} className="text-red-500 font-bold">Log Out</button>
            </div>
          )}
        </div>

        {!selectedMatch && (
          <div className="h-20 bg-white border-t border-gray-100 flex items-center justify-around pb-2">
            <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center justify-center w-16 h-16 ${activeTab === 'discover' ? 'text-rose-500' : 'text-gray-400'}`}><Dumbbell size={24} /><span className="text-[10px] font-bold">Discover</span></button>
            <button onClick={() => setActiveTab('matches')} className={`flex flex-col items-center justify-center w-16 h-16 ${activeTab === 'matches' ? 'text-rose-500' : 'text-gray-400'}`}><MessageCircle size={24} /><span className="text-[10px] font-bold">Matches</span></button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-16 h-16 ${activeTab === 'profile' ? 'text-rose-500' : 'text-gray-400'}`}><User size={24} /><span className="text-[10px] font-bold">Profile</span></button>
          </div>
        )}
      </div>
    </div>
  );
}