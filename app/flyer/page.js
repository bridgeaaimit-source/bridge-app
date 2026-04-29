"use client";

import { useState, useEffect, useRef } from "react";
import { Home, Mic, Zap, Trophy, User, Download, Share2, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";

const templates = [
  {
    id: "interview",
    title: "AI Mock Interview Score",
    template: "I scored {score}/10 in AI Mock Interview! 🚀",
    subtitle: "BRIDGE Score: {bridgeScore} | Interview Ready 💪"
  },
  {
    id: "streak",
    title: "Daily Streak Achievement",
    template: "Day {streak} streak on BRIDGE! 🔥",
    subtitle: "Consistency is key to placement success 💪"
  },
  {
    id: "ready",
    title: "Interview Ready",
    template: "I'm Interview Ready! 🎯",
    subtitle: "BRIDGE Score: {bridgeScore} | Top 10% in India 🏆"
  }
];

export default function FlyerPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [score, setScore] = useState("");
  const [bridgeScore, setBridgeScore] = useState("");
  const [streak, setStreak] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);

  const generateFlyer = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 1200;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6C63FF');
    gradient.addColorStop(1, '#4A47A3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < canvas.width; i += 40) {
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.arc(i, j, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add BRIDGE logo
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BRIDGE', canvas.width / 2, 150);
    
    // Add decorative elements
    ctx.fillStyle = '#FFD700';
    ctx.font = '40px Arial';
    ctx.fillText('🏆', 100, 200);
    ctx.fillText('🚀', canvas.width - 100, 200);
    ctx.fillText('⚡', 150, canvas.height - 150);
    ctx.fillText('🎯', canvas.width - 150, canvas.height - 150);
    
    // Main content box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(100, 300, canvas.width - 200, 400);
    
    // Add border to content box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 300, canvas.width - 200, 400);
    
    // Template text
    const templateText = selectedTemplate.template
      .replace('{score}', score)
      .replace('{bridgeScore}', bridgeScore)
      .replace('{streak}', streak);
    
    const subtitleText = selectedTemplate.subtitle
      .replace('{bridgeScore}', bridgeScore)
      .replace('{streak}', streak);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    // Word wrap for main text
    const words = templateText.split(' ');
    let line = '';
    let y = 450;
    const maxWidth = canvas.width - 250;
    const lineHeight = 60;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Subtitle
    ctx.font = '32px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const subtitleWords = subtitleText.split(' ');
    line = '';
    y += 80;
    
    for (let n = 0; n < subtitleWords.length; n++) {
      const testLine = line + subtitleWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = subtitleWords[n] + ' ';
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Add footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px Arial';
    ctx.fillText('bridgeapp.ai | India\'s Placement Intelligence Platform', canvas.width / 2, canvas.height - 80);
    
    // Add sparkle effects
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    setIsGenerating(false);
  };

  const downloadFlyer = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'bridge-achievement.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const shareFlyer = async () => {
    if (!canvasRef.current) return;
    
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'bridge-achievement.png', { type: 'image/png' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My BRIDGE Achievement',
              text: selectedTemplate.template
                .replace('{score}', score)
                .replace('{bridgeScore}', bridgeScore)
                .replace('{streak}', streak),
              files: [file]
            });
          } else {
            // Fallback - copy to clipboard
            const text = selectedTemplate.template
              .replace('{score}', score)
              .replace('{bridgeScore}', bridgeScore)
              .replace('{streak}', streak);
            
            await navigator.clipboard.writeText(text);
            alert('Achievement text copied to clipboard!');
          }
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error sharing. Please try downloading instead.');
    }
  };

  return (
    <AppShell>
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">Share Your Achievement</h1>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-gray-400 text-sm">Create beautiful shareable images</p>
        </header>

        {/* Template Selection */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Choose Template</h3>
          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full p-4 rounded-xl border transition-all ${
                  selectedTemplate.id === template.id
                    ? 'bg-purple-400/20 border-purple-300'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold">{template.title}</div>
                  <div className="text-sm text-gray-400 mt-1">{template.template}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Customization */}
        <div className="space-y-4 mb-6">
          {(selectedTemplate.template.includes('{score}') || selectedTemplate.subtitle.includes('{score}')) && (
            <div>
              <label className="block text-sm font-medium mb-2">Interview Score</label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                placeholder="Your score"
              />
            </div>
          )}
          
          {selectedTemplate.template.includes('{bridgeScore}') || selectedTemplate.subtitle.includes('{bridgeScore}') && (
            <div>
              <label className="block text-sm font-medium mb-2">BRIDGE Score</label>
              <input
                type="text"
                value={bridgeScore}
                onChange={(e) => setBridgeScore(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                placeholder="Your BRIDGE Score"
              />
            </div>
          )}
          
          {selectedTemplate.template.includes('{streak}') || selectedTemplate.subtitle.includes('{streak}') && (
            <div>
              <label className="block text-sm font-medium mb-2">Streak Days</label>
              <input
                type="text"
                value={streak}
                onChange={(e) => setStreak(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                placeholder="5"
              />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateFlyer}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-6"
          style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              Generating...
            </div>
          ) : (
            'Generate Flyer'
          )}
        </button>

        {/* Canvas Preview */}
        <div className="mb-6">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl border border-white/20"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-20">
          <button
            onClick={downloadFlyer}
            className="py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={shareFlyer}
            className="py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)' }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-md mx-auto px-6 py-3">
            <div className="grid grid-cols-5 gap-4">
              <a href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </a>
              <a href="/interview" className="flex flex-col items-center gap-1 text-gray-400">
                <Mic className="w-5 h-5" />
                <span className="text-xs">Practice</span>
              </a>
              <a href="/pulse" className="flex flex-col items-center gap-1 text-gray-400">
                <Zap className="w-5 h-5" />
                <span className="text-xs">PULSE</span>
              </a>
              <a href="/leaderboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xs">Trophy</span>
              </a>
              <a href="/profile" className="flex flex-col items-center gap-1 text-gray-400">
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
    </AppShell>
  );
}
