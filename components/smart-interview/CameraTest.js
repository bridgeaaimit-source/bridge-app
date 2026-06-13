"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';

export default function CameraTest({ onResult }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [errorMsg, setErrorMsg] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = useCallback(async (deviceId) => {
    stopStream();
    if (!isMountedRef.current) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      streamRef.current = stream;
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
      }
      
      setStatus("ok");
      onResult(true);
      
      const devs = await navigator.mediaDevices.enumerateDevices();
      if (!isMountedRef.current) return;
      
      const cams = devs.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (!selectedDevice && cams.length > 0) {
        setSelectedDevice(cams[0].deviceId);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setStatus("error");
      setErrorMsg(
        err.name === "NotAllowedError" ? "Camera permission denied" :
        err.name === "NotFoundError" ? "No camera found on this device" :
        "Camera access failed"
      );
      onResult(false);
    }
  }, [onResult, selectedDevice]);

  useEffect(() => {
    isMountedRef.current = true;
    const t = setTimeout(() => { startCamera(); }, 0);
    return () => {
      isMountedRef.current = false;
      clearTimeout(t);
      stopStream();
    };
  }, [startCamera]);

  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
    startCamera(e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-50 text-green-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Camera Verification</h3>
          <p className="text-[10px] text-gray-400">Ensure your face is clearly visible</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && <span className="text-green-600 text-xs font-semibold">Passed</span>}
          {status === "error" && <span className="text-red-600 text-xs font-semibold">Failed</span>}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden max-h-48">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {status === "loading" && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        {devices.length > 1 && (
          <select value={selectedDevice} onChange={handleDeviceChange} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none">
            {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,6)}`}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
