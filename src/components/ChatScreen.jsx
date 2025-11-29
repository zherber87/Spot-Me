// src/components/ChatScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const ChatScreen = ({ match, onBack, currentUser, db }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  // Realtime messages listener
  useEffect(() => {
    if (!match?.id || !db) return;

    const messagesRef = collection(db, 'matches', match.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    return () => unsubscribe();
  }, [match, db]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !db || !match?.id) return;

    const messagesRef = collection(db, 'matches', match.id, 'messages');

    try {
      await addDoc(messagesRef, {
        text: inputText.trim(),
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const otherUser = match?.otherUser || { name: 'User', emoji: '👤' };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-white shadow-sm flex items-center px-4 z-10 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-200 ml-2 flex items-center justify-center">
          {otherUser.emoji}
        </div>
        <span className="font-bold text-gray-800 ml-3">
          {otherUser.name}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? 'bg-rose-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 focus:outline-none"
        />
        <button
          type="submit"
          className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
