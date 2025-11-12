"use client";

import { useEffect, useState } from "react";
import { Play, Trash2, Plus, Loader2 } from "lucide-react";
import VideoRecorder from "./VideoRecorder";
import {
  uploadProfileVideo,
  saveVideoMetadata,
  getUserVideos,
  deleteVideoMetadata,
  deleteProfileVideo,
  reorderVideos,
  getCurrentUser,
} from "@/lib/supabase-videos";
import type { ProfileVideo } from "@/types/profile-videos";

export default function ProfileVideoManager() {
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const canAddMore = videos.length < 5;
  const needsMoreVideos = videos.length < 2;

  useEffect(() => {
    loadUserVideos();
  }, []);

  async function loadUserVideos() {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setUserId(user.id);

      const userVideos = await getUserVideos(user.id);
      setVideos(userVideos);
    } catch (err) {
      console.error("Error loading videos:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }

  async function handleVideoRecorded(blob: Blob, duration: number) {
    try {
      setUploading(true);
      setError("");

      // Get the next order index
      const nextOrderIndex = videos.length;

      // Upload video to Supabase storage
      const { videoUrl } = await uploadProfileVideo(userId, blob, nextOrderIndex);

      // Save metadata to database
      const newVideo = await saveVideoMetadata(
        userId,
        videoUrl,
        duration,
        nextOrderIndex
      );

      // Update local state
      setVideos([...videos, newVideo]);
      setShowRecorder(false);
    } catch (err) {
      console.error("Error uploading video:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload video"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteVideo(video: ProfileVideo) {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      setLoading(true);

      // Extract the storage path from the URL
      const url = new URL(video.video_url);
      const pathMatch = url.pathname.match(/profile-videos\/(.+)$/);
      if (pathMatch) {
        const videoPath = pathMatch[1];
        await deleteProfileVideo(videoPath);
      }

      // Delete from database
      await deleteVideoMetadata(video.id);

      // Update order indices
      const remainingVideos = videos
        .filter((v) => v.id !== video.id)
        .map((v, index) => ({ id: v.id, order_index: index }));

      if (remainingVideos.length > 0) {
        await reorderVideos(userId, remainingVideos);
      }

      // Reload videos
      await loadUserVideos();
    } catch (err) {
      console.error("Error deleting video:", err);
      setError("Failed to delete video");
    } finally {
      setLoading(false);
    }
  }

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your videos...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Profile Videos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Add {needsMoreVideos ? `${2 - videos.length} more` : "up to 5"}{" "}
            videos to your profile
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Video Requirement Warning */}
        {needsMoreVideos && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">Minimum 2 videos required</p>
            <p className="text-sm mt-1">
              Add at least 2 videos to complete your profile
            </p>
          </div>
        )}

        {/* Upload Status */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Uploading your video...</span>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group"
            >
              <video
                src={video.video_url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={playingVideo !== video.id}
                onClick={() => {
                  const videoElement = document.querySelector(
                    `video[src="${video.video_url}"]`
                  ) as HTMLVideoElement;
                  if (videoElement) {
                    if (playingVideo === video.id) {
                      videoElement.pause();
                      setPlayingVideo(null);
                    } else {
                      // Pause all other videos
                      document.querySelectorAll("video").forEach((v) => {
                        if (v !== videoElement) v.pause();
                      });
                      videoElement.play();
                      setPlayingVideo(video.id);
                    }
                  }
                }}
              />

              {/* Play Overlay */}
              {playingVideo !== video.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                </div>
              )}

              {/* Video Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-xs font-medium">
                  {video.duration}s
                </p>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteVideo(video)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Order Badge */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                {video.order_index + 1}
              </div>
            </div>
          ))}

          {/* Add Video Slots */}
          {canAddMore &&
            Array.from({ length: 5 - videos.length }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => setShowRecorder(true)}
                disabled={uploading}
                className="aspect-[9/16] bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-400 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Add Video</p>
                <p className="text-xs text-gray-500 px-4 text-center">
                  15-60 seconds
                </p>
              </button>
            ))}
        </div>

        {/* Add More Button (when at least 2 videos exist) */}
        {!needsMoreVideos && canAddMore && (
          <button
            onClick={() => setShowRecorder(true)}
            disabled={uploading}
            className="w-full bg-red-500 text-white py-4 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Video ({videos.length}/5)
          </button>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-2">Video Tips</h3>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li>• Videos must be 15-60 seconds long</li>
            <li>• Show your personality and interests</li>
            <li>• Use good lighting for best results</li>
            <li>• Be authentic and natural</li>
            <li>• Minimum 2 videos required to complete profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}