"use client";
import React, { useEffect, useState, ChangeEvent } from "react";

interface CountryData {
  country: string;
  states: { name: string }[];
}

interface CountriesResponse {
  data: CountryData[];
}

interface StatesResponse {
  data: {
    name: string;
    states: { name: string }[];
  };
}

interface CitiesResponse {
  data: string[];
}

interface ZipResponse {
  "post code": string;
  country: string;
  "country abbreviation": string;
  places: {
    "place name": string;
    state: string;
  }[];
}

interface Location {
  city: string;
  state: string;
}

const LocationForm: React.FC = () => {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [country, setCountry] = useState<string>("");
  const [stateRegion, setStateRegion] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [zipcode, setZipcode] = useState<string>("");
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 🗺️ Fetch all countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries");
        const data: CountriesResponse = await res.json();

        const allCountries = data.data.map((c) => c.country);
        // Sort alphabetically and put United States first
        const sortedCountries = [
          "United States",
          ...allCountries.filter((c) => c !== "United States").sort(),
        ];

        setCountries(sortedCountries);
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };
    fetchCountries();
  }, []);

  // 📜 Fetch states when country changes
  const fetchStates = async (selectedCountry: string) => {
    setStates([]);
    setCities([]);
    setStateRegion("");
    setCity("");
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry }),
      });
      const data: StatesResponse = await res.json();
      if (data?.data?.states) {
        setStates(data.data.states.map((s) => s.name));
      }
    } catch (err) {
      console.error("Failed to fetch states", err);
    }
  };

  // 🏙️ Fetch cities when state changes
  const fetchCities = async (selectedCountry: string, selectedState: string) => {
    setCities([]);
    setCity("");
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          state: selectedState,
        }),
      });
      const data: CitiesResponse = await res.json();
      if (Array.isArray(data.data)) setCities(data.data);
    } catch (err) {
      console.error("Failed to fetch cities", err);
    }
  };

  // 🇺🇸 ZIP lookup for U.S.
  const handleZipLookup = async () => {
    if (!zipcode) {
      alert("Please enter a ZIP code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
      if (!res.ok) throw new Error("Invalid ZIP code");
      const data: ZipResponse = await res.json();
      const place = data.places[0];
      const newLocation: Location = {
        city: place["place name"],
        state: place.state,
      };
      setLocation(newLocation);
      setCity(place["place name"]);
      setStateRegion(place.state);
    } catch {
      setLocation(null);
      alert("Unable to find location for that ZIP code.");
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCountry(selected);
    setZipcode("");
    setLocation(null);
    if (selected !== "United States") {
      fetchStates(selected);
    }
  };

  const handleStateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setStateRegion(selectedState);
    fetchCities(country, selectedState);
  };

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg space-y-6">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-4">
          Get Location
        </h2>

        {/* 🌍 Country - emphasized section */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-2xl p-6 bg-gray-50 dark:bg-gray-700/50 shadow-sm mb-6">
          <label className="block text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            Country
          </label>
          <select
            value={country}
            onChange={handleCountryChange}
            className="w-full border-2 border-gray-400 dark:border-gray-600 rounded-lg px-4 py-3 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold
                       focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c} className={c === "United States" ? "font-bold" : ""}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 🇺🇸 U.S. ZIP Lookup */}
        {country === "United States" && (
          <div>
            <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
              ZIP Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={zipcode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setZipcode(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                placeholder="Enter ZIP code"
              />
              <button
                onClick={handleZipLookup}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading
                    ? "bg-gray-500"
                    : "bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500"
                }`}
              >
                {loading ? "Loading..." : "Lookup"}
              </button>
            </div>

            {location && (
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 border-t pt-3">
                <p>
                  <strong>City:</strong> {location.city}
                </p>
                <p>
                  <strong>State:</strong> {location.state}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 🌐 Non-U.S. Flow */}
        {country && country !== "United States" && (
          <>
            {/* State/Region */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                State / Region
              </label>
              <select
                value={stateRegion}
                onChange={handleStateChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">Select state or region</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                City
              </label>
              <select
                value={city}
                onChange={handleCityChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationForm;
