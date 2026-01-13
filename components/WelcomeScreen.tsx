
import React from 'react';
import { Mic, Settings, Briefcase, TrendingUp, Sparkles, Languages } from 'lucide-react';
import TalkingAvatar from './TalkingAvatar';
import { ScenarioMode } from '../types';

interface WelcomeScreenProps {
  scenario: ScenarioMode;
  onScenarioChange: (mode: ScenarioMode) => void;
  onStart: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  language: 'zh-HK' | 'en-US';
  onToggleLanguage: () => void;
}

const AIA_LOGO = "https://www.aia.com/content/dam/group-wise/images/system/icons/aia-logo-red.svg";
const APP_VERSION = "v.0.0.1";
const BUILD_TIMESTAMP = "2025-11-28 10:00";

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  scenario,
  onScenarioChange,
  onStart,
  onOpenSettings,
  hasApiKey,
  language,
  onToggleLanguage
}) => {
  const isEnglish = language === 'en-US';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-white dark:bg-gray-950 text-center h-full w-full font-sans overflow-hidden">
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] bg-red-100/50 dark:bg-red-900/10 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
       </div>

       {/* Branding - Top Left */}
       <div 
         className="absolute left-6 z-50 transition-all duration-500 hover:opacity-80 hover:scale-105"
         style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
       >
           <img src={AIA_LOGO} alt="AIA" className="h-20 w-auto object-contain drop-shadow-sm" />
       </div>

       {/* Top Right Buttons Container */}
       <div 
         className="absolute right-6 z-50 flex items-center gap-2"
         style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
       >
           {/* Language Toggle */}
           <button 
                onClick={onToggleLanguage}
                className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full shadow-sm border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-800 hover:text-[#D31145] transition-all flex items-center gap-1.5"
                title="Switch Language"
           >
                <Languages size={18} />
                <span className="text-xs font-bold">{isEnglish ? 'EN' : 'HK'}</span>
           </button>

           {/* Settings Button */}
           <button 
                onClick={onOpenSettings}
                className="p-3 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md hover:bg-red-50 dark:hover:bg-gray-800 hover:text-[#D31145] rounded-full transition-all duration-300 shadow-sm border border-gray-100 dark:border-gray-800"
                aria-label="Settings"
           >
               <Settings size={24} />
           </button>
       </div>

       {/* Main Content */}
       <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
           
           {/* Avatar Section with Glow */}
           <div className="relative mb-8 mt-12 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-200 to-purple-200 rounded-full blur-[40px] opacity-40 animate-pulse-slow"></div>
                <TalkingAvatar isSpeaking={false} mode={scenario} size='large' />
           </div>
           
           <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2 tracking-tight">
                    {isEnglish ? 'AIA Smart Coach' : 'AIA 智能面試官'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium flex items-center justify-center gap-1">
                    <Sparkles size={12} className="text-[#D31145]" /> Empowering your potential
                </p>
           </div>
            
            {/* Scenario Cards */}
            <div className="flex flex-col gap-3 mb-8 w-full animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onScenarioChange('standard')} 
                        className={`
                            relative overflow-hidden flex flex-col items-center p-4 rounded-3xl border transition-all duration-300 text-center gap-2 group
                            ${scenario === 'standard' 
                                ? 'bg-white/80 dark:bg-gray-800/80 border-[#D31145] shadow-[0_10px_30px_rgba(211,17,69,0.15)] scale-105 z-10' 
                                : 'bg-white/40 dark:bg-gray-900/40 border-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 hover:scale-105 opacity-80'}
                            backdrop-blur-md
                        `}
                    >
                        <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${scenario === 'standard' ? 'bg-red-50 dark:bg-red-900/30 text-[#D31145]' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-[#D31145]'}`}>
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <div className={`text-sm font-bold transition-colors ${scenario === 'standard' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                {isEnglish ? 'Standard' : '標準面試'}
                            </div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">General Agent</div>
                        </div>
                        {scenario === 'standard' && <div className="absolute inset-0 border-2 border-[#D31145] rounded-3xl opacity-10"></div>}
                    </button>

                    <button 
                        onClick={() => onScenarioChange('objection')} 
                        className={`
                            relative overflow-hidden flex flex-col items-center p-4 rounded-3xl border transition-all duration-300 text-center gap-2 group
                            ${scenario === 'objection' 
                                ? 'bg-white/80 dark:bg-gray-800/80 border-[#D31145] shadow-[0_10px_30px_rgba(211,17,69,0.15)] scale-105 z-10' 
                                : 'bg-white/40 dark:bg-gray-900/40 border-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 hover:scale-105 opacity-80'}
                            backdrop-blur-md
                        `}
                    >
                        <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${scenario === 'objection' ? 'bg-red-50 dark:bg-red-900/30 text-[#D31145]' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-[#D31145]'}`}>
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <div className={`text-sm font-bold transition-colors ${scenario === 'objection' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                {isEnglish ? 'Advanced' : '進階面試'}
                            </div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">Senior / MDRT</div>
                        </div>
                        {scenario === 'objection' && <div className="absolute inset-0 border-2 border-[#D31145] rounded-3xl opacity-10"></div>}
                    </button>
                </div>
            </div>

            <button 
                onClick={onStart} 
                className="w-full py-4 text-white font-bold rounded-2xl bg-gradient-to-r from-[#D31145] to-[#FF4D6D] hover:from-[#b00e3a] hover:to-[#e11d48] shadow-[0_10px_30px_rgba(211,17,69,0.4)] transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base animate-slide-up"
                style={{animationDelay: '0.3s'}}
            >
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm"><Mic size={18} /></div>
                {isEnglish ? 'Start Interview' : '開始面試 (Start)'}
            </button>
            
            <div className="mt-8 flex items-center justify-center gap-2 animate-fade-in" style={{animationDelay: '0.5s'}}>
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${hasApiKey ? 'bg-green-500 text-green-500' : 'bg-red-400 text-red-400'}`}></div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                    {hasApiKey ? "SYSTEM ONLINE" : "SCRIPT MODE"}
                </span>
            </div>
       </div>

       {/* Footer Disclaimer & Version */}
       <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none flex flex-col gap-1 opacity-60">
           <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium tracking-wide">
               Demo purpose only. Created by Deloitte.
           </p>
           <p className="text-[9px] text-gray-300 dark:text-gray-700 font-mono tracking-tight">
               {APP_VERSION} • {BUILD_TIMESTAMP}
           </p>
       </div>
    </div>
  );
};

export default WelcomeScreen;
