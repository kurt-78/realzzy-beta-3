"use client";

import React, { useState } from "react";

export default function OccupationSelector() {
  const occupations: string[] = [
    "Management Occupations",
    "Business and Financial Operations",
    "Computer and Mathematical",
    "Architecture and Engineering",
    "Life, Physical, and Social Science",
    "Legal",
    "Education, Training, and Library",
    "Arts, Design, Entertainment, Sports, and Media",
    "Healthcare Practitioners and Technical",
    "Healthcare Support",
    "Protective Service",
    "Food Preparation and Serving",
    "Building and Grounds Cleaning and Maintenance",
    "Personal Care and Service",
    "Sales and Related",
    "Office and Administrative Support",
    "Farming, Fishing, and Forestry",
    "Construction and Extraction",
    "Installation, Maintenance, and Repair",
    "Production",
    "Transportation and Material Moving",
    "Other"
  ];

  const [selected, setSelected] = useState<string>("");

  return (
    <div
      className="max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-md border"
      style={{
        backgroundColor: "var(--bg-color, #fff)",
        color: "var(--text-color, #111)",
        borderColor: "var(--border-color, #ccc)",
        transition: "background-color 0.3s ease, color 0.3s ease"
      }}
    >
      <style jsx>{`
        @media (prefers-color-scheme: dark) {
          div {
            --bg-color: #111827;
            --text-color: #f9fafb;
            --border-color: #374151;
          }
        }
      `}</style>

      <label className="text-lg font-semibold mb-2 block">
        Select an Occupational Category
      </label>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          backgroundColor: "var(--bg-color, #fff)",
          color: "var(--text-color, #111)",
          borderColor: "var(--border-color, #ccc)",
        }}
      >
        <option value="">Choose a category...</option>
        {occupations.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {selected && (
        <div
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: "var(--bg-color, #f9fafb)",
            borderColor: "var(--border-color, #ccc)",
          }}
        >
          <h2 className="text-xl font-bold">{selected}</h2>
        </div>
      )}
    </div>
  );
}