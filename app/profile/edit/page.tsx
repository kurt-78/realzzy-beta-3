"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Play, Trash2, Plus, Loader2, RotateCcw, X } from "lucide-react";
import DateOfBirthPicker from "@/components/DateOfBirthPicker";

// Import video functions
import {
  uploadProfileVideo,
  saveVideoMetadata,
  getUserVideos,
  deleteVideoMetadata,
  deleteProfileVideo,
  reorderVideos,
} from "@/lib/supabase-videos";
import type { ProfileVideo } from "@/types/profile-videos";

// Video Recorder Component (inline)
function VideoRecorder({
  onVideoRecorded,
  onCancel,
  maxDuration = 60,
  minDuration = 15,
}: {
  onVideoRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number;
  minDuration?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [camera, setCamera] = useState<"user" | "environment">("user");
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string>("");
  const [showMinDurationWarning, setShowMinDurationWarning] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingTime = maxDuration - elapsed;

  useEffect(() => {
    startCamera(camera);
    return stopCamera;
  }, []);

  async function startCamera(facing: "user" | "environment") {
    stopCamera();
    setError("");
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please grant camera permissions.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }

  function startRecording() {
    if (!streamRef.current || !cameraReady) return;

    let finalStream: MediaStream;

    if (camera === "user") {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      function draw() {
        if (!videoRef.current) return;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      }
      draw();

      finalStream = canvas.captureStream(30);
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) finalStream.addTrack(audioTracks[0]);
    } else {
      finalStream = streamRef.current;
    }

    const recorder = new MediaRecorder(finalStream, { mimeType: "video/webm" });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (duration < minDuration) {
        setShowMinDurationWarning(true);
        setTimeout(() => setShowMinDurationWarning(false), 3000);
        return;
      }

      onVideoRecorded(blob, duration);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    recorder.start();
    setRecording(true);
    setElapsed(0);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(currentElapsed);
      if (currentElapsed >= maxDuration) stopRecording();
    }, 1000);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }

  function switchCamera() {
    if (recording) return;
    const newCamera = camera === "user" ? "environment" : "user";
    setCamera(newCamera);
    startCamera(newCamera);
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-10" />
      
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
        <button onClick={onCancel} disabled={recording} className="w-10 h-10 flex items-center justify-center text-white">
          <X className="w-7 h-7" />
        </button>

        {recording && (
          <div className="flex flex-col items-center gap-1">
            <div className="bg-red-500 text-white px-6 py-2.5 rounded-full font-bold text-lg shadow-lg">
              {formatTime(elapsed)}
            </div>
            <div className="bg-red-500 text-white px-5 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {remainingTime}s remaining
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${camera === "user" ? "scale-x-[-1]" : ""}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-white text-center px-6">
              <p className="text-lg mb-4">{error}</p>
              <button onClick={() => startCamera(camera)} className="bg-red-500 text-white px-6 py-3 rounded-full">
                Try Again
              </button>
            </div>
          </div>
        )}

        {showMinDurationWarning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
            <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl">
              <p className="font-bold text-center">Video must be at least {minDuration} seconds</p>
            </div>
          </div>
        )}

        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>Loading camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20">
        <div className="flex items-center justify-center gap-8 px-8">
          <button onClick={switchCamera} disabled={recording || !cameraReady} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-50">
            <RotateCcw className="w-7 h-7" />
          </button>

          <button onClick={() => recording ? stopRecording() : startRecording()} disabled={!cameraReady} className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-50">
            <div className={recording ? "w-7 h-7 bg-red-500 rounded-sm" : "w-16 h-16 bg-red-500 rounded-full"} />
          </button>

          <div className="w-14 h-14" />
        </div>

        {!recording && cameraReady && (
          <p className="text-white/70 text-center text-sm mt-4">Record {minDuration}-{maxDuration} second video</p>
        )}
      </div>
    </div>
  );
}

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

  // Video state
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Location state
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const canAddMore = videos.length < 5;
  const needsMoreVideos = videos.length < 2;

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
    loadUserVideos(user.id);
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

  const loadUserVideos = async (uid: string) => {
    try {
      setLoadingVideos(true);
      const userVideos = await getUserVideos(uid);
      setVideos(userVideos);
    } catch (err) {
      console.error("Error loading videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleVideoRecorded = async (blob: Blob, duration: number) => {
    if (!userId) return;

    try {
      setUploading(true);
      const uploadToast = toast.loading("Uploading video...");

      const nextOrderIndex = videos.length;
      const { videoUrl } = await uploadProfileVideo(userId, blob, nextOrderIndex);
      const newVideo = await saveVideoMetadata(userId, videoUrl, duration, nextOrderIndex);

      setVideos([...videos, newVideo]);
      setShowRecorder(false);
      toast.success("Video uploaded! 🎉", { id: uploadToast });
    } catch (err: any) {
      console.error("Error uploading video:", err);
      toast.error(err.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (video: ProfileVideo) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    if (!userId) return;

    try {
      setLoadingVideos(true);
      const deleteToast = toast.loading("Deleting video...");

      const url = new URL(video.video_url);
      const pathMatch = url.pathname.match(/profile-videos\/(.+)$/);
      if (pathMatch) await deleteProfileVideo(pathMatch[1]);

      await deleteVideoMetadata(video.id);

      const remainingVideos = videos
        .filter((v) => v.id !== video.id)
        .map((v, index) => ({ id: v.id, order_index: index }));

      if (remainingVideos.length > 0) {
        await reorderVideos(userId, remainingVideos);
      }

      await loadUserVideos(userId);
      toast.success("Video deleted", { id: deleteToast });
    } catch (err: any) {
      console.error("Error deleting video:", err);
      toast.error("Failed to delete video");
    } finally {
      setLoadingVideos(false);
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

    if (needsMoreVideos) {
      toast.error("Please add at least 2 videos before saving");
      return;
    }

    if (description.length < 20 || description.length > 300) {
      toast.error("Description must be between 20 and 300 characters");
      return;
    }

    if (!firstName || !sex || !lookingForSex || !lookingForRelationType || !dateOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Age validation - must be 18 or older
    if (age !== null && age < 18) {
      toast.error("You must be at least 18 years old to use this app");
      return;
    }

    if (age === null) {
      toast.error("Please select a valid date of birth");
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

  // If showing recorder, show it full screen
  if (showRecorder) {
    return (
      <VideoRecorder
        onVideoRecorded={handleVideoRecorded}
        onCancel={() => setShowRecorder(false)}
        maxDuration={60}
        minDuration={15}
      />
    );
  }

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

            {/* Date of Birth - NEW COMPONENT */}
            <DateOfBirthPicker
              value={dateOfBirth}
              onChange={(date) => setDateOfBirth(date)}
              onAgeCalculated={(calculatedAge) => setAge(calculatedAge)}
              required
            />

            {/* I am seeking - CLEARER FORMAT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender & Preference <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                  I am
                </span>
                <select
                  required
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">-- Select --</option>
                  {sexOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                
                <span className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                  seeking
                </span>
                
                <select
                  required
                  value={lookingForSex}
                  onChange={(e) => setLookingForSex(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">-- Select --</option>
                  {lookingForOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select your gender and who you're looking for
              </p>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={lookingForRelationType}
                onChange={(e) => setLookingForRelationType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">-- Choose an option --</option>
                <option value="Long-term">Long-term</option>
                <option value="Short-term">Short-term</option>
                <option value="Casual">Casual</option>
                <option value="Friendship">Friendship</option>
                <option value="Marriage">Marriage</option>
                <option value="Open to anything">Open to anything</option>
              </select>
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

            {/* VIDEO SECTION */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-700/50">
              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Profile Videos <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add {videos.length === 0 ? "2-5" : needsMoreVideos ? `${2 - videos.length} more` : "up to 5"} videos (15-60 seconds each)
                </p>
              </div>

              {needsMoreVideos && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg mb-4">
                  <p className="font-semibold text-sm">⚠️ Minimum 2 videos required</p>
                  <p className="text-sm mt-1">Add at least 2 videos to complete your profile</p>
                </div>
              )}

              {uploading && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Uploading your video...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover cursor-pointer"
                      loop
                      playsInline
                      muted={playingVideo !== video.id}
                      onClick={() => {
                        const videoElement = document.querySelector(`video[src="${video.video_url}"]`) as HTMLVideoElement;
                        if (videoElement) {
                          if (playingVideo === video.id) {
                            videoElement.pause();
                            setPlayingVideo(null);
                          } else {
                            document.querySelectorAll("video").forEach((v) => {
                              if (v !== videoElement) v.pause();
                            });
                            videoElement.play();
                            setPlayingVideo(video.id);
                          }
                        }
                      }}
                    />

                    {playingVideo !== video.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                      <p className="text-white text-xs font-medium">{video.duration}s</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(video)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={loadingVideos}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute top-2 left-2 w-6 h-6 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                      {video.order_index + 1}
                    </div>
                  </div>
                ))}

                {canAddMore &&
                  Array.from({ length: 5 - videos.length }).map((_, index) => (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={() => setShowRecorder(true)}
                      disabled={uploading}
                      className="aspect-[9/16] bg-gray-100 dark:bg-gray-600 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-pink-400 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">Add Video</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2 text-center">15-60 sec</p>
                    </button>
                  ))}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">📹 Video Tips</h3>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>• Videos must be 15-60 seconds long</li>
                  <li>• Show your personality and interests</li>
                  <li>• Use good lighting for best results</li>
                  <li>• Minimum 2 videos required</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || needsMoreVideos}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {loading ? "Saving..." : needsMoreVideos ? `Add ${2 - videos.length} More Video(s) to Save` : "Save Profile"}
            </button>

            {needsMoreVideos && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                You need at least 2 videos to save your profile
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}