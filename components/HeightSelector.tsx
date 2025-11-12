'use client'

import React, { useState, ChangeEvent } from "react";

interface HeightOption {
  label: string;
  value: number;
}

const HeightSelector: React.FC = () => {
  const [height, setHeight] = useState<number | null>(null);

  // Generate height options from 3'5" (41 inches) to 7'0" (84 inches)
  const minInches = 3 * 12 + 5;
  const maxInches = 7 * 12;
  const options: HeightOption[] = [];

  for (let inches = minInches; inches <= maxInches; inches++) {
    const feet = Math.floor(inches / 12);
    const inch = inches % 12;
    const cm = (inches * 2.54).toFixed(1);
    options.push({
      label: `${feet}'${inch}" — (${cm} cm)`,
      value: inches,
    });
  }

  // Format inches to feet and inches string
  const formatFeetInches = (inches: number): string => {
    const feet = Math.floor(inches / 12);
    const inch = inches % 12;
    return `${feet}'${inch}"`;
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = Number(e.target.value);
    setHeight(selectedValue || null);
  };

  return (
    <div className="p-8 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
      <h1 className="text-xl font-semibold mb-4">Select Your Height</h1>

      <div className="flex items-center space-x-3">
        {/* Display current height in cm */}
        <div className="font-medium w-24 text-right text-gray-700 dark:text-gray-300">
          {height ? `${(height * 2.54).toFixed(1)} cm` : "—"}
        </div>

        {/* Dropdown */}
        <select
          className="
            border border-gray-300 dark:border-gray-600 
            rounded-xl px-3 py-2 
            text-gray-800 dark:text-gray-100 
            bg-white dark:bg-gray-800 
            focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
            transition-colors duration-200
          "
          value={height ?? ""}
          onChange={handleChange}
        >
          <option value="">Select height</option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Show selected height below */}
      {height && (
        <p className="mt-4 text-lg">
          Selected height:{" "}
          <strong className="text-blue-600 dark:text-blue-400">
            {formatFeetInches(height)}
          </strong>
        </p>
      )}
    </div>
  );
};

export default HeightSelector;
