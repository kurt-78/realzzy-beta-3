"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw } from "lucide-react";

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
  minDuration?: number; // in seconds
}

export default function VideoRecorder({
  onVideoRecorded,
  onCancel,
  maxDuration = 60,
  minDuration = 15,
}: VideoRecorderProps) {
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

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate remaining time
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
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access denied. Please grant camera permissions.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else {
          setError("Unable to access camera. Please check permissions.");
        }
      }
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function startRecording() {
    if (!streamRef.current || !cameraReady) return;

    let finalStream: MediaStream;

    if (camera === "user") {
      // Front camera - mirror the recording
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      function draw() {
        if (!videoRef.current) return;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          videoRef.current,
          -canvas.width,
          0,
          canvas.width,
          canvas.height
        );
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      }
      draw();

      finalStream = canvas.captureStream(30);
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        finalStream.addTrack(audioTracks[0]);
      }
    } else {
      // Back camera - record directly
      finalStream = streamRef.current;
    }

    // Determine best mime type
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    
    let selectedMimeType = 'video/webm';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    const recorder = new MediaRecorder(finalStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });
    
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (duration < minDuration) {
        setShowMinDurationWarning(true);
        setTimeout(() => setShowMinDurationWarning(false), 3000);
        return;
      }

      onVideoRecorded(blob, duration);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    recorder.start();
    setRecording(true);
    setElapsed(0);
    startTimeRef.current = Date.now();

    // Update timer every second
    timerIntervalRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(currentElapsed);

      if (currentElapsed >= maxDuration) {
        stopRecording();
      }
    }, 1000);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function switchCamera() {
    if (recording) return;
    const newCamera = camera === "user" ? "environment" : "user";
    setCamera(newCamera);
    startCamera(newCamera);
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Status Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition-transform"
          disabled={recording}
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
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

        {/* Spacer for layout balance */}
        {!recording && <div className="w-10" />}
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            camera === "user" ? "scale-x-[-1]" : ""
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
            <div className="text-white text-center px-6 max-w-sm">
              <p className="text-lg mb-4">{error}</p>
              <button
                onClick={() => startCamera(camera)}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Min Duration Warning */}
        {showMinDurationWarning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none z-30">
            <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl max-w-sm mx-4">
              <p className="font-bold text-center text-lg">
                Video must be at least {minDuration} seconds
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="text-white text-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg">Loading camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20">
        <div className="flex items-center justify-center gap-8 px-8">
          {/* Camera Switch Button */}
          <button
            onClick={switchCamera}
            disabled={recording || !cameraReady}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 active:scale-95 transition-all touch-manipulation"
            aria-label="Switch camera"
          >
            <RotateCcw className="w-7 h-7" strokeWidth={2} />
          </button>

          {/* Record Button */}
          <button
            onClick={toggleRecording}
            disabled={!cameraReady}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation ${
              recording
                ? "bg-white/90"
                : "bg-white/90"
            }`}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            <div
              className={`transition-all ${
                recording
                  ? "w-7 h-7 bg-red-500 rounded-sm"
                  : "w-16 h-16 bg-red-500 rounded-full"
              }`}
            />
          </button>

          {/* Spacer for symmetry */}
          <div className="w-14 h-14" />
        </div>

        {/* Duration Hint */}
        {!recording && cameraReady && (
          <p className="text-white/70 text-center text-sm mt-4 px-4">
            Record {minDuration}-{maxDuration} second video
          </p>
        )}
      </div>
    </div>
  );
}