
import React from 'react';
import { User, Settings, X, Languages, RefreshCcw, Globe, Volume2, FileText, Sun, Moon, ListOrdered, Check } from 'lucide-react';
import { getUserAvatarUrl } from '../constants';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onTestAudio: (text: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  onTestAudio
}) => {
  if (!isOpen) return null;

  const presets = [
    { label: 'Cantonese (iOS)', value: 'zh-HK' },
    { label: 'Cantonese (Alt)', value: 'yue-Hant-HK' },
    { label: 'Mandarin', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
  ];

  const avatarPresets = [
    "Candidate_User", // Default
    "Alex",
    "Sarah", 
    "James",
    "Emily",
    "Michael",
    "Linda",
    "David"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-5">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[85vh] overflow-y-auto animate-fade-in no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings className="text-[#D31145]" size={24} /> 
            <span>Profile & Settings</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} className="text-gray-500 dark:text-gray-400"/>
          </button>
        </div>
        
        <div className="flex flex-col gap-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
              </label>
              <button 
                  onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1 w-12 flex items-center transition-all shadow-sm"
              >
                  <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings.theme === 'dark' ? 'translate-x-5 bg-gray-800' : 'translate-x-0 bg-yellow-400'}`}></div>
              </button>
          </div>

          {/* Profile Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User size={18} /> Candidate Profile
              </label>
              
              <div className="flex items-center gap-4 mb-4">
                  <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden bg-white flex items-center justify-center shadow-sm">
                          <img 
                            src={getUserAvatarUrl(settings.avatarSeed)} 
                            alt="User" 
                            className="w-full h-full object-cover bg-white"
                            onError={(e) => { 
                                (e.target as HTMLImageElement).style.display='none'; 
                                (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden'); 
                            }}
                          />
                          <User size={32} className="text-gray-300 hidden" />
                      </div>
                      <button 
                        onClick={() => onUpdateSettings({ avatarSeed: `Candidate_${Math.floor(Math.random() * 10000)}` })}
                        className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 p-1.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title="Randomize Avatar"
                      >
                          <RefreshCcw size={12} className="text-gray-600 dark:text-gray-300"/>
                      </button>
                  </div>
                  <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Display Name</label>
                      <input 
                          type="text" 
                          value={settings.userName}
                          onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#D31145]/20 focus:border-[#D31145] text-gray-900 dark:text-white"
                      />
                  </div>
              </div>

              {/* Avatar Presets */}
              <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Choose Avatar</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      <button 
                          onClick={() => onUpdateSettings({ avatarSeed: `Candidate_${Math.floor(Math.random() * 10000)}` })}
                          className="w-10 h-10 shrink-0 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group relative"
                          title="Random"
                      >
                          <RefreshCcw size={14} className="text-gray-400 group-hover:text-[#D31145] transition-colors"/>
                      </button>
                      
                      {avatarPresets.map((seed) => (
                          <button
                              key={seed}
                              onClick={() => onUpdateSettings({ avatarSeed: seed })}
                              className={`w-10 h-10 shrink-0 rounded-full overflow-hidden border-2 transition-all relative ${
                                  settings.avatarSeed === seed 
                                  ? 'border-[#D31145] ring-2 ring-[#D31145]/20 scale-105' 
                                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                          >
                              <img src={getUserAvatarUrl(seed)} alt={seed} className="w-full h-full object-cover" />
                              {settings.avatarSeed === seed && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <Check size={14} className="text-white drop-shadow-md" />
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          <hr className="border-t border-gray-100 dark:border-gray-700" />
          
           {/* Question Count */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <ListOrdered size={18} /> Interview Length
                  </label>
                  <span className="text-xs font-bold text-[#D31145] bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                      {settings.questionCount} Questions
                  </span>
              </div>
              <input 
                  type="range" 
                  min="3" 
                  max="10" 
                  step="1"
                  value={settings.questionCount}
                  onChange={(e) => onUpdateSettings({ questionCount: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D31145]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Short (3)</span>
                  <span>Long (10)</span>
              </div>
          </div>

          <hr className="border-t border-gray-100 dark:border-gray-700" />
          
          {/* Resume Context Section */}
          <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
             <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-[#D31145]" /> 
                <span>Background Info (Optional)</span>
             </label>
             <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 leading-tight">
                 Paste your resume summary or past experience here. The AI will personalize questions based on this.
             </p>
             <textarea 
                value={settings.resumeContext || ''}
                onChange={(e) => onUpdateSettings({ resumeContext: e.target.value })}
                placeholder="e.g. 5 years experience in luxury retail, good at building client relationships..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#D31145]/20 focus:border-[#D31145] h-20 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
             />
          </div>

          <hr className="border-t border-gray-100 dark:border-gray-700" />

          {/* Input Language Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Languages size={18} /> 語音輸入語言 (Input)
                </label>
                <button 
                    onClick={() => onTestAudio("你好，我係 Cindy。Testing 1, 2, 3.")}
                    className="text-[10px] font-bold text-[#D31145] bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    <Volume2 size={12} /> Test Audio
                </button>
            </div>
            
            <div className="relative">
                <input 
                    type="text"
                    value={settings.inputLang}
                    onChange={(e) => onUpdateSettings({ inputLang: e.target.value })}
                    className="w-full p-4 pr-10 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#D31145]/20 bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium placeholder-gray-400"
                    placeholder="e.g. zh-HK"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                     <Globe size={16} className="text-gray-400"/>
                </div>
            </div>

            {/* Quick Select Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
                {presets.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onUpdateSettings({ inputLang: opt.value })}
                        className={`text-[10px] px-3 py-1.5 rounded-full border transition-all font-medium ${
                            settings.inputLang === opt.value 
                            ? 'bg-[#D31145] text-white border-[#D31145] shadow-sm' 
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <p className="text-[11px] text-gray-400 mt-2 ml-1">
                * Recommended: 'zh-HK' for iPhone.
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full text-white font-bold py-4 rounded-2xl bg-gradient-to-br from-[#D31145] to-[#FF4D6D] shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all"
          >
            儲存設定 (Save)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
