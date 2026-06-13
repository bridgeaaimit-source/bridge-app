"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';

export default function MicTest({ onResult }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [volume, setVolume] = useState(0);
  const isMountedRef = useRef(true);

  const stopAll = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const startMic = useCallback(async () => {
    stopAll();
    if (!isMountedRef.current) return;
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setStatus("ok");
      onResult(true);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!isMountedRef.current) return;
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        setVolume(Math.sqrt(sum / buf.length));

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barW = (canvas.width / buf.length) * 2;
        let x = 0;
        for (let i = 0; i < buf.length; i++) {
          const h = (buf[i] / 255) * canvas.height * 0.8;
          ctx.fillStyle = "#0D9488";
          ctx.fillRect(x, canvas.height - h, barW, h);
          x += barW + 1;
        }
      };
      draw();
    } catch (err) {
      if (!isMountedRef.current) return;
      setStatus("error");
      onResult(false);
    }
  }, [onResult]);

  useEffect(() => {
    isMountedRef.current = true;
    const t = setTimeout(() => { startMic(); }, 0);
    return () => {
      isMountedRef.current = false;
      clearTimeout(t);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-50 text-green-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Microphone Verification</h3>
          <p className="text-[10px] text-gray-400">Speak to test input activity</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && volume > 5 && <span className="text-green-600 text-xs font-semibold">Working</span>}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <canvas ref={canvasRef} width={300} height={50} className="w-full h-12 rounded-lg bg-gray-50 border border-gray-200" />
      </div>
    </div>
  );
}
