import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (base64Audio: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to base64 for localstorage saving
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onRecordingComplete(base64data);
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해 주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecorder = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-apple-gray-50 border border-apple-gray-100/60 rounded-2xl w-full max-w-md mx-auto">
      {/* Visual Status */}
      <div className="text-center mb-6">
        <span className="text-xs font-bold text-apple-gray-300 uppercase tracking-wider block mb-2">
          {isRecording ? '녹음 중' : audioUrl ? '녹음 완료 - 재생 가능' : '마이크 녹음 대기'}
        </span>
        <span className="text-3xl font-mono font-bold text-apple-gray-800">
          {formatTime(recordingTime)}
        </span>
      </div>

      {/* Visual Waves when recording */}
      {isRecording && (
        <div className="flex items-center gap-1 h-8 mb-6">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5].map((val, i) => (
            <div
              key={i}
              className="w-1 bg-apple-blue rounded-full animate-pulse"
              style={{
                height: `${val * 6}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        {!audioUrl ? (
          // Recording Controls
          !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-16 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/10 transition-transform active:scale-95 group"
            >
              <Mic className="w-6 h-6 group-hover:scale-105 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="w-16 h-14 bg-apple-gray-800 hover:bg-apple-gray-800/90 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <Square className="w-5 h-5 fill-white" />
            </button>
          )
        ) : (
          // Playback Controls
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-12 h-12 bg-apple-blue hover:bg-apple-blue-light text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white/10" />}
            </button>

            <button
              type="button"
              onClick={resetRecorder}
              className="w-12 h-12 bg-apple-gray-100 hover:bg-apple-gray-200/80 text-apple-gray-300 rounded-full flex items-center justify-center border border-apple-gray-100 transition-transform active:scale-95"
              title="다시 녹음"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-apple-gray-100 rounded-full border border-apple-gray-100 text-apple-gray-300 text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5" />
              듣기 준비됨
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Tag for playing back */}
      {audioUrl && (
        <audio
          ref={(el) => {
            audioPlayerRef.current = el;
            if (el) {
              el.onended = () => setIsPlaying(false);
            }
          }}
          src={audioUrl}
          className="hidden"
        />
      )}
    </div>
  );
};
export default AudioRecorder;
