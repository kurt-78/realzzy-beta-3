"use client";

import React, { useState } from "react";

export default function BodyTypeSelector() {
  const [selectedBodyType, setSelectedBodyType] = useState<string>("");

  const bodyTypes: string[] = [
    "Petite",
    "Slim",
    "Average",
    "Athletic / Fit",
    "Muscular",
    "Curvy",
    "A few extra pounds",
    "Plus size",
  ];

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 rounded-2xl shadow-md transition-colors bg-white dark:bg-gray-900">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Select your body type
      </h2>

      <select
        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedBodyType}
        onChange={(e) => setSelectedBodyType(e.target.value)}
      >
        <option value="">-- Choose an option --</option>
        {bodyTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {selectedBodyType && (
        <div className="mt-6 text-center text-gray-700 dark:text-gray-200">
          <p className="text-lg">
            You selected:{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {selectedBodyType}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
