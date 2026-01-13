
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Settings, Sparkles, Zap, Keyboard, Send, X, Power, Loader2, Star, Highlighter, ScanEye, Camera, CameraOff, Smile, PieChart, Volume2, MessageSquare, History, ChevronDown, Shield, Bot, Target, BookOpen, Lightbulb, GraduationCap, Info, Brain, Languages } from 'lucide-react';
import { AVATAR_CINDY_URL, AVATAR_MR_CHAN_URL, getUserAvatarUrl } from '../constants';
import { Message, ScenarioMode, UserSettings, Sentiment } from '../types';
import TalkingAvatar from './TalkingAvatar';
import { analyzeUserSentiment } from '../services/geminiService';

interface ChatInterfaceProps {
  messages: Message[];
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  scenario: ScenarioMode;
  currentSentiment: Sentiment;
  turnCount: number;
  isEnded: boolean;
  lastError: string | null;
  hints: string[] | null;
  loadingHint: boolean;
  intent: string | null;
  loadingIntent: boolean;
  modelAnswer: string | null;
  loadingModelAnswer: boolean;
  vocab: string[] | null;
  loadingVocab: boolean;
  settings: UserSettings;
  onToggleListening: () => void;
  onGenerateReport: () => void;
  onForceEnd: () => void;
  onGenerateHint: () => void;
  onGenerateIntent: () => void;
  onGenerateModelAnswer: () => void;
  onGenerateVocab: () => void;
  onOpenSettings: () => void;
  onUserResponse: (text: string) => void;
  onEditLastMessage: () => void;
  onVisionAnalysisResult?: (result: string) => void;
  onToggleLanguage: () => void; // Added Prop
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isListening,
  isProcessing,
  isSpeaking,
  transcript,
  scenario,
  currentSentiment,
  turnCount,
  isEnded,
  lastError,
  hints,
  loadingHint,
  intent,
  loadingIntent,
  modelAnswer,
  loadingModelAnswer,
  vocab,
  loadingVocab,
  settings,
  onToggleListening,
  onGenerateReport,
  onForceEnd,
  onGenerateHint,
  onGenerateIntent,
  onGenerateModelAnswer,
  onGenerateVocab,
  onOpenSettings,
  onUserResponse,
  onEditLastMessage,
  onVisionAnalysisResult,
  onToggleLanguage
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  
  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Vision Analysis State
  const [analyzingVision, setAnalyzingVision] = useState(false);
  const [visionFeedback, setVisionFeedback] = useState<string | null>(null);
  
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const isEnglish = settings.appLanguage === 'en-US';

  // Auto-scroll history when opened
  useEffect(() => {
    if (showHistory && historyScrollRef.current) {
        historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [showHistory, messages]);

  // Handle Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        // Attempt 1: Try with preferred constraints (facing mode user for mobile)
        try {
           stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } } 
           });
        } catch (constraintError) {
           console.warn("Preferred camera constraints failed, trying fallback...", constraintError);
           // Attempt 2: Fallback to basic video request if constraints fail
           stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to access camera:", err);
        setCameraActive(false);
      }
    };

    if (cameraActive) {
      startCamera();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const currentStream = videoRef.current.srcObject as MediaStream;
            currentStream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        // NOTE: We do NOT clear referenceImage here, so if they turn camera off and on, identity check persists.
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraActive]);

  const captureAndAnalyze = useCallback(async () => {
      if (!videoRef.current || analyzingVision) return;
      setAnalyzingVision(true);
      setVisionFeedback(null);
      try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
              const base64Image = canvas.toDataURL('image/jpeg', 0.8);
              
              let feedback = "";

              // Smart Reference Logic:
              // 1. If we have a reference image, use it for comparison (Identity Verification).
              // 2. If we DON'T have a reference, just analyze the single image (Presence Check).
              //    - If the result is "Safe" (no warning), we assume this is the valid user and lock it as reference.
              
              if (referenceImage) {
                  feedback = await analyzeUserSentiment(base64Image, referenceImage);
              } else {
                  // No reference yet: Single image analysis
                  feedback = await analyzeUserSentiment(base64Image);
                  
                  // If analysis passed (no warnings like "No Human" or "Not Looking"), set as reference
                  const isWarning = feedback.includes('警告') || feedback.includes('Warning') || feedback.includes('Alert');
                  if (!isWarning) {
                      setReferenceImage(base64Image);
                  }
              }
              
              setVisionFeedback(feedback);
              
              if (onVisionAnalysisResult) {
                  const timestamp = new Date().toLocaleTimeString();
                  onVisionAnalysisResult(`[${timestamp}]: ${feedback}`);
              }
              setTimeout(() => setVisionFeedback(null), 4000);
          }
      } catch (e) {
          console.error("Vision analysis failed", e);
      } finally {
          setAnalyzingVision(false);
      }
  }, [analyzingVision, onVisionAnalysisResult, referenceImage]);

  // Keep a ref to the function to avoid resetting the interval when dependencies change
  const captureAndAnalyzeRef = useRef(captureAndAnalyze);
  useEffect(() => {
    captureAndAnalyzeRef.current = captureAndAnalyze;
  }, [captureAndAnalyze]);

  // Periodic capture interval (5 seconds)
  useEffect(() => {
    if (cameraActive && !isEnded) {
        // Initial capture after delay
        const timeoutId = setTimeout(() => {
            captureAndAnalyzeRef.current?.();
        }, 1000);

        // Repeated capture every 5 seconds
        const intervalId = setInterval(() => {
            captureAndAnalyzeRef.current?.();
        }, 5000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }
  }, [cameraActive, isEnded]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onUserResponse(inputValue);
    setInputValue("");
    setShowInput(false);
  };

  const avatarName = scenario === 'standard' ? 'Cindy' : 'Ms. Lau';
  const roleTitle = scenario === 'standard' ? 'Unit Manager' : 'Senior Director';
  
  // DETERMINE DISPLAY CONTENT
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai');

  const isLiveTranscript = isListening && transcript.length > 0;
  
  // If user is speaking or has sent a message that is pending processing, show user text
  // Otherwise show the last AI message
  const displayMessage = isProcessing 
      ? { role: 'ai' as const, content: 'thinking...' }
      : isLiveTranscript
          ? { role: 'user' as const, content: transcript }
          : lastMessage?.role === 'user' 
              ? lastMessage 
              : (lastAiMessage || { role: 'ai' as const, content: isEnglish ? "Hello! I'm Cindy. Are you ready?" : "Hello! 我係 Cindy，準備好未？" });

  const maxTurns = settings.questionCount;
  
  // Configure Sentiment Feedback UI
  const sentimentConfig = (() => {
      if (currentSentiment === 'positive') return { label: "Encouraging", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50/90 dark:bg-amber-900/40", border: "border-amber-200 dark:border-amber-800" };
      if (currentSentiment === 'serious') return { label: "Deep Dive", icon: Brain, color: "text-blue-500", bg: "bg-blue-50/90 dark:bg-blue-900/40", border: "border-blue-200 dark:border-blue-800" };
      return null;
  })();

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-gray-950 font-sans flex flex-col">
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-[#D31145] dark:from-gray-900 dark:to-gray-800"></div>
          {/* Decorative shapes */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-white/10 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-500/20 rounded-full blur-[80px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      {/* --- TOP HUD --- */}
      <div className="relative z-20 pt-[calc(env(safe-area-inset-top)+1rem)] px-4 flex justify-between items-start">
          {/* Progress Segments */}
          <div className="flex-1 max-w-[200px] flex gap-1.5 pt-1">
              {Array.from({ length: maxTurns }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                        i < turnCount 
                            ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                            : i === turnCount 
                                ? 'bg-white/60 animate-pulse' 
                                : 'bg-black/20'
                    }`}
                  />
              ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
              <button 
                onClick={onToggleLanguage}
                className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center justify-center border border-white/10"
                title="Switch Language"
              >
                  <span className="text-[10px] font-bold w-5">{isEnglish ? 'EN' : 'HK'}</span>
              </button>
              
              <button 
                onClick={() => setShowAssistant(true)} 
                className="p-2 bg-black/20 hover:bg-[#D31145]/80 text-white rounded-full backdrop-blur-md transition-all active:scale-95 border border-white/10"
                title="AI Coach"
              >
                  <Bot size={18} />
              </button>
              <button onClick={() => setShowHistory(true)} className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all active:scale-95">
                  <History size={18} />
              </button>
              <button onClick={onOpenSettings} className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all active:scale-95">
                  <Settings size={18} />
              </button>
              <button onClick={onForceEnd} className="p-2 bg-red-900/40 hover:bg-red-900/60 text-white rounded-full backdrop-blur-md transition-all active:scale-95">
                  <Power size={18} />
              </button>
          </div>
      </div>

      {/* --- MAIN AVATAR AREA --- */}
      <div className="relative flex-1 z-10 flex flex-col items-center justify-end pb-[35vh]">
           
           {/* AI Mood Indicator - Explains why avatar is moving */}
           {sentimentConfig && !isEnded && (
                <div className={`absolute top-20 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm animate-fade-in transition-all ${sentimentConfig.bg} ${sentimentConfig.border}`}>
                    <sentimentConfig.icon size={14} className={sentimentConfig.color} />
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${sentimentConfig.color}`}>
                            {sentimentConfig.label}
                        </span>
                        <span className="text-[8px] text-gray-500 dark:text-gray-400 leading-none">
                            AI Mood
                        </span>
                    </div>
                </div>
           )}

           <div 
                className={`w-full h-full max-h-[60vh] flex items-end justify-center transition-all duration-1000 ease-in-out ${
                    currentSentiment === 'positive' ? 'scale-110 translate-y-6' : 
                    currentSentiment === 'serious' ? 'scale-95 opacity-90' : 
                    'scale-100'
                }`}
           >
               <TalkingAvatar 
                    isSpeaking={isSpeaking} 
                    mode={scenario} 
                    size="hero" 
                    sentiment={currentSentiment}
               />
           </div>
           
           {/* Floating Camera Preview with Visual Cues */}
           {cameraActive && !isEnded && (
                <div className={`absolute top-20 right-4 w-28 h-40 bg-black rounded-2xl overflow-hidden shadow-2xl z-30 transition-all duration-300 ${analyzingVision ? 'ring-4 ring-purple-500/50 scale-105' : 'border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]'}`}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    
                    {/* Header Overlay: REC & Close */}
                    <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 via-black/20 to-transparent pb-4">
                        {/* Live Indicator */}
                        <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-500/30">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-50 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                             <span className="text-[8px] font-bold text-white tracking-widest">REC</span>
                        </div>

                         {/* Close Button */}
                         <button 
                            onClick={() => setCameraActive(false)}
                            className="p-1.5 bg-black/40 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-all border border-white/20 shadow-sm"
                            aria-label="Turn off Camera"
                         >
                             <CameraOff size={12} />
                         </button>
                    </div>

                    {/* Feedback Overlay */}
                    {visionFeedback ? (
                        <div className={`absolute bottom-0 left-0 right-0 backdrop-blur-md p-2 animate-slide-up border-t border-white/10 ${visionFeedback.includes('警告') ? 'bg-red-900/90' : 'bg-black/80'}`}>
                            <p className={`text-[9px] text-center font-medium leading-tight ${visionFeedback.includes('警告') ? 'text-white font-bold' : 'text-white'}`}>
                                <span className="opacity-70 text-[8px] block mb-0.5">Vision AI:</span>
                                {visionFeedback}
                            </p>
                        </div>
                    ) : analyzingVision && (
                         <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 flex items-center justify-center gap-2 transition-all">
                             <ScanEye size={12} className="text-blue-400 animate-pulse" />
                             <span className="text-[9px] text-white/90 font-medium tracking-wide">
                                {referenceImage ? "Verifying..." : "Checking presence..."}
                             </span>
                         </div>
                    )}
                </div>
           )}
      </div>

      {/* --- STORY CARD (BOTTOM SHEET) --- */}
      <div className="absolute bottom-0 left-0 right-0 z-20 min-h-[35%] bg-white dark:bg-gray-900 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-slide-up flex flex-col">
          
          {/* Card Handle / Content */}
          <div className="flex-1 p-6 pb-28 flex flex-col relative">
              
              {/* Speaker Header */}
              <div className="flex items-center gap-3 mb-4 opacity-80">
                  {displayMessage.role === 'ai' ? (
                      <>
                        <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-[#D31145] text-xs font-bold rounded-full uppercase tracking-wider">
                            {avatarName}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{roleTitle}</span>
                      </>
                  ) : (
                      <>
                        <div className={`px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full uppercase tracking-wider ${isLiveTranscript ? 'animate-pulse bg-red-50 dark:bg-red-900/30 text-red-500' : ''}`}>
                            {isLiveTranscript ? (isEnglish ? 'Listening...' : '聆聽中...') : (isEnglish ? 'You' : '你')}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{isEnglish ? 'Candidate' : '應徵者'}</span>
                      </>
                  )}
              </div>

              {/* Main Text Content */}
              <div className="relative flex-1 overflow-y-auto max-h-[30vh] no-scrollbar">
                  {isProcessing ? (
                      <div className="flex items-center gap-2 text-gray-400 animate-pulse mt-4">
                          <Sparkles size={16} /> {isEnglish ? 'Thinking...' : '思考中...'}
                      </div>
                  ) : (
                      <div className={`text-xl md:text-2xl font-medium leading-relaxed tracking-tight animate-fade-in ${isLiveTranscript ? 'text-gray-500 dark:text-gray-400 italic' : 'text-gray-800 dark:text-gray-100'}`}>
                          {displayMessage.content}
                          {isSpeaking && displayMessage.role === 'ai' && (
                              <span className="inline-block w-2 h-2 rounded-full bg-[#D31145] ml-2 animate-ping"></span>
                          )}
                      </div>
                  )}

                  {/* Hints Overlay (Shown in Chat) */}
                  {showTools && hints && displayMessage.role === 'ai' && !isProcessing && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 animate-slide-up">
                          <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase">
                              <Zap size={12}/> {isEnglish ? 'Suggested Answers' : '建議回答'}
                          </div>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              {hints.map((h, i) => <li key={i}>• {h}</li>)}
                          </ul>
                      </div>
                  )}
              </div>
          </div>

          {/* Privacy Notice Overlay */}
          {showPrivacyNotice && cameraActive && !isEnded && (
            <div className="absolute bottom-[110px] left-4 right-4 z-40 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl flex justify-between items-start gap-3 animate-fade-in shadow-lg border border-white/10">
                <div className="flex gap-2">
                    <Shield size={16} className="text-green-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-relaxed opacity-90">
                        <span className="font-bold text-white">{isEnglish ? 'Privacy Notice:' : '私隱提示:'}</span> {isEnglish ? 'Your camera feed is analyzed for real-time sentiment and identity verification only. Images are processed transiently and not stored after the session.' : '鏡頭畫面僅用於實時情緒分析及身分驗證，圖像會即時處理並不會儲存。'}
                    </p>
                </div>
                <button 
                    onClick={() => setShowPrivacyNotice(false)}
                    className="text-white/50 hover:text-white transition-colors p-1 -mr-1 -mt-1"
                >
                    <X size={14} />
                </button>
            </div>
          )}

          {/* --- INTERACTION DOCK (Fixed Bottom) --- */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-10">
              
              {isEnded ? (
                  <button 
                      onClick={onGenerateReport}
                      className="w-full py-4 bg-[#D31145] text-white rounded-2xl font-bold shadow-lg hover:bg-[#b00e3a] transition-all flex items-center justify-center gap-2"
                  >
                      <PieChart size={20} /> {isEnglish ? 'View Result' : '查看報告'}
                  </button>
              ) : showInput ? (
                  <div className="flex gap-2 items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl animate-slide-up">
                      <input 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isEnglish ? "Type your answer..." : "輸入您的回答..."}
                        className="flex-1 bg-transparent px-2 py-2 text-gray-800 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button onClick={handleSend} className="p-3 bg-[#D31145] text-white rounded-xl">
                          <Send size={18} />
                      </button>
                      <button onClick={() => setShowInput(false)} className="p-3 text-gray-500">
                          <X size={18} />
                      </button>
                  </div>
              ) : (
                  <div className="flex items-center justify-between gap-3">
                      {/* Left: Tools & Camera */}
                      <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                setShowTools(!showTools);
                                if (!hints && !showTools) onGenerateHint();
                            }} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showTools ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <Sparkles size={20} />
                        </button>
                        
                         <button 
                              onClick={() => setCameraActive(!cameraActive)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                           >
                              {cameraActive ? <Camera size={20} /> : <CameraOff size={20} />}
                           </button>
                      </div>

                      {/* Right: Mic & Keyboard */}
                      <div className="flex-1 flex items-center gap-2 pl-2">
                          <button 
                              onClick={onToggleListening}
                              className={`flex-1 h-20 rounded-[2.5rem] flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                                  isListening 
                                  ? 'bg-red-50 dark:bg-red-900/20 text-[#D31145] border-2 border-[#D31145]' 
                                  : 'bg-[#D31145] text-white hover:bg-[#b00e3a]'
                              }`}
                          >
                              {isListening ? (
                                 <div className="flex gap-1 items-center">
                                     <span className="w-1.5 h-6 bg-[#D31145] rounded-full animate-bounce"></span>
                                     <span className="w-1.5 h-8 bg-[#D31145] rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                                     <span className="w-1.5 h-6 bg-[#D31145] rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                                 </div>
                              ) : (
                                 <Mic size={32} />
                              )}
                          </button>

                           <button 
                              onClick={() => setShowInput(true)}
                              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full hover:bg-gray-200 transition-all flex items-center justify-center"
                           >
                              <Keyboard size={20} />
                           </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* --- HISTORY MODAL --- */}
      {showHistory && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in flex items-end sm:items-center justify-center">
              <div className="bg-white dark:bg-gray-900 w-full h-[80%] sm:h-[600px] sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><History size={18}/> {isEnglish ? 'Chat History' : '對話紀錄'}</h3>
                      <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={historyScrollRef}>
                      {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'ai' ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100' : 'bg-[#D31145] text-white'}`}>
                                  <div className="font-bold text-[10px] opacity-70 mb-1 uppercase">{m.role === 'ai' ? avatarName : (isEnglish ? 'You' : '你')}</div>
                                  {m.content}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- AI ASSISTANT PANEL --- */}
      {showAssistant && (
         <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in flex items-end sm:items-center justify-center">
             <div className="bg-white dark:bg-gray-900 w-full h-[85%] sm:h-[650px] sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">
                 
                 {/* Header */}
                 <div className="p-6 pb-2 shrink-0">
                     <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-3">
                             <div className="p-3 bg-[#D31145] text-white rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-900/20">
                                 <Bot size={24} />
                             </div>
                             <div>
                                 <h3 className="text-xl font-extrabold text-gray-800 dark:text-white">{isEnglish ? 'AI Interview Coach' : 'AI 智能教練'}</h3>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{isEnglish ? 'Real-time assistance & analysis' : '實時分析與建議'}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {/* New Language Button inside Assistant Panel */}
                            <button 
                                onClick={onToggleLanguage}
                                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                                title="Switch Language"
                            >
                                <Languages size={16} />
                                <span className="text-[10px] font-bold">{isEnglish ? 'EN' : 'HK'}</span>
                            </button>

                            <button onClick={() => setShowAssistant(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                         </div>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 no-scrollbar">
                     <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                         <Info size={14} className="inline mr-1.5 -mt-0.5 text-blue-500" />
                         {isEnglish ? 'Stuck on a question? I can analyze the interviewer\'s intent or suggest professional answers.' : '不知道如何回答？我可以分析面試官的意圖或提供專業建議。'}
                     </p>

                     {/* Tool 1: Question Intent */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                         <div className="flex items-start gap-3 mb-3">
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                 <Target size={20} />
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-gray-800 dark:text-white text-sm">{isEnglish ? 'Question Intent Analysis' : '問題意圖分析'}</h4>
                                 <p className="text-[10px] text-gray-500 mt-0.5">{isEnglish ? 'Understand what competencies are being tested.' : '了解問題背後的考核重點。'}</p>
                             </div>
                         </div>
                         
                         {/* Content Area */}
                         {loadingIntent ? (
                             <div className="flex items-center gap-2 text-sm text-blue-500 animate-pulse p-2"><Loader2 size={14} className="animate-spin"/> {isEnglish ? 'Analyzing...' : '分析中...'}</div>
                         ) : intent ? (
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-sm text-blue-800 dark:text-blue-100 border border-blue-100 dark:border-blue-900/30 mb-2">
                                 {intent}
                             </div>
                         ) : null}

                         {/* Pro Tip & Action */}
                         <div className="flex justify-between items-center mt-2">
                             <p className="text-[9px] text-gray-400 italic flex-1 pr-2">
                                 <span className="font-bold not-italic">{isEnglish ? 'Pro Tip:' : '提示:'}</span> {isEnglish ? 'Address the hidden concern (e.g., resilience) directly in your answer.' : '在回答中直接回應這些隱藏的考核點。'}
                             </p>
                             <button onClick={onGenerateIntent} disabled={loadingIntent} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                                 {isEnglish ? 'Analyze' : '分析'}
                             </button>
                         </div>
                     </div>

                     {/* Tool 2: Hints */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                         <div className="flex items-start gap-3 mb-3">
                             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                                 <Lightbulb size={20} />
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-gray-800 dark:text-white text-sm">{isEnglish ? 'Suggested Answers' : '回答建議'}</h4>
                                 <p className="text-[10px] text-gray-500 mt-0.5">{isEnglish ? 'Get 3 quick bullet points to frame your response.' : '獲取 3 個關鍵點來構建您的回答。'}</p>
                             </div>
                         </div>

                         {loadingHint ? (
                             <div className="flex items-center gap-2 text-sm text-amber-500 animate-pulse p-2"><Loader2 size={14} className="animate-spin"/> {isEnglish ? 'Generating ideas...' : '生成中...'}</div>
                         ) : hints ? (
                             <ul className="space-y-1.5 mb-2">
                                 {hints.map((h, i) => (
                                     <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2 items-start bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                                         <span className="text-amber-500 font-bold">•</span> {h}
                                     </li>
                                 ))}
                             </ul>
                         ) : null}

                         <div className="flex justify-between items-center mt-2">
                             <p className="text-[9px] text-gray-400 italic flex-1 pr-2">
                                 <span className="font-bold not-italic">{isEnglish ? 'Pro Tip:' : '提示:'}</span> {isEnglish ? 'Use these as a skeleton, but always add your personal story (STAR method).' : '使用這些作為框架，但必須加入您的個人故事 (STAR 法則)。'}
                             </p>
                             <button onClick={onGenerateHint} disabled={loadingHint} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-amber-600 disabled:opacity-50">
                                 {isEnglish ? 'Get Hints' : '獲取建議'}
                             </button>
                         </div>
                     </div>

                     {/* Tool 3: Model Answer */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                         <div className="flex items-start gap-3 mb-3">
                             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                                 <Star size={20} />
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-gray-800 dark:text-white text-sm">{isEnglish ? 'Gold Standard Answer' : '金牌範例回答'}</h4>
                                 <p className="text-[10px] text-gray-500 mt-0.5">{isEnglish ? 'See a 10/10 example response.' : '查看 10/10 分的滿分示範。'}</p>
                             </div>
                         </div>

                         {loadingModelAnswer ? (
                             <div className="flex items-center gap-2 text-sm text-purple-500 animate-pulse p-2"><Loader2 size={14} className="animate-spin"/> {isEnglish ? 'Drafting...' : '撰寫中...'}</div>
                         ) : modelAnswer ? (
                             <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 italic border border-purple-100 dark:border-purple-900/30 mb-2">
                                 "{modelAnswer}"
                             </div>
                         ) : null}

                         <div className="flex justify-between items-center mt-2">
                             <p className="text-[9px] text-gray-400 italic flex-1 pr-2">
                                 <span className="font-bold not-italic">{isEnglish ? 'Pro Tip:' : '提示:'}</span> {isEnglish ? 'Don\'t memorize it. Adapt the confident tone and structure.' : '不要死記硬背，學習其自信的語氣和結構。'}
                             </p>
                             <button onClick={onGenerateModelAnswer} disabled={loadingModelAnswer} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50">
                                 {isEnglish ? 'View Answer' : '查看範例'}
                             </button>
                         </div>
                     </div>

                     {/* Tool 4: Vocabulary */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                         <div className="flex items-start gap-3 mb-3">
                             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                 <GraduationCap size={20} />
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-gray-800 dark:text-white text-sm">{isEnglish ? 'Power Vocabulary' : '關鍵詞彙'}</h4>
                                 <p className="text-[10px] text-gray-500 mt-0.5">{isEnglish ? 'Professional keywords to boost your impression.' : '專業詞彙提升您的形象。'}</p>
                             </div>
                         </div>

                         {loadingVocab ? (
                             <div className="flex items-center gap-2 text-sm text-emerald-500 animate-pulse p-2"><Loader2 size={14} className="animate-spin"/> {isEnglish ? 'Searching...' : '搜尋中...'}</div>
                         ) : vocab ? (
                             <div className="flex flex-wrap gap-2 mb-2">
                                 {vocab.map((v, i) => (
                                     <span key={i} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-md border border-emerald-100 dark:border-emerald-900/40">
                                         {v}
                                     </span>
                                 ))}
                             </div>
                         ) : null}

                         <div className="flex justify-between items-center mt-2">
                             <p className="text-[9px] text-gray-400 italic flex-1 pr-2">
                                 <span className="font-bold not-italic">{isEnglish ? 'Pro Tip:' : '提示:'}</span> {isEnglish ? 'Sprinkle 1-2 of these words naturally into your response.' : '在回答中自然地加入 1-2 個關鍵詞。'}
                             </p>
                             <button onClick={onGenerateVocab} disabled={loadingVocab} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50">
                                 {isEnglish ? 'Get Keywords' : '獲取關鍵詞'}
                             </button>
                         </div>
                     </div>
                     
                     <div className="h-6"></div> {/* Spacer */}
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default ChatInterface;
