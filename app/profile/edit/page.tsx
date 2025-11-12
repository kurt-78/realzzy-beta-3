"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [sex, setSex] = useState("");
  const [lookingForSex, setLookingForSex] = useState("");
  const [lookingForRelationType, setLookingForRelationType] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [haveChildren, setHaveChildren] = useState("");
  const [occupation, setOccupation] = useState("");
  const [smoke, setSmoke] = useState("");
  const [drink, setDrink] = useState("");
  const [drugs, setDrugs] = useState("");
  const [religion, setReligion] = useState("");
  const [description, setDescription] = useState("");

  // Location state
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    checkUser();
    fetchCountries();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserId(user.id);
    loadProfile(user.id);
  };

  const loadProfile = async (uid: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (data) {
      setFirstName(data.first_name || "");
      setCountry(data.country || "");
      setState(data.state || "");
      setCity(data.city || "");
      setZipcode(data.zipcode || "");
      setDateOfBirth(data.date_of_birth || "");
      setAge(data.age || null);
      setSex(data.sex || "");
      setLookingForSex(data.looking_for_sex || "");
      setLookingForRelationType(data.looking_for_relation_type || "");
      setEthnicity(data.ethnicity || "");
      
      if (data.height) {
        setHeightFeet(Math.floor(data.height / 12).toString());
        setHeightInches((data.height % 12).toString());
      }
      
      setBodyType(data.body_type || "");
      setHaveChildren(data.have_children || "");
      setOccupation(data.occupation || "");
      setSmoke(data.smoke || "");
      setDrink(data.drink || "");
      setDrugs(data.drugs || "");
      setReligion(data.religion || "");
      setDescription(data.description || "");

      if (data.country && data.country !== "United States") {
        fetchStates(data.country);
      }
      if (data.country && data.state && data.country !== "United States") {
        fetchCities(data.country, data.state);
      }
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      const allCountries = data.data.map((c: any) => c.country);
      const sortedCountries = [
        "United States",
        ...allCountries.filter((c: string) => c !== "United States").sort(),
      ];
      setCountries(sortedCountries);
    } catch (err) {
      console.error("Failed to fetch countries", err);
      toast.error("Failed to load countries");
    }
  };

  const fetchStates = async (selectedCountry: string) => {
    setStates([]);
    setCities([]);
    setState("");
    setCity("");
    setLocationLoading(true);
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry }),
      });
      const data = await res.json();
      if (data?.data?.states) {
        setStates(data.data.states.map((s: any) => s.name));
      }
    } catch (err) {
      console.error("Failed to fetch states", err);
      toast.error("Failed to load states");
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchCities = async (selectedCountry: string, selectedState: string) => {
    setCities([]);
    setCity("");
    setLocationLoading(true);
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          state: selectedState,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.data)) setCities(data.data);
    } catch (err) {
      console.error("Failed to fetch cities", err);
      toast.error("Failed to load cities");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleZipLookup = async () => {
    if (!zipcode) {
      toast.error("Please enter a ZIP code");
      return;
    }
    setLocationLoading(true);
    const loadingToast = toast.loading("Looking up ZIP code...");
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
      if (!res.ok) throw new Error("Invalid ZIP code");
      const data = await res.json();
      const place = data.places[0];
      setCity(place["place name"]);
      setState(place.state);
      setCountry("United States");
      toast.success("Location found!", { id: loadingToast });
    } catch {
      toast.error("Unable to find location for that ZIP code", { id: loadingToast });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setState("");
    setCity("");
    setZipcode("");
    if (selectedCountry !== "United States") {
      fetchStates(selectedCountry);
    }
  };

  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    setCity("");
    if (country && country !== "United States") {
      fetchCities(country, selectedState);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (description.length < 20 || description.length > 300) {
      toast.error("Description must be between 20 and 300 characters");
      return;
    }

    if (!firstName || !sex || !lookingForSex || !lookingForRelationType || !dateOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const savingToast = toast.loading("Saving your profile...");

    try {
      const supabase = createClient();
      
      const totalHeight = heightFeet && heightInches 
        ? parseInt(heightFeet) * 12 + parseInt(heightInches)
        : null;
      
      const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;
      
      const profileData = {
        id: userId,
        first_name: firstName,
        country: country || null,
        state: state || null,
        city: city || null,
        zipcode: zipcode || null,
        date_of_birth: dateOfBirth || null,
        age: calculatedAge,
        sex: sex,
        looking_for_sex: lookingForSex,
        looking_for_relation_type: lookingForRelationType,
        ethnicity: ethnicity || null,
        height: totalHeight,
        body_type: bodyType || null,
        have_children: haveChildren || null,
        occupation: occupation || null,
        smoke: smoke || null,
        drink: drink || null,
        drugs: drugs || null,
        religion: religion || null,
        description: description,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) throw error;

      toast.success("Profile saved successfully! 🎉", { id: savingToast });
      setTimeout(() => {
        router.push("/profile/view");
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile", { id: savingToast });
    } finally {
      setLoading(false);
    }
  };

  const sexOptions = ["Male", "Female", "Trans-Male", "Trans-Female", "Other"];
  const lookingForOptions = [...sexOptions, "Any"];
  
  const ethnicities = [
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
  
  const bodyTypes = [
    "Petite",
    "Slim",
    "Average",
    "Athletic / Fit",
    "Muscular",
    "Curvy",
    "A few extra pounds",
    "Plus size",
  ];
  
  const occupations = [
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
  
  const religions = [
    'Agnosticism',
    'Atheism',
    'Bahá\'í Faith',
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

  const feetOptions = Array.from({ length: 5 }, (_, i) => (i + 3).toString());
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Tell us about yourself to find your perfect match
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Your first name"
              />
            </div>

            {/* Location */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-700/50">
              <label className="block text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                Location
              </label>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {country === "United States" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZIP Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Enter ZIP code"
                    />
                    <button
                      type="button"
                      onClick={handleZipLookup}
                      disabled={locationLoading}
                      className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 font-medium"
                    >
                      {locationLoading ? "..." : "Lookup"}
                    </button>
                  </div>

                  {city && state && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm">
                      <p className="text-green-800 dark:text-green-200">
                        <strong>City:</strong> {city}
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        <strong>State:</strong> {state}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {country && country !== "United States" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State / Region
                    </label>
                    <select
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={locationLoading}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      <option value="">Select state or region</option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {state && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={locationLoading}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                      >
                        <option value="">Select city</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  if (e.target.value) {
                    setAge(calculateAge(e.target.value));
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {age !== null && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  You are {age} years old
                </p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                {sexOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Looking For */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Looking For <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  required
                  value={lookingForSex}
                  onChange={(e) => setLookingForSex(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">-- Choose --</option>
                  {sexOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  seeking
                </span>
                
                <select
                  required
                  value={lookingForRelationType}
                  onChange={(e) => setLookingForRelationType(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">-- Choose --</option>
                  {lookingForOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ethnicity
              </label>
              <select
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                {ethnicities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Feet</option>
                  {feetOptions.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft} ft
                    </option>
                  ))}
                </select>
                
                <select
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Inches</option>
                  {inchesOptions.map((inch) => (
                    <option key={inch} value={inch}>
                      {inch} in
                    </option>
                  ))}
                </select>
                
                {heightFeet && heightInches && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    ({((parseInt(heightFeet) * 12 + parseInt(heightInches)) * 2.54).toFixed(1)} cm)
                  </span>
                )}
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Body Type
              </label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                {bodyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Have Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Have Children
              </label>
              <select
                value={haveChildren}
                onChange={(e) => setHaveChildren(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="want_someday">Want someday</option>
              </select>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profession
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                {occupations.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            {/* Do you smoke */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Do you smoke?
              </label>
              <select
                value={smoke}
                onChange={(e) => setSmoke(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                <option value="no">No</option>
                <option value="only_marijuana">Only marijuana</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Do you drink */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Do you drink?
              </label>
              <select
                value={drink}
                onChange={(e) => setDrink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                <option value="no">No</option>
                <option value="sometimes">Sometimes</option>
                <option value="socially">Socially</option>
                <option value="heavy_drinker">Heavy drinker</option>
              </select>
            </div>

            {/* Do you do drugs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Do you do drugs?
              </label>
              <select
                value={drugs}
                onChange={(e) => setDrugs(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                <option value="no">No</option>
                <option value="recreationally">Recreationally</option>
                <option value="heavy_drug_abuser">Heavy drug abuser</option>
              </select>
            </div>

            {/* Religion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Religion
              </label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                {religions.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                About You <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minLength={20}
                maxLength={300}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                placeholder="Tell us about yourself and what you're looking for (20-300 characters)"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/300 characters (minimum 20)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}