"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, ChevronLeft, ChevronRight, ArrowLeft, Volume2, VolumeX, Heart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import toast from "react-hot-toast";

interface ProfileVideo {
  id: string;
  video_url: string;
  duration: number;
  order_index: number;
}

interface ProfileData {
  id: string;
  first_name: string;
  age: number;
  date_of_birth: string;
  sex: string;
  looking_for_sex: string;
  looking_for_relation_type: string;
  ethnicity: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  height: number | null;
  body_type: string | null;
  have_children: string | null;
  occupation: string | null;
  smoke: string | null;
  drink: string | null;
  drugs: string | null;
  religion: string | null;
  description: string;
}

// Like Button Component
function LikeButton({ profileId, currentUserId }: { profileId: string; currentUserId: string | null }) {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      checkIfLiked();
    }
  }, [currentUserId, profileId]);

  const checkIfLiked = async () => {
    if (!currentUserId) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profile_likes")
        .select("id")
        .eq("liker_id", currentUserId)
        .eq("liked_id", profileId)
        .maybeSingle();

      if (error) {
        console.error("Error checking like status:", error);
        return;
      }

      setIsLiked(!!data);
    } catch (err) {
      console.error("Error in checkIfLiked:", err);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast.error("Please log in to like profiles");
      return;
    }

    if (currentUserId === profileId) {
      toast.error("You cannot like your own profile");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("profile_likes")
          .delete()
          .eq("liker_id", currentUserId)
          .eq("liked_id", profileId);

        if (error) {
          console.error("Unlike error:", error);
          throw new Error(error.message || "Failed to unlike");
        }

        setIsLiked(false);
        toast.success("Like removed");
      } else {
        // Like
        const { error } = await supabase
          .from("profile_likes")
          .insert({
            liker_id: currentUserId,
            liked_id: profileId,
          });

        if (error) {
          console.error("Like error:", error);
          throw new Error(error.message || "Failed to like");
        }

        setIsLiked(true);
        toast.success("Profile liked! 💕");
      }
    } catch (err: any) {
      console.error("Error toggling like:", err);
      toast.error(err.message || "Failed to update like. Please make sure you've run the database setup.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === profileId) return null;

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50 ${
        isLiked
          ? "bg-pink-500 text-white hover:bg-pink-600"
          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 border-2 border-pink-500"
      }`}
    >
      <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
      <span>{isLiked ? "Liked" : "Like"}</span>
    </button>
  );
}

function VideoPlayer({ videos }: { videos: ProfileVideo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setIsPlaying(false);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && videos.length > 1) {
      nextVideo();
    }
    if (isRightSwipe && videos.length > 1) {
      prevVideo();
    }
  };

  const togglePlay = () => {
    const videoElement = document.querySelector(
      `video[data-profile-video-id="${videos[currentIndex].id}"]`
    ) as HTMLVideoElement;
    
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
        setIsPlaying(false);
      } else {
        videoElement.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const videoElement = document.querySelector(
      `video[data-profile-video-id="${videos[currentIndex].id}"]`
    ) as HTMLVideoElement;
    
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No videos</p>
      </div>
    );
  }

  return (
    <div className="sticky top-4">
      <div 
        className="relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <video
          key={videos[currentIndex].id}
          data-profile-video-id={videos[currentIndex].id}
          src={videos[currentIndex].video_url}
          className="w-full h-full object-cover cursor-pointer"
          loop
          playsInline
          muted={isMuted}
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onClick={togglePlay}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-gray-900 ml-1" />
            </div>
          </div>
        )}

        {/* Video Navigation */}
        {videos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevVideo();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextVideo();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* Video Indicators */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setIsPlaying(false);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white w-10"
                      : "bg-white/50 w-6 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Mute/Unmute Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-4 right-4 w-10 h-10 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Video Duration */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm font-medium">
          {videos[currentIndex].duration}s
        </div>

        {/* Video Counter */}
        {videos.length > 1 && (
          <div className="absolute bottom-6 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm font-medium">
            {currentIndex + 1} / {videos.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    if (params.id) {
      loadProfile(params.id as string);
    }
  }, [params.id]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadProfile = async (profileId: string) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("Profile not found");

      setProfile(profileData);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from("profile_videos")
        .select("*")
        .eq("user_id", profileId)
        .order("order_index", { ascending: true });

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const formatHeight = (heightInInches: number | null) => {
    if (!heightInInches) return null;
    const feet = Math.floor(heightInInches / 12);
    const inches = heightInInches % 12;
    const cm = (heightInInches * 2.54).toFixed(0);
    return `${feet}'${inches}" (${cm} cm)`;
  };

  const formatLookingFor = (sex: string, lookingForSex: string) => {
    const sexMap: { [key: string]: string } = {
      "Male": "male",
      "Female": "female",
      "Trans-Male": "trans-male",
      "Trans-Female": "trans-female",
      "Other": "other",
      "Any": "anyone"
    };

    const userSex = sexMap[sex] || sex.toLowerCase();
    const seekingSex = sexMap[lookingForSex] || lookingForSex.toLowerCase();

    return `I am ${userSex} seeking ${seekingSex}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 dark:text-red-400 mb-4">
            {error || "Profile not found"}
          </p>
          <Link
            href="/"
            className="text-pink-500 hover:text-pink-600 font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profiles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Videos */}
            <div>
              <VideoPlayer videos={videos} />
            </div>

            {/* Right Side - Profile Information */}
            <div className="space-y-6">
              {/* Name & Age with Like Button */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                      {profile.first_name}
                    </h1>
                    <span className="text-2xl text-gray-600 dark:text-gray-400">
                      {profile.age}
                    </span>
                  </div>
                  <LikeButton profileId={profile.id} currentUserId={currentUserId} />
                </div>
                <p className="text-pink-500 dark:text-pink-400 font-medium text-lg">
                  {formatLookingFor(profile.sex, profile.looking_for_sex)}
                </p>
                {profile.looking_for_relation_type && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Seeking {profile.looking_for_relation_type}
                  </p>
                )}
              </div>

              {/* About */}
              {profile.description && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    About
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h2>
                <div className="space-y-3">
                  {location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {location}
                      </span>
                    </div>
                  )}
                  {profile.ethnicity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ethnicity</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.ethnicity}
                      </span>
                    </div>
                  )}
                  {profile.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Height</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatHeight(profile.height)}
                      </span>
                    </div>
                  )}
                  {profile.body_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Body Type</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.body_type}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifestyle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Lifestyle
                </h2>
                <div className="space-y-3">
                  {profile.occupation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Occupation</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.occupation}
                      </span>
                    </div>
                  )}
                  {profile.have_children && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Have Children</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.have_children === "no" && "No"}
                        {profile.have_children === "yes" && "Yes"}
                        {profile.have_children === "want_someday" && "Want someday"}
                      </span>
                    </div>
                  )}
                  {profile.smoke && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Smoke</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.smoke === "no" && "No"}
                        {profile.smoke === "only_marijuana" && "Only marijuana"}
                        {profile.smoke === "yes" && "Yes"}
                      </span>
                    </div>
                  )}
                  {profile.drink && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Drink</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.drink === "no" && "No"}
                        {profile.drink === "sometimes" && "Sometimes"}
                        {profile.drink === "socially" && "Socially"}
                        {profile.drink === "heavy_drinker" && "Heavy drinker"}
                      </span>
                    </div>
                  )}
                  {profile.drugs && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Drugs</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.drugs === "no" && "No"}
                        {profile.drugs === "recreationally" && "Recreationally"}
                        {profile.drugs === "heavy_drug_abuser" && "Heavy drug abuser"}
                      </span>
                    </div>
                  )}
                  {profile.religion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Religion</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {profile.religion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
