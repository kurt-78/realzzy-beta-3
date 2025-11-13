"use client";

import { useEffect, useState } from "react";

interface DateOfBirthPickerProps {
  value: string;
  onChange: (date: string) => void;
  onAgeCalculated?: (age: number) => void;
  required?: boolean;
  className?: string;
}

export default function DateOfBirthPicker({
  value,
  onChange,
  onAgeCalculated,
  required = false,
  className = "",
}: DateOfBirthPickerProps) {
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [age, setAge] = useState<number | null>(null);

  // Parse the date value when it changes from parent
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setMonth(date.getMonth() + 1);
      setDay(date.getDate());
      setYear(date.getFullYear());
      const calculatedAge = calculateAge(value);
      setAge(calculatedAge);
      if (onAgeCalculated) {
        onAgeCalculated(calculatedAge);
      }
    }
  }, [value, onAgeCalculated]);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  // Get the number of days in a given month/year (handles leap years)
  const getDaysInMonth = (m: number, y: number): number => {
    return new Date(y, m, 0).getDate();
  };

  // Get the maximum number of days for the current month/year selection
  const getMaxDays = (): number => {
    if (month && year) {
      return getDaysInMonth(month, year);
    }
    // If month selected but no year, use a non-leap year as default
    if (month) {
      return getDaysInMonth(month, 2023);
    }
    return 31; // Default to 31 if nothing selected
  };

  const handleMonthChange = (newMonth: string) => {
    const monthValue = newMonth ? parseInt(newMonth) : "";
    setMonth(monthValue);
    
    // If day is selected and it's invalid for new month, adjust it
    if (monthValue && day && year) {
      const maxDays = getDaysInMonth(monthValue, year);
      if (day > maxDays) {
        setDay(maxDays);
        updateDate(year, monthValue, maxDays);
      } else {
        updateDate(year, monthValue, day);
      }
    } else if (monthValue && day) {
      // No year selected yet
      const maxDays = getDaysInMonth(monthValue, 2023);
      if (day > maxDays) {
        setDay(maxDays);
      }
    }
  };

  const handleDayChange = (newDay: string) => {
    const dayValue = newDay ? parseInt(newDay) : "";
    setDay(dayValue);
    if (month && dayValue && year) {
      updateDate(year, month, dayValue);
    }
  };

  const handleYearChange = (newYear: string) => {
    const yearValue = newYear ? parseInt(newYear) : "";
    setYear(yearValue);
    
    // If month and day are selected, check if day is valid for the new year (leap year check)
    if (month && day && yearValue) {
      const maxDays = getDaysInMonth(month, yearValue);
      if (day > maxDays) {
        setDay(maxDays);
        updateDate(yearValue, month, maxDays);
      } else {
        updateDate(yearValue, month, day);
      }
    }
  };

  const updateDate = (y: number, m: number, d: number) => {
    const newDate = new Date(y, m - 1, d);
    const formattedDate = newDate.toISOString().split("T")[0];
    const calculatedAge = calculateAge(formattedDate);
    setAge(calculatedAge);
    onChange(formattedDate);
    if (onAgeCalculated) {
      onAgeCalculated(calculatedAge);
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 18; // Minimum age 18 for dating app

  const maxDays = getMaxDays();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Date of Birth {required && <span className="text-red-500">*</span>}
      </label>

      <div className="grid grid-cols-3 gap-3">
        {/* Month */}
        <select
          required={required}
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">Month</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        {/* Day */}
        <select
          required={required}
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">Day</option>
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          required={required}
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">Year</option>
          {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {age !== null && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You are {age} years old
        </p>
      )}
    </div>
  );
}