// src/UpgradeScreen.jsx
import React from 'react';
import { Dumbbell, Check, ArrowLeft } from 'lucide-react';

export function UpgradeScreen({ userData, onBack, onConfirmUpgrade }) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">SpotMe Gold</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.45) 2px, transparent 3px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/40">
              <Dumbbell size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">
              Unlock SpotMe Gold
            </h2>
            <p className="text-sm text-white/90">
              Get more visibility, unlimited swipes, and see who already likes you.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 mb-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            What you get
          </h3>
          <div className="space-y-3">
            {[
              'See who liked you instantly',
              'Unlimited daily swipes',
              'Advanced distance & intent filters',
              'Extra Super Swipes to stand out',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-amber-600 stroke-[3]" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Your plan
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                SpotMe Gold
              </div>
              <div className="text-xs text-gray-500">
                Billed monthly. Cancel anytime.
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-gray-900">$9.99</div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
          </div>

          <button
            onClick={onConfirmUpgrade}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Continue with Gold
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-2">
            By continuing, you agree to SpotMe&apos;s Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
