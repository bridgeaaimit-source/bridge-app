"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { levenshtein } from '@/lib/stringUtils';
import toast from 'react-hot-toast';

export default function VoiceTest({ onResult, selectedLang }) {
  const [isListening, setIsListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [interimText, setInterimText] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef("");
  const isMountedRef = useRef(true);

  const TEST_SENTENCE = "I am ready for my AI placement mock interview today";
  const testWords = TEST_SENTENCE.toLowerCase().split(" ");

  const calcAccuracy = useCallback((text) => {
    if (!isMountedRef.current) return;
    const heardWords = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    let matches = 0;
    testWords.forEach((expected, i) => {
      const h = heardWords[i] || "";
      if (expected === h || levenshtein(expected, h) <= 1) matches++;
    });
    const acc = Math.round((matches / testWords.length) * 100);
    setAccuracy(acc);
    onResult(acc >= 40);
  }, [onResult, testWords]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      // Nullify event handlers to prevent async updates on an unmounted component
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors if recognition is already stopped
      }
      recognitionRef.current = null;
    }
    if (isMountedRef.current) {
      setIsListening(false);
    }
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { 
      toast.error("Speech recognition requires Chrome or Edge"); 
      return; 
    }
    
    stop();
    if (!isMountedRef.current) return;
    
    finalRef.current = "";
    setHeard(""); 
    setInterimText(""); 
    setAccuracy(null);

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = selectedLang;

    r.onstart = () => {
      if (isMountedRef.current) {
        setIsListening(true);
      }
    };
    
    r.onresult = (event) => {
      if (!isMountedRef.current) return;
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const best = event.results[i][0];
        if (event.results[i].isFinal) final += best.transcript + " ";
        else interim += best.transcript;
      }
      if (final.trim()) {
        finalRef.current = (finalRef.current + " " + final).trim();
        setHeard(finalRef.current);
        setInterimText(interim);
        calcAccuracy(finalRef.current);
      } else {
        setInterimText(interim);
      }
    };

    r.onerror = () => {
      if (isMountedRef.current) {
        // Optionally handle errors safely here
      }
    };
    
    r.onend = () => {
      if (isMountedRef.current) {
        setIsListening(false);
      }
    };
    
    r.start();
    recognitionRef.current = r;
  }, [selectedLang, calcAccuracy, stop]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [stop]);

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-[#0D9488]">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Transcript Verification</h3>
          <p className="text-[10px] text-gray-400">Speak the text to calibrate</p>
        </div>
        {accuracy !== null && <span className="ml-auto text-xs font-bold text-[#0D9488]">{accuracy}% accuracy</span>}
      </div>
      <div className="p-5 space-y-3">
        <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 text-xs font-medium text-teal-800">
          {"\"" + TEST_SENTENCE + "\""}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[50px] text-xs">
          {heard || interimText ? (
            <p className="text-gray-900">{heard} {interimText && <span className="text-gray-400 italic">{interimText}</span>}</p>
          ) : (
            <p className="text-gray-400 italic">Spoken words will appear here...</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isListening ? (
            <button onClick={start} className="flex-1 bg-[#0D9488] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#0F766E]">
              Start Speaking Test
            </button>
          ) : (
            <button onClick={stop} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-red-600">
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
