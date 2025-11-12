"use client";

import React, { useState, ChangeEvent } from "react";

const EthnicityDropdown: React.FC = () => {
  const ethnicities: string[] = [
    "African / Black",
    "East Asian",
    "South Asian / Desi",
    "Southeast Asian",
    "Middle Eastern / Arab",
    "Hispanic / Latino",
    "Native American / Indigenous",
    "Pacific Islander",
    "White / Caucasian",
    "Mixed / Multiethnic",
    "Other",
  ];

  const [selectedEthnicity, setSelectedEthnicity] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEthnicity(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl shadow-md w-full max-w-md mx-auto bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <label
        htmlFor="ethnicity"
        className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200"
      >
        Select Your Ethnicity
      </label>

      <select
        id="ethnicity"
        value={selectedEthnicity}
        onChange={handleChange}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Choose an option --</option>
        {ethnicities.map((ethnicity, index) => (
          <option key={index} value={ethnicity}>
            {ethnicity}
          </option>
        ))}
      </select>

      {selectedEthnicity && (
        <div className="mt-5 text-center text-lg font-medium text-gray-800 dark:text-gray-200">
          You selected:{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {selectedEthnicity}
          </span>
        </div>
      )}
    </div>
  );
};

export default EthnicityDropdown;
