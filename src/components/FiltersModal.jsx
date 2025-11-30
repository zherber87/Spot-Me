// src/FiltersModal.jsx
import React, { useState } from "react";
import { X, Slider, MapPin } from "lucide-react";

export function FiltersModal({ onClose, filters, onApply }) {
  const [distance, setDistance] = useState(filters?.distance ?? 25);
  const [intent, setIntent] = useState(filters?.intent ?? "Any");
  const [ageMin, setAgeMin] = useState(filters?.ageMin ?? 18);
  const [ageMax, setAgeMax] = useState(filters?.ageMax ?? 50);

  const handleApply = () => {
    onApply({ distance, intent, ageMin, ageMax });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Distance */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-2">
              Max Distance
            </label>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-900 font-bold">{distance} miles</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Intent */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-2">
              Looking for
            </label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Any">Any</option>
              <option value="Gym Partner">Gym Partner</option>
              <option value="Relationship">Relationship</option>
              <option value="Coach">Coach</option>
            </select>
          </div>

          {/* Age Range */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-3">
              Age Range
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={ageMin}
                  min={18}
                  max={ageMax - 1}
                  onChange={(e) => setAgeMin(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={ageMax}
                  min={ageMin + 1}
                  max={80}
                  onChange={(e) => setAgeMax(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
