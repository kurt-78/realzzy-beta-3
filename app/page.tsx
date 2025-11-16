"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, ChevronLeft, ChevronRight, VolumeX, Volume2, Heart } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import toast from "react-hot-toast";

interface ProfileVideo {
  id: string;
  video_url: string;
  duration: number;
  order_index: number;
}

interface Profile {
  id: string;
  first_name: string;
  age: number;
  sex: string;
  ethnicity: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  looking_for_sex: string;
  videos: ProfileVideo[];
}

// Like Button Component (inline for this file)
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
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
        isLiked
          ? "bg-pink-500 text-white hover:bg-pink-600"
          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600"
      }`}
    >
      <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
    </button>
  );
}

function VideoSlider({ videos, userName }: { videos: ProfileVideo[]; userName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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
      `video[data-video-id="${videos[currentIndex].id}"]`
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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const videoElement = document.querySelector(
      `video[data-video-id="${videos[currentIndex].id}"]`
    ) as HTMLVideoElement;
    
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-t-xl flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No videos</p>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-[9/16] bg-gray-900 rounded-t-xl overflow-hidden group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        key={videos[currentIndex].id}
        data-video-id={videos[currentIndex].id}
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
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 left-4 w-10 h-10 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors z-10"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Video Navigation */}
      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevVideo();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextVideo();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Video Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsPlaying(false);
                }}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/50 w-4 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Video Duration */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
        {videos[currentIndex].duration}s
      </div>
    </div>
  );
}

function ProfileCard({ profile, currentUserId }: { profile: Profile; currentUserId: string | null }) {
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <VideoSlider videos={profile.videos} userName={profile.first_name} />

      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile.first_name}
          </h3>
          <span className="text-lg text-gray-600 dark:text-gray-400">
            {profile.age}
          </span>
        </div>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {profile.ethnicity && (
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Ethnicity:
              </span>
              {profile.ethnicity}
            </p>
          )}

          {location && (
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Location:
              </span>
              {location}
            </p>
          )}

          {profile.looking_for_sex && profile.sex && (
            <p className="text-pink-500 dark:text-pink-400 font-medium">
              {formatLookingFor(profile.sex, profile.looking_for_sex)}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/profile/${profile.id}`}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all text-center"
          >
            View Profile
          </Link>
          <LikeButton profileId={profile.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadProfiles();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all profiles with at least 2 videos
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, age, sex, ethnicity, city, state, country, looking_for_sex")
        .not("first_name", "is", null)
        .not("age", "is", null)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        return;
      }

      // Fetch videos for all profiles
      const { data: videosData, error: videosError } = await supabase
        .from("profile_videos")
        .select("*")
        .in(
          "user_id",
          profilesData.map((p) => p.id)
        )
        .order("order_index", { ascending: true });

      if (videosError) throw videosError;

      // Group videos by user_id
      const videosByUser: { [key: string]: ProfileVideo[] } = {};
      videosData?.forEach((video) => {
        if (!videosByUser[video.user_id]) {
          videosByUser[video.user_id] = [];
        }
        videosByUser[video.user_id].push(video);
      });

      // Combine profiles with their videos, only include profiles with at least 2 videos
      const profilesWithVideos = profilesData
        .map((profile) => ({
          ...profile,
          videos: videosByUser[profile.id] || [],
        }))
        .filter((profile) => profile.videos.length >= 2); // Only show profiles with 2+ videos

      setProfiles(profilesWithVideos);
    } catch (err: any) {
      console.error("Error loading profiles:", err);
      setError("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Match
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Browse profiles and connect with people near you
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No profiles available yet. Be the first to create one!
            </p>
            <Link
              href="/auth/signup"
              className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Create Profile
            </Link>
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Realzzy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
