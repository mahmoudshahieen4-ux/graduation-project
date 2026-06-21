import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, PhoneCall, Volume2 } from "lucide-react";
import { VoiceCallRecord } from "../types";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  doctorId: string;
  onCallComplete: (record: VoiceCallRecord) => void;
}

export default function VoiceCallModal({ isOpen, onClose, patientId, doctorId, onCallComplete }: VoiceCallModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setIsProcessing(false);
      setRecordingTime(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("تعذر الوصول إلى الميكروفون. يرجى السماح بصلاحيات التسجيل.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = (blob: Blob) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const res = await fetch("/api/calls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              doctorId,
              audioData: base64Audio
            })
          });

          if (!res.ok) throw new Error("فشل معالجة المكالمة");

          const record: VoiceCallRecord = await res.json();
          onCallComplete(record);
          onClose();
        } catch (err) {
          console.error(err);
          alert("تعذر معالجة المقطع الصوتي");
          setIsProcessing(false);
        }
        resolve();
      };
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-l from-teal-500 to-sky-500 p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
          <PhoneCall className="w-10 h-10 text-white mx-auto mb-2 drop-shadow-md" />
          <h2 className="text-xl font-bold text-white relative z-10">مكالمة تشخيصية مباشرة</h2>
          <p className="text-teal-50 text-sm opacity-90 mt-1 relative z-10">الذكاء الاصطناعي يستمع للتشخيص</p>
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-6">

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                <div className="absolute inset-0 bg-teal-400 blur-xl opacity-30 rounded-full"></div>
              </div>
              <p className="text-slate-600 font-medium">جاري معالجة الصوت وتوليد التفريغ النصي...</p>
              <p className="text-xs text-slate-400">Gemini 1.5 Flash يقوم بتحليل المحادثة</p>
            </div>
          ) : (
            <>
              {/* Visualizer Mock */}
              <div className="flex justify-center items-end gap-1 h-16 my-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-t-sm ${isRecording ? 'bg-teal-400 animate-pulse' : 'bg-slate-200'}`}
                    style={{
                      height: isRecording ? `${Math.max(10, Math.random() * 100)}%` : '10%',
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.5s'
                    }}
                  ></div>
                ))}
              </div>

              <div className="text-3xl font-mono text-slate-800 tracking-wider">
                {formatTime(recordingTime)}
              </div>

              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-all border border-rose-200 shadow-sm"
                >
                  <Square className="w-5 h-5 fill-current" />
                  إنهاء المكالمة ومعالجة التسجيل
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
                >
                  <Mic className="w-5 h-5" />
                  بدء تسجيل المحادثة
                </button>
              )}
            </>
          )}

          {!isProcessing && !isRecording && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              إلغاء وإغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
