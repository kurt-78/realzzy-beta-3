import { createClient } from '@/lib/supabase/client';

// Use your existing client creation method
const getSupabaseClient = () => createClient();

/**
 * Upload video to Supabase storage
 */
export async function uploadProfileVideo(
  userId: string,
  videoBlob: Blob,
  orderIndex: number
): Promise<{ videoUrl: string; videoPath: string }> {
  const supabase = getSupabaseClient();
  const timestamp = Date.now();
  const fileName = `${userId}/video_${orderIndex}_${timestamp}.webm`;

  console.log('Uploading to:', fileName);

  const { data, error } = await supabase.storage
    .from('profile-videos')
    .upload(fileName, videoBlob, {
      contentType: 'video/webm',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('profile-videos')
    .getPublicUrl(fileName);

  return {
    videoUrl: publicUrlData.publicUrl,
    videoPath: fileName,
  };
}

/**
 * Delete video from Supabase storage
 */
export async function deleteProfileVideo(videoPath: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.storage
    .from('profile-videos')
    .remove([videoPath]);

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
}

/**
 * Save video metadata to database
 */
export async function saveVideoMetadata(
  userId: string,
  videoUrl: string,
  duration: number,
  orderIndex: number
) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('profile_videos')
    .insert({
      user_id: userId,
      video_url: videoUrl,
      duration: Math.round(duration),
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save video metadata: ${error.message}`);
  }

  return data;
}

/**
 * Get all videos for a user
 */
export async function getUserVideos(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('profile_videos')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch user videos: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete video metadata from database
 */
export async function deleteVideoMetadata(videoId: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('profile_videos')
    .delete()
    .eq('id', videoId);

  if (error) {
    throw new Error(`Failed to delete video metadata: ${error.message}`);
  }
}

/**
 * Update video order indices after deletion
 */
export async function reorderVideos(userId: string, videos: { id: string; order_index: number }[]) {
  const supabase = getSupabaseClient();
  
  const updates = videos.map((video) =>
    supabase
      .from('profile_videos')
      .update({ order_index: video.order_index })
      .eq('id', video.id)
  );

  await Promise.all(updates);
}

/**
 * Get current user from Supabase auth
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}