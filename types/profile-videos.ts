export interface ProfileVideo {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VideoRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  blob: Blob | null;
  url: string | null;
}

export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment';
    width?: { ideal: number };
    height?: { ideal: number };
  };
  audio: boolean;
}

export interface ProfileVideo {
  id: string;
  user_id: string;
  video_url: string;
  duration: number;
  order_index: number;
  created_at: string;
}