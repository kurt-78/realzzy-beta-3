'use client'

import React, { useState } from "react";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DateOfBirthPicker: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const calculateAge = (dob: Date): number => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const daysInMonth = (month: number, year: number): number =>
    new Date(year, month + 1, 0).getDate();

  const handleDateClick = (day: number): void => {
    const date = new Date(selectedYear, currentMonth.getMonth(), day);
    setSelectedDate(date);
    setShowCalendar(false);
    setAge(calculateAge(date));
  };

  const nextMonth = (): void => {
    setCurrentMonth(
      new Date(selectedYear, currentMonth.getMonth() + 1, 1)
    );
  };

  const prevMonth = (): void => {
    setCurrentMonth(
      new Date(selectedYear, currentMonth.getMonth() - 1, 1)
    );
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newYear = parseInt(event.target.value);
    setSelectedYear(newYear);
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  const renderDays = (): React.ReactNode[] => {
    const year = selectedYear;
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(month, year);
    const firstDay = new Date(year, month, 1).getDay();

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const allDays = [...blanks, ...days];

    return allDays.map((day, i) =>
      day ? (
        <button
          key={i}
          onClick={() => handleDateClick(day)}
          className="p-2 w-8 h-8 rounded-full text-gray-800 font-medium hover:bg-blue-500 hover:text-white transition"
        >
          {day}
        </button>
      ) : (
        <div key={i} className="w-8 h-8" />
      )
    );
  };

  // Create a list of 120 years (current year - 120)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  return (
    <div className="relative w-80 p-4 bg-white rounded-2xl shadow-md">
      <label className="font-medium text-gray-700">Date of Birth</label>

      <input
        type="text"
        readOnly
        value={
          selectedDate
            ? selectedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""
        }
        onClick={() => setShowCalendar(!showCalendar)}
        placeholder="Select your date of birth"
        className="border border-gray-700 text-gray-700 rounded-lg p-2 w-full mt-2 cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none"
      />

      {showCalendar && (
        <div className="absolute top-24 left-0 bg-white border rounded-xl shadow-lg p-3 w-full z-10">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={prevMonth}
              className="px-2 py-1 text-gray-700 hover:text-blue-500 text-lg font-bold"
            >
              ‹
            </button>
            <span className="font-medium text-gray-900 flex items-center space-x-2">
              <span>{months[currentMonth.getMonth()]}</span>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="border border-gray-300 rounded-md p-1 bg-white text-gray-800 cursor-pointer focus:ring-1 focus:ring-blue-400"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </span>
            <button
              onClick={nextMonth}
              className="px-2 py-1 text-gray-700 hover:text-blue-500 text-lg font-bold"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="font-semibold text-gray-600 text-sm">
                {d}
              </div>
            ))}
            {renderDays()}
          </div>
        </div>
      )}

      {age !== null && (
        <p className="mt-3 text-gray-900 font-medium">
          🎂 You are <span className="font-semibold">{age}</span> years old.
        </p>
      )}
    </div>
  );
};

export default DateOfBirthPicker;
