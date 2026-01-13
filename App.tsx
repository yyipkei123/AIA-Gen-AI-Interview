
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  InterviewState, 
  Message, 
  ReportData, 
  ScenarioMode, 
  UserSettings,
  Sentiment
} from './types';
import { 
  getFallbackScript, 
  DEFAULT_QUESTION_COUNT,
  MOCK_HINTS,
} from './constants';
import { 
  generateInterviewResponse, 
  generateInterviewReport, 
  generateInterviewHints, 
  generateQuestionIntent, 
  generateModelAnswer,
  generateKeyVocabulary
} from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInterface from './components/ChatInterface';
import ReportView from './components/ReportView';
import SettingsModal from './components/SettingsModal';

// --- Types for Web Speech API ---
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export default function App() {
  // State
  const [interviewState, setInterviewState] = useState<InterviewState>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [scenario, setScenario] = useState<ScenarioMode>('standard');
  
  // Loading States for AI Features
  const [hints, setHints] = useState<string[] | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  
  const [intent, setIntent] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [loadingModelAnswer, setLoadingModelAnswer] = useState(false);
  
  const [vocab, setVocab] = useState<string[] | null>(null);
  const [loadingVocab, setLoadingVocab] = useState(false);
  
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<Sentiment>('neutral');
  
  // Vision Analysis History State
  const [visionHistory, setVisionHistory] = useState<string[]>([]);

  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    userName: "Chris Wong",
    avatarSeed: "Candidate_User",
    // Intelligent Default Logic
    inputLang: 'zh-HK', // Default to Cantonese
    appLanguage: 'zh-HK', // Default to Cantonese personality
    resumeContext: "",
    theme: 'light', // Default to light mode
    questionCount: DEFAULT_QUESTION_COUNT // Default question count
  });

  // Refs
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]); // Ref to track latest messages to avoid stale closures
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // Ref to prevent Chrome GC bug
  const transcriptBufferRef = useRef<string>(''); // Ref to accumulate transcript for manual send

  const hasApiKey = !!process.env.API_KEY;

  // --- Effects ---

  // Sync messages state to ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const { SpeechRecognition, webkitSpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true; 
      recognition.interimResults = true;
      // Use the settings inputLang, but if it doesn't match appLanguage roughly, warn or sync? 
      // For now, keep them independent or sync them in updateSettings.
      recognition.lang = settings.inputLang; 
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
          setIsListening(true);
          transcriptBufferRef.current = ''; 
      };
      
      recognition.onend = () => {
          setIsListening(false);
          const finalParam = transcriptBufferRef.current.trim();
          if (finalParam) {
              handleUserResponse(finalParam);
          }
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        transcriptBufferRef.current = fullTranscript;
        setTranscript(fullTranscript);
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [settings.inputLang]); 

  // Ensure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- Standard Logic Helpers ---

  // Analyze text to determine sentiment for avatar expression
  const determineSentiment = (text: string): Sentiment => {
    const t = text.toLowerCase();
    const positives = ["好", "多謝", "不錯", "唔錯", "ok", "excellent", "good", "great", "歡迎", "感謝", "收到", "agree", "correct", "happy", "glad"];
    const serious = ["點解", "原因", "解釋", "why", "explain", "elaborate", "detail", "reason", "challenge", "difficult", "fail", "？"];
    
    if (positives.some(k => t.includes(k))) return 'positive';
    if (serious.some(k => t.includes(k))) return 'serious';
    return 'neutral';
  };

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    if (synth.speaking || synth.pending) {
        synth.cancel();
    }

    const spokenText = text.replace(/AIA/gi, " A. I. A. ");
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utteranceRef.current = utterance;
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = synth.getVoices();
    let preferredVoice;

    if (settings.appLanguage === 'en-US') {
        // English Voice Priority
        preferredVoice = 
            voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'en-US' && !v.name.includes('Siri')) ||
            voices.find(v => v.lang === 'en-GB'); // Fallback to British
    } else {
        // Cantonese Voice Priority
        preferredVoice = 
            voices.find(v => v.name === "Google 粵語 (香港)" || v.name === "Google Cantonese (Hong Kong)") || 
            voices.find(v => v.lang === 'zh-HK' && v.name.includes('Sin-ji')) ||
            voices.find(v => v.lang === 'zh-HK' && !v.name.includes('Danny') && !v.name.includes('Siri')) ||
            voices.find(v => v.lang === 'zh-HK');
    }
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
    } else {
        // Fallbacks if preferred not found
        utterance.lang = settings.appLanguage === 'en-US' ? 'en-US' : 'zh-HK';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null; 
    };
    utterance.onerror = (e: any) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
            setIsSpeaking(false);
            return;
        }
        setIsSpeaking(false);
        utteranceRef.current = null; 
    };

    if (synth.paused) {
        synth.resume();
    }

    setTimeout(() => {
        try {
          synth.speak(utterance);
        } catch(e) {
          console.error("Speak failed", e);
        }
    }, 50);
  };

  const startInterview = async () => {
    // Standard Mode
    speak(settings.appLanguage === 'en-US' ? "Starting interview..." : "面試準備中..."); 

    setInterviewState('active');
    setMessages([]);
    setReportData(null);
    setHints(null);
    setIntent(null);
    setModelAnswer(null);
    setVocab(null);
    setTurnCount(0);
    setIsEnded(false);
    setLastError(null);
    setVisionHistory([]); 
    setCurrentSentiment('neutral');
    
    // Initial message based on language and scenario
    let startMsg = "";
    if (settings.appLanguage === 'en-US') {
        startMsg = scenario === 'standard' 
            ? "Interview starting. Please introduce yourself in English."
            : "Interview starting. Please lead the discussion in English.";
    } else {
        startMsg = scenario === 'standard' 
            ? "面試開始，請用廣東話同我打招呼。" 
            : "面試開始，請用廣東話主持面試。";
    }
      
    await processAIResponse([], startMsg); 
  };

  const handleUserResponse = useCallback((text: string) => {
    if (isEnded) return; 
    setTranscript('');
    setHints(null);
    setIntent(null);
    setModelAnswer(null);
    setVocab(null);
    
    const currentHistory = messagesRef.current;
    const newHistory: Message[] = [...currentHistory, { role: 'user', content: text, timestamp: Date.now() }];
    
    setMessages(newHistory);
    processAIResponse(newHistory, text);
  }, [isEnded, scenario, settings.resumeContext, settings.questionCount, settings.appLanguage]);

  const handleEditLastMessage = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsProcessing(false);

    setMessages(prev => {
       const newHistory = [...prev];
       if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'ai') {
           newHistory.pop();
       }
       if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'user') {
           newHistory.pop();
       }
       return newHistory;
    });
    
    if (isEnded) setIsEnded(false);
  };

  const handleVisionAnalysisResult = (result: string) => {
      setVisionHistory(prev => [...prev, result]);
  };

  const processAIResponse = async (history: Message[], latestInput: string) => {
    setIsProcessing(true);
    setLastError(null);
    
    const userMsgCount = history.filter(m => m.role === 'user').length;
    const currentTurn = history.length === 0 ? 0 : userMsgCount;
    const maxTurns = settings.questionCount;
    const fallbackScript = getFallbackScript(settings.appLanguage);
    
    setTurnCount(currentTurn);

    const triggerFallback = () => {
        let nextMsg = "";
        // Use maxTurns in fallback logic too, although fallback script length is fixed
        if (currentTurn >= maxTurns || currentTurn >= fallbackScript.length - 1) {
            nextMsg = fallbackScript[fallbackScript.length - 1]; 
            setIsEnded(true);
        } else {
            nextMsg = fallbackScript[Math.min(currentTurn, fallbackScript.length - 2)];
        }
        setMessages(prev => [...prev, { role: 'ai', content: nextMsg, timestamp: Date.now() }]);
        setCurrentSentiment(determineSentiment(nextMsg));
        speak(nextMsg);
    };

    if (!hasApiKey) {
        setLastError("Script Mode");
        setTimeout(() => { 
          triggerFallback(); 
          setIsProcessing(false); 
        }, 1000);
        return;
    }

    try {
      if (currentTurn >= maxTurns) {
          setIsEnded(true);
      }

      const responseText = await generateInterviewResponse(
        history, 
        latestInput, 
        currentTurn, 
        scenario,
        settings.resumeContext,
        settings.questionCount, // Pass configured count
        settings.appLanguage // Pass language
      );
      
      setMessages(prev => [...prev, { role: 'ai', content: responseText, timestamp: Date.now() }]);
      setCurrentSentiment(determineSentiment(responseText));
      speak(responseText);
    } catch (err: any) {
      console.error(err);
      let errorType = "Connection Error";
      const errMsg = err.message || JSON.stringify(err);

      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          errorType = "Quota Limit (Using Script)";
      } else if (errMsg.includes("403") || errMsg.includes("key")) {
          errorType = "Key Invalid";
      } else if (errMsg.includes("location") || errMsg.includes("region")) {
          errorType = "Region Not Supported";
      }
      
      setLastError(errorType);
      setTimeout(() => { triggerFallback(); }, 1000);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleForceEnd = () => {
    setIsEnded(true);
    if (isListening) {
        recognitionRef.current?.stop();
    }
    const endMsg = settings.appLanguage === 'en-US' 
        ? "[System] Interview ended by user. Check report."
        : "[系統] 面試已由用戶結束。請點擊「報告」查看評估。";
    const speakMsg = settings.appLanguage === 'en-US'
        ? "Okay, ending the interview. You can view the report now."
        : "好嘅，面試到此為止。你可以睇下面試報告。";

    setMessages(prev => [...prev, { role: 'ai', content: endMsg, timestamp: Date.now() }]);
    speak(speakMsg);
  };

  // --- AI Assistance Handlers with Loading State Management ---
  const langLabel = settings.appLanguage === 'en-US' ? 'English' : 'Cantonese';

  const handleGenerateHint = async () => {
    if (messages.length === 0 || loadingHint || isEnded) return;
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    if (!lastAiMsg) return;
    
    setLoadingHint(true);
    setLastError(null);

    try {
        if (!hasApiKey) throw new Error("No API Key");
        const bullets = await generateInterviewHints(lastAiMsg.content, langLabel);
        setHints(bullets.length > 0 ? bullets : MOCK_HINTS);
    } catch (e: any) { 
        console.warn("Using mock hints due to error", e);
        setHints(MOCK_HINTS); 
    } finally { 
        setLoadingHint(false); 
    }
  };

  const handleGenerateIntent = async () => {
    if (messages.length === 0 || loadingIntent || isEnded) return;
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    if (!lastAiMsg) return;

    setLoadingIntent(true);
    setIntent(null);
    setLastError(null);

    try {
        if (!hasApiKey) throw new Error("No API Key");
        const insight = await generateQuestionIntent(lastAiMsg.content, langLabel);
        setIntent(insight);
    } catch (e: any) {
         console.warn("Using mock intent", e);
         setIntent("Analysis unavailable.");
    } finally {
        setLoadingIntent(false);
    }
  };

  const handleGenerateModelAnswer = async () => {
    if (messages.length === 0 || loadingModelAnswer || isEnded) return;
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    if (!lastAiMsg) return;

    setLoadingModelAnswer(true);
    setModelAnswer(null);
    setLastError(null);

    try {
        if (!hasApiKey) throw new Error("No API Key");
        const answer = await generateModelAnswer(lastAiMsg.content, langLabel);
        setModelAnswer(answer);
    } catch (e: any) {
         console.warn("Using mock model answer", e);
         setModelAnswer("Model answer unavailable.");
    } finally {
        setLoadingModelAnswer(false);
    }
  };

  const handleGenerateVocab = async () => {
    if (messages.length === 0 || loadingVocab || isEnded) return;
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    if (!lastAiMsg) return;

    setLoadingVocab(true);
    setVocab(null);
    setLastError(null);

    try {
        if (!hasApiKey) throw new Error("No API Key");
        const words = await generateKeyVocabulary(lastAiMsg.content, langLabel);
        setVocab(words.length > 0 ? words : ["Professionalism", "Integrity"]);
    } catch (e: any) {
         console.warn("Using mock vocab", e);
         setVocab(["MDRT", "Risk Management"]);
    } finally {
        setLoadingVocab(false);
    }
  };

  const generateReport = async () => {
    setInterviewState('summarizing');
    window.speechSynthesis.cancel();
    setLastError(null);
    
    try {
      if (!hasApiKey) throw new Error("No Key for Summary");
      // Pass visionHistory to the report generation logic
      const report = await generateInterviewReport(
        messages, 
        visionHistory,
        settings.appLanguage // Pass language setting for report localization
      );
      setReportData(report);
    } catch (e: any) { 
      console.warn("Using mock report due to error", e);
      // Fallback mock report
      setReportData({
        overall_score: 65,
        hiring_recommendation: "Conditional",
        metrics: {
          communication: 6,
          sales_potential: 6,
          resilience: 7,
          professionalism: 8,
          ambition: 7,
          client_focus: 6
        },
        key_strengths: ["Positive Attitude", "Structured Communication"],
        areas_for_improvement: ["Needs more specific examples"],
        detailed_analysis: "Simulation report generated due to error. Candidate showed good potential but needs more specific examples.",
        vision_analysis_summary: "(No visual analysis data)",
        next_steps: "Suggest 2nd interview"
      });
    } 
    setInterviewState('finished');
  };

  const toggleListening = () => {
    if (isEnded) return; 

    if (isListening) {
      recognitionRef.current?.stop();
    } else { 
      if (isSpeaking) window.speechSynthesis.cancel(); 
      try {
        recognitionRef.current?.start(); 
      } catch(e) {
        console.error("Mic start failed", e);
      }
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- RETURN ---
  return (
    <div className={`fixed inset-0 w-full h-full flex items-center justify-center font-sans overflow-hidden ${settings.theme === 'dark' ? 'dark' : ''}`}>
        
        {/* --- DESKTOP BACKGROUND --- */}
        <div className="absolute inset-0 z-0 bg-[#0f1115]">
            {/* Subtle Gradient Base */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1d24] via-[#0f1115] to-[#2a1b1b] opacity-80"></div>
            
            {/* Animated Glow Spots */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#D31145] rounded-full blur-[150px] opacity-[0.08] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-900 rounded-full blur-[150px] opacity-[0.1] animate-pulse-slow" style={{animationDelay: '3s'}}></div>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0" style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
                backgroundSize: '60px 60px' 
            }}></div>
        </div>

        {/* Mobile Frame Container */}
        <div className={`mobile-frame w-full h-full md:h-[90vh] max-w-[420px] bg-white dark:bg-gray-950 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10 md:rounded-[40px] md:border-[8px] md:border-gray-800 transition-all duration-300 ${settings.theme === 'dark' ? 'dark' : ''}`}>
            
            {interviewState === 'welcome' && (
              <WelcomeScreen 
                scenario={scenario} 
                onScenarioChange={setScenario}
                onStart={startInterview}
                onOpenSettings={() => setShowSettings(true)}
                hasApiKey={hasApiKey}
                language={settings.appLanguage}
                onToggleLanguage={() => updateSettings({ 
                    appLanguage: settings.appLanguage === 'zh-HK' ? 'en-US' : 'zh-HK',
                    inputLang: settings.appLanguage === 'zh-HK' ? 'en-US' : 'zh-HK' // Auto switch input lang too
                })}
              />
            )}

            {interviewState === 'active' && (
              <ChatInterface 
                messages={messages}
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                transcript={transcript}
                scenario={scenario}
                currentSentiment={currentSentiment}
                turnCount={turnCount}
                isEnded={isEnded}
                lastError={lastError}
                
                // Hints
                hints={hints}
                loadingHint={loadingHint}
                onGenerateHint={handleGenerateHint}
                
                // Intent
                intent={intent}
                loadingIntent={loadingIntent}
                onGenerateIntent={handleGenerateIntent}
                
                // Model Answer
                modelAnswer={modelAnswer}
                loadingModelAnswer={loadingModelAnswer}
                onGenerateModelAnswer={handleGenerateModelAnswer}
                
                // Vocab
                vocab={vocab}
                loadingVocab={loadingVocab}
                onGenerateVocab={handleGenerateVocab}
                
                settings={settings}
                onToggleListening={toggleListening}
                onGenerateReport={generateReport}
                onForceEnd={handleForceEnd}
                onOpenSettings={() => setShowSettings(true)}
                onUserResponse={handleUserResponse}
                onEditLastMessage={handleEditLastMessage}
                onVisionAnalysisResult={handleVisionAnalysisResult} 
                onToggleLanguage={() => updateSettings({ 
                  appLanguage: settings.appLanguage === 'zh-HK' ? 'en-US' : 'zh-HK',
                  inputLang: settings.appLanguage === 'zh-HK' ? 'en-US' : 'zh-HK'
                })}
              />
            )}

            {interviewState === 'summarizing' && (
               <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-[#D31145] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">
                          {settings.appLanguage === 'en-US' ? 'Generating Report...' : '報告生成中...'}
                      </span>
                  </div>
               </div>
            )}

            {interviewState === 'finished' && reportData && (
              <ReportView 
                data={reportData} 
                onRestart={() => setInterviewState('welcome')} 
                language={settings.appLanguage} // Pass language prop
              />
            )}
            
        </div>

        {/* Global Settings Modal */}
        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            settings={settings}
            onUpdateSettings={updateSettings}
            onTestAudio={(text) => speak(text)}
        />
    </div>
  );
}
