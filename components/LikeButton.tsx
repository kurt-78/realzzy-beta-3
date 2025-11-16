"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

interface LikeButtonProps {
  profileId: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function LikeButton({ profileId, size = "md", showText = false }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentUserId(user.id);
      checkIfLiked(user.id);
    }
  };

  const checkIfLiked = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profile_likes")
      .select("id")
      .eq("liker_id", userId)
      .eq("liked_id", profileId)
      .single();

    setIsLiked(!!data);
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

        if (error) throw error;

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

        if (error) throw error;

        setIsLiked(true);
        toast.success("Profile liked! 💕");
      }
    } catch (err: any) {
      console.error("Error toggling like:", err);
      toast.error("Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === profileId) return null;

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
        isLiked
          ? "bg-pink-500 text-white hover:bg-pink-600"
          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600"
      } ${showText ? "px-4 gap-2" : ""}`}
    >
      <Heart
        className={`${iconSizes[size]} ${isLiked ? "fill-current" : ""}`}
      />
      {showText && (
        <span className="text-sm font-medium">
          {isLiked ? "Liked" : "Like"}
        </span>
      )}
    </button>
  );
}