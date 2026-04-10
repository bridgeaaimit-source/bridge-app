"use client";

import { useState, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Upload, 
  FileText, 
  Send, 
  Loader2, 
  MessageSquare, 
  X,
  Sparkles,
  BookOpen,
  List,
  HelpCircle,
  Quiz
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PDFReaderPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const quickPrompts = [
    { icon: BookOpen, text: "Summarize this PDF" },
    { icon: List, text: "List key points" },
    { icon: HelpCircle, text: "What are the main topics?" },
    { icon: Quiz, text: "Create quiz questions" }
  ];

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setPdfFile(file);
        setPdfBase64(base64);
        setChatMessages([{
          role: 'assistant',
          content: `I've loaded "${file.name}". You can now ask me anything about this PDF!`
        }]);
        toast.success('PDF uploaded successfully!');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload PDF');
      setIsUploading(false);
    }
  }, []);

  const handleSendMessage = async (question = currentQuestion) => {
    if (!question.trim() || !pdfBase64 || isLoading) return;

    const userMessage = { role: 'user', content: question };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/pdf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_base64: pdfBase64,
          question: question,
          chat_history: chatMessages
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer
      }]);
    } catch (error) {
      toast.error('Failed to get answer. Please try again.');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  const clearPDF = () => {
    setPdfFile(null);
    setPdfBase64(null);
    setChatMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-4rem)]">
        <div className="flex gap-6 h-full">
          {/* LEFT - PDF Viewer */}
          <div className="w-[40%] flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8F0] overflow-hidden flex-1">
              {!pdfFile ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div 
                    className="border-2 border-dashed border-[#E8E8F0] rounded-2xl p-12 text-center cursor-pointer hover:border-[#6C3FE8] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-[#8888A0] mx-auto mb-4" />
                    <p className="text-[#44445A] font-medium mb-2">Click to upload PDF</p>
                    <p className="text-sm text-[#8888A0]">or drag and drop</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-[#E8E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#6C3FE8]" />
                      <span className="text-sm font-medium text-[#44445A] truncate max-w-[200px]">
                        {pdfFile.name}
                      </span>
                    </div>
                    <button
                      onClick={clearPDF}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="flex-1 p-4">
                    <iframe
                      src={`data:application/pdf;base64,${pdfBase64}`}
                      className="w-full h-full rounded-lg border border-[#E8E8F0]"
                      title="PDF Viewer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - AI Chat */}
          <div className="w-[60%] flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8F0] flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-[#E8E8F0]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#6C3FE8]" />
                  <h2 className="font-semibold text-[#0D0D1A]">AI PDF Assistant</h2>
                </div>
                <p className="text-sm text-[#8888A0] mt-1">
                  Ask anything about your PDF - summaries, explanations, key points
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="w-16 h-16 text-[#E8E8F0] mb-4" />
                    <p className="text-[#8888A0]">
                      Upload a PDF to start asking questions
                    </p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-[#6C3FE8] text-white rounded-br-md'
                            : 'bg-[#F8F7FF] text-[#44445A] rounded-bl-md border border-[#E8E8F0]'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#F8F7FF] p-4 rounded-2xl rounded-bl-md border border-[#E8E8F0]">
                      <Loader2 className="w-5 h-5 text-[#6C3FE8] animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              {pdfFile && chatMessages.length <= 1 && (
                <div className="px-4 py-3 border-t border-[#E8E8F0]">
                  <p className="text-xs text-[#8888A0] mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F7FF] text-[#6C3FE8] text-sm rounded-full hover:bg-[#EDE9FF] transition-colors disabled:opacity-50"
                      >
                        <prompt.icon className="w-3.5 h-3.5" />
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-[#E8E8F0]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={pdfFile ? "Ask anything about this PDF..." : "Upload a PDF first..."}
                    disabled={!pdfFile || isLoading}
                    className="flex-1 px-4 py-3 bg-[#F8F7FF] border border-[#E8E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C3FE8] focus:border-transparent text-[#44445A] placeholder-[#8888A0] disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!pdfFile || !currentQuestion.trim() || isLoading}
                    className="px-4 py-3 bg-[#6C3FE8] text-white rounded-xl hover:bg-[#5535C5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
