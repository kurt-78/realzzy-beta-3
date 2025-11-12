'use client'


import React, { useState, useEffect } from 'react';

export default function ReligionSelector() {
  const [selectedReligion, setSelectedReligion] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const religions: string[] = [
    'Agnosticism',
    'Atheism',
    'Baha’i Faith',
    'Buddhism',
    'Cao Dai',
    'Christianity',
    'Confucianism',
    'Druze',
    'Hinduism',
    'Islam',
    'Jainism',
    'Judaism',
    'Paganism',
    'Rastafarianism',
    'Satanism',
    'Scientology',
    'Shinto',
    'Sikhism',
    'Spiritualism',
    'Taoism',
    'Tenrikyo',
    'Unitarian Universalism',
    'Wicca',
    'Zoroastrianism',
    'Other'
  ];

  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
  const cardColor = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${bgColor} transition-colors duration-300 p-6`}>
      <div className={`${cardColor} shadow-2xl rounded-2xl border p-6 w-full max-w-sm text-center transition-colors duration-300`}>
        <h2 className={`text-2xl font-semibold ${textColor} mb-4`}>Select Your Religion</h2>

        <select
          className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-pink-400 focus:outline-none transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
          value={selectedReligion}
          onChange={(e) => setSelectedReligion(e.target.value)}
        >
          <option value="">-- Choose an option --</option>
          {religions.map((religion) => (
            <option key={religion} value={religion}>
              {religion}
            </option>
          ))}
        </select>

        {selectedReligion && (
          <div
            className={`mt-5 text-lg font-medium ${subTextColor} transition-opacity duration-500 opacity-100`}
          >
            You selected: <span className="text-pink-500">{selectedReligion}</span>
          </div>
        )}
      </div>
    </div>
  );
}
