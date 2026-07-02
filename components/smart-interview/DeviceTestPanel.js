"use client";

import React, { useCallback } from 'react';
import { ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';
import CameraTest from './CameraTest';
import MicTest from './MicTest';
import VoiceTest from './VoiceTest';

export default function DeviceTestPanel({ startInterview, loading }) {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();

  const allPass = state.devices.cameraOk && state.devices.micOk && state.devices.voiceOk;
  const corePass = state.devices.micOk && state.devices.voiceOk;

  const setCameraOk = useCallback((val) => dispatch({ type: 'SET_DEVICES', payload: { cameraOk: val } }), [dispatch]);
  const setMicOk = useCallback((val) => dispatch({ type: 'SET_DEVICES', payload: { micOk: val } }), [dispatch]);
  const setVoiceOk = useCallback((val) => dispatch({ type: 'SET_DEVICES', payload: { voiceOk: val } }), [dispatch]);

  return (
    <AppShell>

      <div className="relative max-w-[800px] mx-auto px-6 py-12 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Verify Your Setup</h1>
          <p className="text-sm text-slate-500 font-semibold">Ensure camera and microphone are configured correctly for voice transcription.</p>
        </div>

        <div className="space-y-6">
          {state.config.mode === 'video' && (
            <CameraTest onResult={setCameraOk} />
          )}
          <MicTest onResult={setMicOk} />
          <VoiceTest 
            onResult={setVoiceOk} 
            selectedLang={state.devices.selectedLang} 
          />

          {(state.config.mode === 'video' ? allPass : corePass) ? (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 text-center space-y-4 animate-fade-in shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Setup Verified!</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Everything is working correctly. You're ready to start!</p>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('bridge_device_test_done', 'true');
                  }
                  startInterview(true);
                }}
                disabled={loading}
                className="w-full bg-[#00C4A7] text-white py-4 rounded-xl font-bold hover:bg-[#00b296] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    Start Interview <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 text-center space-y-3 shadow-sm">
              <p className="text-xs text-amber-600 font-bold">Please complete the verification checks above to start.</p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('bridge_device_test_done', 'true');
                  }
                  startInterview(true);
                }}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold underline flex items-center gap-1 mx-auto disabled:opacity-50"
              >
                Skip verification and start anyway
              </button>
            </div>
          )}
          
          <button
            onClick={() => dispatch({ type: 'SET_STATUS', payload: 'setup' })}
            disabled={loading}
            className="w-full py-3 bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Parameters Setup
          </button>
        </div>
      </div>
    </AppShell>
  );
}
