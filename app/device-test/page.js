"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera, Mic, Volume2, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, RefreshCw, ArrowRight, Globe,
  Monitor, Headphones, SkipForward
} from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

const LANGS = [
  { code: "en-IN", label: "🇮🇳 English (India)", desc: "Best for Indian speakers" },
  { code: "en-GB", label: "🇬🇧 English (UK)", desc: "" },
  { code: "en-US", label: "🇺🇸 English (US)", desc: "" },
];

function levenshtein(a, b) {
  const m = [], al = a.length, bl = b.length;
  for (let i = 0; i <= al; i++) m[i] = [i];
  for (let j = 0; j <= bl; j++) m[0][j] = j;
  for (let i = 1; i <= al; i++)
    for (let j = 1; j <= bl; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[al][bl];
}

// ─── Camera Test ──────────────────────────────────────────────────────────────
function CameraTest({ onResult }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [errorMsg, setErrorMsg] = useState("");
  const [showFix, setShowFix] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const streamRef = useRef(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = useCallback(async (deviceId) => {
    stopStream();
    setStatus("loading");
    setErrorMsg("");
    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setStatus("ok");
      onResult(true);
      // Enumerate after permission granted
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (!selectedDevice && cams.length > 0) setSelectedDevice(cams[0].deviceId);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err.name === "NotAllowedError" ? "Camera permission denied" :
        err.name === "NotFoundError" ? "No camera found on this device" :
        err.name === "NotReadableError" ? "Camera is in use by another app" :
        "Camera access failed"
      );
      onResult(false);
    }
  }, [onResult, selectedDevice]);

  useEffect(() => { startCamera(); return () => stopStream(); }, []);

  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
    startCamera(e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-100" : status === "error" ? "bg-red-100" : "bg-gray-100"}`}>
          <Camera className={`w-5 h-5 ${status === "ok" ? "text-green-600" : status === "error" ? "text-red-600" : "text-gray-500"}`} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Camera Test</h2>
          <p className="text-xs text-gray-500">Verify your camera is working</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Passed</span>}
          {status === "error" && <span className="flex items-center gap-1 text-red-600 text-sm font-medium"><XCircle className="w-4 h-4" /> Failed</span>}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Preview */}
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Camera className="w-12 h-12 text-gray-600" />
              <p className="text-gray-400 text-sm">{errorMsg}</p>
            </div>
          )}
          {status === "ok" && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Camera ON
            </div>
          )}
        </div>

        {/* Status */}
        {status === "ok" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> Camera detected — you look great!
          </div>
        )}
        {status === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
            <button onClick={() => setShowFix(!showFix)} className="flex items-center gap-1 text-sm text-[#0D9488] hover:underline">
              How to fix {showFix ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showFix && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1.5">
                <p>• In Chrome: click the 🔒 icon in address bar → Allow camera</p>
                <p>• Make sure no other app (Zoom, Teams) is using your camera</p>
                <p>• Try refreshing the page</p>
                <p>• If no camera, you can still do voice-only interview</p>
              </div>
            )}
          </div>
        )}

        {/* Device selector */}
        {devices.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">Switch camera:</label>
            <select value={selectedDevice} onChange={handleDeviceChange}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,8)}`}</option>)}
            </select>
          </div>
        )}

        <button onClick={() => startCamera(selectedDevice)}
          className="flex items-center gap-2 text-sm text-[#0D9488] hover:underline">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );
}

// ─── Microphone Test ──────────────────────────────────────────────────────────
function MicTest({ onResult }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [volume, setVolume] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [showFix, setShowFix] = useState(false);

  const stopAll = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
  };

  const startMic = useCallback(async (deviceId) => {
    stopAll();
    setStatus("loading");
    setErrorMsg("");
    try {
      const constraints = {
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setStatus("ok");
      onResult(true);

      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs.filter(d => d.kind === "audioinput"));

      // Draw waveform
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(buf);

        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        setVolume(rms);

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barW = (canvas.width / buf.length) * 2.5;
        let x = 0;
        for (let i = 0; i < buf.length; i++) {
          const h = (buf[i] / 255) * canvas.height * 0.85;
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, "#0D9488");
          grad.addColorStop(1, "#14B8A6");
          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - h, barW, h);
          x += barW + 1;
        }
      };
      draw();
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err.name === "NotAllowedError" ? "Microphone permission denied" :
        err.name === "NotFoundError" ? "No microphone found — please connect one" :
        err.name === "NotReadableError" ? "Microphone is in use by another app" :
        "Microphone access failed"
      );
      onResult(false);
    }
  }, [onResult]);

  useEffect(() => { startMic(); return () => stopAll(); }, []);

  const volumeLevel = volume < 8 ? { label: "Low — speak louder", color: "bg-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-50" }
    : volume < 100 ? { label: "Good", color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50" }
    : { label: "Too Loud — move back", color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-100" : status === "error" ? "bg-red-100" : "bg-gray-100"}`}>
          <Mic className={`w-5 h-5 ${status === "ok" ? "text-green-600" : status === "error" ? "text-red-600" : "text-gray-500"}`} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Microphone Test</h2>
          <p className="text-xs text-gray-500">Speak something to test your mic</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && volume > 5 && <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Detected</span>}
          {status === "error" && <span className="flex items-center gap-1 text-red-600 text-sm font-medium"><XCircle className="w-4 h-4" /> Failed</span>}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500 italic animate-pulse">Speak something to test your microphone...</p>

        {/* Visualizer */}
        <canvas ref={canvasRef} width={600} height={80}
          className="w-full h-20 rounded-xl bg-gray-50 border border-gray-200" />

        {/* Volume bar */}
        {status === "ok" && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${volumeLevel.color} transition-all duration-100 rounded-full`}
                  style={{ width: `${Math.min((volume / 120) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-gray-600 min-w-[90px]">Volume: {volumeLevel.label.split('—')[0].trim()}</span>
            </div>
            <div className={`flex items-center gap-2 p-3 ${volumeLevel.bg} rounded-xl text-sm ${volumeLevel.textColor}`}>
              {volume > 5 ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {volume > 5 ? "Microphone working — " + volumeLevel.label : "Speak now to test your microphone..."}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
            <button onClick={() => setShowFix(!showFix)} className="flex items-center gap-1 text-sm text-[#0D9488] hover:underline">
              How to fix {showFix ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showFix && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1.5">
                <p>• Click the 🔒 icon in your browser address bar → Allow microphone</p>
                <p>• Close other apps that use the mic (Zoom, Teams, etc.)</p>
                <p>• Check Windows Sound settings → ensure mic is not muted</p>
                <p>• Try plugging in an external microphone or headset</p>
              </div>
            )}
          </div>
        )}

        {/* Device selector */}
        {devices.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">Switch mic:</label>
            <select value={selectedDevice}
              onChange={e => { setSelectedDevice(e.target.value); startMic(e.target.value); }}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0,8)}`}</option>)}
            </select>
          </div>
        )}

        <button onClick={() => startMic(selectedDevice)} className="flex items-center gap-2 text-sm text-[#0D9488] hover:underline">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );
}

// ─── Voice Recognition Test ───────────────────────────────────────────────────
function VoiceTest({ onResult, selectedLang, onLangChange }) {
  const [isListening, setIsListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [interimText, setInterimText] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [showTips, setShowTips] = useState(false);
  const recognitionRef = useRef(null);
  const finalRef = useRef("");

  const TEST_SENTENCE = "My name is candidate and I am ready for my interview today";
  const testWords = TEST_SENTENCE.toLowerCase().split(" ");

  const calcAccuracy = useCallback((text) => {
    const heardWords = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    let matches = 0;
    const comp = testWords.map((expected, i) => {
      const h = heardWords[i] || "";
      const match = expected === h || levenshtein(expected, h) <= 1;
      if (match) matches++;
      return { expected, heard: h, match };
    });
    const acc = Math.round((matches / testWords.length) * 100);
    setComparison(comp);
    setAccuracy(acc);
    onResult(acc >= 65);
    if (acc < 80) setShowTips(true);
  }, [onResult, testWords]);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition requires Chrome or Edge"); return; }
    finalRef.current = "";
    setHeard(""); setInterimText(""); setAccuracy(null); setComparison([]);

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.lang = selectedLang;

    r.onstart = () => setIsListening(true);

    r.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        let best = event.results[i][0];
        for (let j = 1; j < event.results[i].length; j++) {
          if ((event.results[i][j]?.confidence || 0) > (best.confidence || 0)) best = event.results[i][j];
        }
        if (event.results[i].isFinal) final += best.transcript + " ";
        else interim += best.transcript;
      }
      if (final.trim()) {
        finalRef.current = (finalRef.current + " " + final).trim();
        setHeard(finalRef.current);
        setInterimText(interim);
        calcAccuracy(finalRef.current);
      } else setInterimText(interim);
    };

    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") console.warn(e.error); };
    r.onend = () => setIsListening(false);

    r.start();
    recognitionRef.current = r;
  }, [selectedLang, calcAccuracy]);

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const reset = () => {
    stop();
    finalRef.current = "";
    setHeard(""); setInterimText(""); setAccuracy(null); setComparison([]); setShowTips(false);
  };

  useEffect(() => () => stop(), []);

  const accuracyColor = accuracy === null ? "" : accuracy >= 80 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600";
  const accuracyBg = accuracy === null ? "" : accuracy >= 80 ? "bg-green-500" : accuracy >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accuracy !== null && accuracy >= 65 ? "bg-green-100" : accuracy !== null ? "bg-yellow-100" : "bg-gray-100"}`}>
          <Volume2 className={`w-5 h-5 ${accuracy !== null && accuracy >= 65 ? "text-green-600" : accuracy !== null ? "text-yellow-600" : "text-gray-500"}`} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Voice Recognition Test</h2>
          <p className="text-xs text-gray-500">Read the sentence aloud to test accuracy</p>
        </div>
        {accuracy !== null && (
          <div className="ml-auto">
            <span className={`font-bold text-lg ${accuracyColor}`}>{accuracy}%</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Language selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Recognition language:</span>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => onLangChange(l.code)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedLang === l.code ? "bg-[#0D9488] text-white border-[#0D9488]" : "bg-white text-gray-600 border-gray-200 hover:border-[#0D9488]"}`}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Test sentence */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Read this sentence aloud:</p>
          <div className="bg-[#F0FDFA] border border-teal-200 rounded-xl p-4">
            <p className="text-base font-medium text-[#0F766E] leading-relaxed">"{TEST_SENTENCE}"</p>
          </div>
        </div>

        {/* Live transcript */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[64px]">
          {heard || interimText ? (
            <p className="text-sm leading-relaxed">
              <span className="text-gray-900">{heard}</span>
              {interimText && <span className="text-gray-400 italic"> {interimText}</span>}
            </p>
          ) : isListening ? (
            <p className="text-sm text-gray-400 italic animate-pulse">Listening... read the sentence above</p>
          ) : (
            <p className="text-sm text-gray-400">Your spoken words will appear here...</p>
          )}
        </div>

        {/* Accuracy */}
        {accuracy !== null && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${accuracyBg} rounded-full transition-all duration-500`} style={{ width: `${accuracy}%` }} />
              </div>
              <span className={`font-bold text-sm min-w-[50px] ${accuracyColor}`}>{accuracy}% match</span>
            </div>

            {/* Word comparison */}
            {comparison.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Word comparison</p>
                <div className="flex flex-wrap gap-2">
                  {comparison.map((w, i) => (
                    <div key={i} className="text-center">
                      <div className={`text-xs px-2 py-1 rounded font-medium ${w.match ? "bg-green-100 text-green-800" : w.heard ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500"}`}>
                        {w.match ? w.expected : w.heard || "—"}
                      </div>
                      {!w.match && <div className="text-[10px] text-gray-400 line-through mt-0.5">{w.expected}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result banner */}
            {accuracy >= 80 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" /> Voice recognition working great!
              </div>
            ) : accuracy >= 50 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4" /> Partial recognition — you can proceed but accuracy may vary
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                <XCircle className="w-4 h-4" /> Low accuracy — check tips below
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {(showTips || accuracy !== null && accuracy < 80) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-sm text-amber-800">
            <p className="font-medium">Tips to improve accuracy:</p>
            <p>• Speak slower and more clearly</p>
            <p>• Move your mouth closer to the microphone</p>
            <p>• Reduce background noise</p>
            <p>• Use Chrome or Edge for best results</p>
            <p>• Try switching to 🇮🇳 English (India) if not selected</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!isListening ? (
            <button onClick={start}
              className="flex-1 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors flex items-center justify-center gap-2">
              <Mic className="w-4 h-4" /> {accuracy !== null ? "Try Again" : "Start Test"}
            </button>
          ) : (
            <button onClick={stop}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-white rounded-sm" /> Stop
            </button>
          )}
          {accuracy !== null && (
            <button onClick={reset} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function DeviceTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get("next") || "/smart-interview";

  const [cameraOk, setCameraOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [voiceOk, setVoiceOk] = useState(null);
  const [skipChecked, setSkipChecked] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");

  const allDone = cameraOk !== null && micOk !== null && voiceOk !== null;
  const allPass = cameraOk && micOk && voiceOk;
  const corePass = micOk && voiceOk; // can continue without camera

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    if (typeof window !== "undefined") localStorage.setItem("bridge_speech_lang", lang);
  };

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      // Always mark this session as tested so smart-interview doesn't redirect back
      sessionStorage.setItem("bridge_device_test_done", "true");
      if (skipChecked) {
        localStorage.setItem("bridge_skip_device_test", "true");
      }
    }
    router.push(nextRoute);
  };

  const progressSteps = [
    { label: "Camera", done: cameraOk !== null, ok: cameraOk },
    { label: "Microphone", done: micOk !== null, ok: micOk },
    { label: "Voice", done: voiceOk !== null, ok: voiceOk },
  ];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's check your setup</h1>
          <p className="text-gray-500">Takes about 30 seconds. Ensures the best interview experience.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {progressSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  step.done ? (step.ok ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500") : "border-gray-300 bg-white"
                }`}>
                  {step.done ? (
                    step.ok ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{i + 1}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">{step.label}</span>
              </div>
              {i < progressSteps.length - 1 && (
                <div className={`w-12 h-0.5 mb-4 ${step.done ? (step.ok ? "bg-green-400" : "bg-red-300") : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tests */}
        <div className="space-y-6">
          <CameraTest onResult={setCameraOk} />
          <MicTest onResult={setMicOk} />
          <VoiceTest onResult={setVoiceOk} selectedLang={selectedLang} onLangChange={handleLangChange} />
        </div>

        {/* Results CTA */}
        {allDone && (
          <div className={`mt-8 rounded-2xl p-6 border ${allPass ? "bg-green-50 border-green-200" : corePass ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
            {allPass ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">You're all set!</h3>
                  <p className="text-green-700 mt-1">Everything is working perfectly. Let's ace this interview!</p>
                </div>
              </div>
            ) : corePass ? (
              <div className="text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-yellow-600 mx-auto" />
                <h3 className="text-lg font-bold text-yellow-900">Mic is ready</h3>
                <p className="text-yellow-700 text-sm">Camera has an issue, but you can still do a voice interview.</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <XCircle className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="text-lg font-bold text-red-900">Setup needs attention</h3>
                <p className="text-red-700 text-sm">Please fix the issues above for the best experience.</p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {(allPass || corePass) && (
                <button onClick={handleContinue}
                  className="w-full bg-[#0D9488] text-white py-4 rounded-xl font-semibold hover:bg-[#0F766E] transition-all text-lg flex items-center justify-center gap-2">
                  Start Interview <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {!corePass && (
                <button onClick={handleContinue}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <SkipForward className="w-4 h-4" /> Continue anyway (not recommended)
                </button>
              )}

              {/* Skip checkbox */}
              <label className="flex items-center gap-3 cursor-pointer justify-center mt-2">
                <input type="checkbox" checked={skipChecked} onChange={e => setSkipChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]" />
                <span className="text-sm text-gray-600">Don't show this before interviews</span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={handleContinue}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
            <SkipForward className="w-4 h-4" /> Skip and go directly to interview
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function DeviceTestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>}>
      <DeviceTestContent />
    </Suspense>
  );
}
