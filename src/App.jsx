import React, { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  collection 
} from 'firebase/firestore';
import { 
  Dumbbell, 
  MessageCircle, 
  User as UserIcon, 
  SlidersHorizontal, 
  Heart, 
  Lock, 
  MapPin, 
  ChevronRight,
  Send,
  X,
  Check,
  Search,
  MoreVertical
} from 'lucide-react';

// -------------------- FIREBASE INIT --------------------
// Using the environment's provided config
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Note: __initial_auth_token is handled in the main App component's useEffect

// -------------------- CONSTANTS & DATA --------------------
const DAILY_SWIPE_LIMIT = 50;
const SUPER_SWIPE_DEFAULT = 2;

const DEMO_PROFILES = [
  {
    id: 'demo-1',
    name: 'Sarah',
    age: 27,
    gym: 'Equinox',
    guestPass: true,
    favoriteWorkouts: ['Running', 'HIIT'],
    bio: 'Training for my first half marathon. Love early morning sessions.',
    emoji: '🏃‍♀️',
    intent: 'Gym Partner',
    distance: 3
  },
  {
    id: 'demo-2',
    name: 'Coach Mike',
    age: 32,
    gym: 'Gold’s Gym',
    guestPass: false,
    favoriteWorkouts: ['Lifting', 'Powerlifting'],
    bio: 'Personal trainer focused on strength and form. Looking for serious partners.',
    emoji: '💪',
    intent: 'Coach',
    distance: 12
  },
  {
    id: 'demo-3',
    name: 'Jessica',
    age: 25,
    gym: 'Planet Fitness',
    guestPass: true,
    favoriteWorkouts: ['Yoga', 'Pilates'],
    bio: 'Looking for a gym crush turned relationship. Let’s get smoothies after.',
    emoji: '🧘‍♀️',
    intent: 'Relationship',
    distance: 8
  },
  {
    id: 'demo-4',
    name: 'David',
    age: 29,
    gym: '24 Hour Fitness',
    guestPass: true,
    favoriteWorkouts: ['Crossfit', 'Swimming'],
    bio: 'Just moved to the area, looking for a gym buddy to keep me accountable.',
    emoji: '🏋️‍♂️',
    intent: 'Gym Partner',
    distance: 5
  },
];

const MOCK_LIKES = [
  { id: 'l1', name: 'Alex', age: 24, emoji: '🏋️' },
  { id: 'l2', name: 'Jordan', age: 29, emoji: '🥊' },
  { id: 'l3', name: 'Taylor', age: 26, emoji: '🤸' },
  { id: 'l4', name: 'Casey', age: 31, emoji: '🏊‍♂️' },
];

// -------------------- COMPONENTS --------------------

// 1. Premium Modal
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
            {[
              "See who likes you",
              "Unlimited Swipes",
              "Filter by distance (up to 100mi)",
              "5 Super Swipes per week"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-orange-500 stroke-[3]" />
                </div>
                <span className="font-medium text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={onUpgrade}
            className="w-full py-4 mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform"
          >
            Upgrade for $9.99/mo
          </button>
          <p className="text-center text-xs text-gray-400">Recurring billing. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}

// 2. Auth Screen
function AuthScreen({ onLogin, onSignup, loading }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onSignup(email, password, { name, emoji: '👤' });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-rose-500 to-orange-500 text-white">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3">
        <Dumbbell size={40} className="text-rose-500" />
      </div>
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight">SpotMe</h1>
      <p className="mb-8 text-white/80 font-medium">Find your perfect gym partner.</p>

      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl text-gray-800">
        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                placeholder="Your Name"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              placeholder="hello@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl mt-4 active:scale-95 transition-transform disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

// 3. Discover Screen (Swipe Deck)
function DiscoverScreen({ profiles, onSwipe, user, onTriggerPremium }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = profiles[currentIndex];

  const handleSwipe = (direction) => {
    if (currentIndex < profiles.length) {
      onSwipe(direction, profiles[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search size={40} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No more profiles</h3>
        <p className="text-gray-500 mb-8 max-w-[200px]">Check back later or adjust your filters to see more people.</p>
        <button 
          onClick={() => setCurrentIndex(0)} // Reset for demo
          className="px-6 py-3 bg-white border-2 border-gray-200 rounded-full font-bold text-gray-600 hover:border-gray-400 transition-colors"
        >
          Reset Demo
        </button>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden bg-gray-50">
      {/* Background Cards Stack Effect */}
      {profiles[currentIndex + 1] && (
        <div className="absolute inset-4 top-2 bottom-6 bg-white rounded-3xl shadow-sm border border-gray-100 scale-95 translate-y-4 opacity-60 z-0"></div>
      )}

      {/* Main Card */}
      <div className="absolute inset-3 top-2 bottom-6 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-300">
        {/* Photo Area */}
        <div className="h-[60%] bg-gray-200 relative group">
           {/* Mock Photo */}
           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-9xl select-none">
             {currentProfile.emoji}
           </div>
           
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-white/50">
             {currentProfile.distance} miles away
           </div>
           
           {currentProfile.gym && (
             <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
               <MapPin size={12} />
               {currentProfile.gym}
             </div>
           )}
        </div>

        {/* Info Area */}
        <div className="flex-1 p-5 flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <div>
               <h2 className="text-2xl font-black text-gray-900 leading-tight">
                 {currentProfile.name}, {currentProfile.age}
               </h2>
               <div className="text-rose-500 font-bold text-xs uppercase tracking-wide mt-1">
                 {currentProfile.intent}
               </div>
             </div>
           </div>

           <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
             {currentProfile.bio}
           </p>

           <div className="flex flex-wrap gap-2 mt-auto">
             {currentProfile.favoriteWorkouts.map(tag => (
               <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                 {tag}
               </span>
             ))}
           </div>
        </div>
      </div>

      {/* Action Buttons Floating */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-6">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 bg-white rounded-full shadow-xl shadow-red-100 text-red-500 flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-red-50"
        >
          <X size={28} strokeWidth={3} />
        </button>
        
        <button 
          onClick={onTriggerPremium} // Super swipe triggers premium for this demo
          className="w-10 h-10 bg-white rounded-full shadow-lg text-blue-400 flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
          <div className="rotate-12">
             <SlidersHorizontal size={20} />
          </div>
        </button>

        <button 
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 bg-rose-500 rounded-full shadow-xl shadow-rose-200 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
          <Heart size={28} strokeWidth={3} className="fill-current" />
        </button>
      </div>
    </div>
  );
}

// 4. Matches Screen
function MatchesScreen({ matches, onSelectMatch }) {
  return (
    <div className="h-full bg-white p-4">
      <h2 className="text-2xl font-bold mb-4">Matches</h2>
      
      <div className="space-y-6">
        {/* New Matches Row */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">New Matches</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
             {/* Mock Match */}
             <div className="flex flex-col items-center gap-1 min-w-[70px]">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 p-0.5">
                 <div className="w-full h-full bg-white rounded-[14px] overflow-hidden">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">😎</div>
                 </div>
               </div>
               <span className="text-xs font-bold text-gray-700">Mike</span>
             </div>
             {/* Empty State Mock */}
             <div className="flex flex-col items-center gap-1 min-w-[70px] opacity-50">
               <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
               </div>
             </div>
          </div>
        </div>

        {/* Messages List */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Messages</h3>
          {matches.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">No messages yet. Get swiping!</p>
            </div>
          ) : (
             <div className="space-y-1">
               {matches.map(match => (
                 <button 
                   key={match.id}
                   onClick={() => onSelectMatch(match)}
                   className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                 >
                   <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl">
                     {match.emoji || '👤'}
                   </div>
                   <div className="flex-1 text-left">
                     <div className="flex justify-between items-center mb-0.5">
                       <span className="font-bold text-gray-900">{match.name}</span>
                       <span className="text-[10px] text-gray-400 font-medium">9:41 AM</span>
                     </div>
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

// 5. Chat Screen
function ChatScreen({ match, onBack, currentUser, db }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
     { id: 1, text: "Hey! I saw you train at Equinox too.", senderId: 'them', timestamp: new Date() },
  ]);

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now(), text, senderId: currentUser.uid, timestamp: new Date() };
    setMessages([...messages, newMsg]);
    setText('');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
          {match.emoji || '👤'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 leading-none">{match.name}</h3>
          <span className="text-xs text-rose-500 font-medium">Active now</span>
        </div>
        <button className="p-2 text-gray-400">
           <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-rose-500 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 items-center bg-gray-100 rounded-full px-4 py-2"
        >
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="p-2 bg-rose-500 text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// 6. Filter Sheet
function FilterSheet({ open, onClose, current, onApply, isPremium, onTriggerPremium }) {
  const [intent, setIntent] = useState(current.intent || 'Gym Partner');
  const [distance, setDistance] = useState(current.distance || 10);
  const [zipCode, setZipCode] = useState(current.zipCode || '');

  useEffect(() => {
    if (open) {
      setIntent(current.intent || 'Gym Partner');
      setDistance(current.distance || 10);
      setZipCode(current.zipCode || '');
    }
  }, [open, current]);

  if (!open) return null;

  const handleApply = () => {
    onApply({ intent, distance, zipCode });
    onClose();
  };

  const handleDistanceChange = (e) => {
    if (!isPremium) {
      onTriggerPremium();
      return; 
    }
    setDistance(Number(e.target.value));
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Filters</h3>
          <button onClick={onClose} className="text-gray-400 font-semibold text-sm hover:text-gray-600">Close</button>
        </div>
        
        {/* Intent Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">I'm looking for a...</label>
          <div className="flex flex-wrap gap-2">
            {['Gym Partner', 'Relationship', 'Coach'].map((type) => (
              <button
                key={type}
                onClick={() => setIntent(type)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  intent === type 
                    ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter Zip Code"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium transition-all"
            />
          </div>
        </div>

        {/* Distance Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-gray-700">Max Distance</label>
            <span className={`font-bold px-2 py-1 rounded-md text-sm ${isPremium ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100'}`}>
              {isPremium ? `${distance} miles` : '10 miles (Locked)'}
            </span>
          </div>

          <div className="relative flex items-center py-4">
            {!isPremium && (
               <div className="absolute left-[10%] -top-1 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10 animate-bounce">
                 FREE LIMIT
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
               </div>
            )}
            
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={isPremium ? distance : 10} 
              onChange={handleDistanceChange}
              disabled={!isPremium}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isPremium ? 'bg-rose-200 accent-rose-500' : 'bg-gray-200 accent-gray-400'
              }`}
            />
            
            {!isPremium && (
              <button 
                onClick={onTriggerPremium}
                className="ml-3 p-2 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200 transition-colors shadow-sm"
              >
                <Lock size={16} />
              </button>
            )}
          </div>
          {!isPremium && (
             <p className="text-xs text-gray-500 mt-1">
               Free users are limited to a 10 mile radius. <button className="text-rose-500 font-bold hover:underline" onClick={onTriggerPremium}>Upgrade to expand.</button>
             </p>
          )}
        </div>

        <button 
            onClick={handleApply}
            className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 active:scale-95 transition-transform"
        >
            Apply Filters
        </button>
      </div>
    </div>
  );
}

// 7. Likes Screen (Premium)
function LikesScreen({ isPremium, onTriggerPremium }) {
  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      <div className="p-5 pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900">Likes You</h2>
        <p className="text-gray-500 text-sm mt-1">
          {isPremium ? 'Here are the people who want to Spot you!' : 'Upgrade to see who liked you.'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          {MOCK_LIKES.map((like) => (
            <div key={like.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100">
              
              {/* Profile Image Area */}
              <div className={`w-full h-full bg-gray-100 flex flex-col items-center justify-center relative transition-all duration-500 ${!isPremium ? 'blur-xl scale-110' : ''}`}>
                 <span className="text-6xl select-none">{like.emoji}</span>
              </div>

              {/* Name Label */}
              <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white ${!isPremium ? 'blur-md' : ''}`}>
                 <h4 className="font-bold text-lg">{like.name}, {like.age}</h4>
              </div>

              {/* LOCK OVERLAY FOR FREE USERS */}
              {!isPremium && (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10">
                    <div className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg mb-2">
                        <Lock size={24} className="text-rose-500" />
                    </div>
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
        
      {/* GOLD CALL TO ACTION FLOATING */}
      {!isPremium && (
        <div className="absolute bottom-6 left-4 right-4 z-20">
            <button 
            onClick={onTriggerPremium}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-2xl shadow-2xl shadow-orange-900/20 flex items-center justify-between font-bold border border-white/20"
            >
            <div className="text-left">
                <div className="text-lg leading-tight">See Who Likes You</div>
                <div className="text-xs text-white/90 font-medium">Upgrade to SpotMe Gold</div>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
                <ChevronRight className="text-white" size={20} />
            </div>
            </button>
        </div>
      )}
    </div>
  );
}

// -------------------- MAIN APP COMPONENT --------------------
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
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    intent: 'Gym Partner',
    distance: 10,
    zipCode: '',
  });

  // 1. Initial Auth Check & Setup
  useEffect(() => {
    const initAuth = async () => {
      // Check for custom token from environment (if provided by tool context)
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Custom token auth failed", e);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
                // If auth exists but no doc (edge case), create basic one
                const newUserData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    name: 'User',
                    emoji: '👤',
                    isPremium: false,
                    swipesLeft: DAILY_SWIPE_LIMIT,
                    createdAt: serverTimestamp()
                };
                await setDoc(docRef, newUserData);
                setUserData(newUserData);
            }
            
            // Setup demo data
            setProfiles(DEMO_PROFILES);
            setMatches([
                { id: 'm1', name: 'Mike', emoji: '😎', lastMsg: 'Hey!' }
            ]);
        } catch (e) {
            console.error("Error fetching user data", e);
        }
      } else {
        setUserData(null);
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
        // Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
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
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
      // Simple alert for errors in this demo
      // alert(error.message); 
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
    // Optimistic UI update
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    if (direction === 'right') {
        console.log(`Liked ${profile.name}`);
    }
  };

  // -------------------- RENDER --------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans text-rose-500">
        <Dumbbell className="animate-spin" size={32} />
      </div>
    );
  }

  // Auth View
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

  // Main App View
  return (
    <div className="flex justify-center min-h-screen bg-gray-200 font-sans text-gray-900">
      {/* Phone Shell Container */}
      <div className="w-full max-w-md h-[100dvh] bg-white sm:h-[850px] sm:my-6 sm:rounded-3xl sm:border-8 sm:border-gray-800 overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Modals */}
        {showPremium && (
          <PremiumModal
            onClose={() => setShowPremium(false)}
            onUpgrade={handleUpgrade}
          />
        )}
        
        {/* Top Navigation Bar */}
        {!selectedMatch && (
          <header className="h-16 shrink-0 px-4 flex items-center justify-between bg-white z-30 relative shadow-sm border-b border-gray-100">
             {/* Brand */}
             <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-rose-200 shadow-md">
                    <Dumbbell size={20} className="fill-white/20 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-gray-800">SpotMe</span>
             </div>

             {/* Right Actions */}
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilter(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <SlidersHorizontal size={20} strokeWidth={2.5} />
                </button>
                
                {/* Heart / Likes Button */}
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
              user={userData}
              onTriggerPremium={() => setShowPremium(true)}
            />
          ) : activeTab === 'matches' ? (
            <MatchesScreen
              matches={matches}
              onSelectMatch={setSelectedMatch}
            />
          ) : activeTab === 'likes' ? (
            <LikesScreen 
              isPremium={!!userData?.isPremium} 
              onTriggerPremium={() => setShowPremium(true)}
            />
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
        
        {/* Filter Modal Rendered at Root Level of Phone Shell to cover everything properly */}
        <FilterSheet
          open={showFilter}
          onClose={() => setShowFilter(false)}
          current={filterOptions}
          onApply={setFilterOptions}
          isPremium={!!userData?.isPremium}
          onTriggerPremium={() => setShowPremium(true)}
        />
        
      </div>
    </div>
  );
}