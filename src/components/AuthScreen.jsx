import React, { useState } from 'react';
import { Dumbbell, Mail, Lock } from 'lucide-react';

export const AuthScreen = ({ onLogin, onSignup, loading }) => {
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
        <div className="bg-rose-500 p-4 rounded-2xl shadow-lg mb-4">
          <Dumbbell className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black italic text-gray-800 tracking-tighter">
          Spot<span className="text-rose-500">Me</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-rose-500 outline-none"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-rose-500 outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-rose-600 transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-rose-500 font-bold mt-2 hover:underline"
        >
          {isLogin ? 'Sign Up Free' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};
