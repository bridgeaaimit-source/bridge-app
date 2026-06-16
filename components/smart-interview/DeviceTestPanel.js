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
      <div className="max-w-[700px] mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{fontFamily:'Syne,sans-serif'}}>Verify Your Setup</h1>
          <p className="text-sm text-gray-500">Ensure camera and microphone are configured correctly for voice transcription.</p>
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
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-950 text-lg">Setup Verified!</h3>
                <p className="text-xs text-green-700">Everything is working correctly. {"You're"} ready to start!</p>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('bridge_device_test_done', 'true');
                  }
                  startInterview(true);
                }}
                disabled={loading}
                className="w-full bg-[#0D9488] text-white py-4 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center space-y-3">
              <p className="text-sm text-yellow-800 font-semibold">Please complete the verification checks above to start.</p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('bridge_device_test_done', 'true');
                  }
                  startInterview(true);
                }}
                disabled={loading}
                className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center gap-1 mx-auto disabled:opacity-50"
              >
                Skip verification and start anyway
              </button>
            </div>
          )}
          
          <button
            onClick={() => dispatch({ type: 'SET_STATUS', payload: 'setup' })}
            disabled={loading}
            className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Parameters Setup
          </button>
        </div>
      </div>
    </AppShell>
  );
}
