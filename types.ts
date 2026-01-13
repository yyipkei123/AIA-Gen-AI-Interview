
export type Role = 'user' | 'ai';

export interface Message {
  role: Role;
  content: string;
  timestamp?: number;
}

export type InterviewState = 'welcome' | 'active' | 'summarizing' | 'finished';

export type ScenarioMode = 'standard' | 'objection';

export type Sentiment = 'neutral' | 'positive' | 'serious';

export interface Metrics {
  communication: number;      // 溝通表達
  sales_potential: number;    // 銷售潛力
  resilience: number;         // 抗壓應變
  professionalism: number;    // 專業形象
  ambition: number;           // 目標主動
  client_focus: number;       // 客戶導向
}

export interface ReportData {
  overall_score: number;
  hiring_recommendation: string;
  metrics: Metrics;
  key_strengths: string[];
  areas_for_improvement: string[];
  detailed_analysis: string; // Renamed from summary_comment for broader scope
  vision_analysis_summary?: string; // New field for Vision Analysis result
  next_steps: string;        // Specific next action
}

export interface UserSettings {
  userName: string;
  avatarSeed: string;
  inputLang: string;
  appLanguage: 'zh-HK' | 'en-US'; // Added: Controls AI personality language
  resumeContext: string; // New field for Background/Resume
  theme: 'light' | 'dark'; // New field for Dark Mode
  questionCount: number; // Added: Configurable number of questions
}
