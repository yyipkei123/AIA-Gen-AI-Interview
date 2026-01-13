
import React from 'react';
import { 
  Brain, 
  ArrowRightCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Star, 
  Sparkles,
  MessageSquare,
  TrendingUp,
  Shield,
  Briefcase,
  Target,
  Users,
  Camera,
  Activity
} from 'lucide-react';
import { ReportData } from '../types';

interface ReportViewProps {
  data: ReportData;
  onRestart: () => void;
  language: 'zh-HK' | 'en-US';
}

const ReportView: React.FC<ReportViewProps> = ({ data, onRestart, language }) => {
  const isEnglish = language === 'en-US';

  const LABELS = {
    'zh-HK': {
      communication: "溝通表達",
      sales_potential: "銷售潛力",
      resilience: "抗壓應變",
      professionalism: "專業形象",
      ambition: "目標主動",
      client_focus: "客戶導向",
      interview_assessment: "面試評估報告",
      overall: "總分",
      recommended: "建議聘用",
      conditional: "有條件聘用",
      not_recommended: "不予聘用",
      competency_radar: "能力雷達圖",
      detailed_analysis: "綜合表現分析",
      visual_analysis: "視覺表現分析",
      detail_breakdown: "詳細評分",
      next_step: "下一步建議",
      reference_guide: "評分參考",
      done: "完成"
    },
    'en-US': {
      communication: "Communication",
      sales_potential: "Sales Potential",
      resilience: "Resilience",
      professionalism: "Professionalism",
      ambition: "Ambition",
      client_focus: "Client Focus",
      interview_assessment: "Interview Assessment",
      overall: "Overall",
      recommended: "Recommended",
      conditional: "Conditional",
      not_recommended: "Not Recommended",
      competency_radar: "Competency Radar",
      detailed_analysis: "Performance Analysis",
      visual_analysis: "Visual Presence Analysis",
      detail_breakdown: "Detail Breakdown",
      next_step: "Next Step",
      reference_guide: "Reference Guide",
      done: "Done"
    }
  };

  const currentLabels = LABELS[language];

  // Dynamic config with localized labels
  const METRIC_CONFIG: Record<string, { label: string, icon: React.ElementType }> = {
    communication: { label: currentLabels.communication, icon: MessageSquare },
    sales_potential: { label: currentLabels.sales_potential, icon: TrendingUp },
    resilience: { label: currentLabels.resilience, icon: Shield },
    professionalism: { label: currentLabels.professionalism, icon: Briefcase },
    ambition: { label: currentLabels.ambition, icon: Target },
    client_focus: { label: currentLabels.client_focus, icon: Users }
  };

  // Determine styles based on hiring recommendation
  const getRecommendationStyle = (rec: string) => {
    const r = rec.toLowerCase();
    const isStrong = r.includes('strong') || r === 'hire';
    const isConditional = r.includes('conditional');

    if (isStrong) {
        return {
            heroGradient: 'from-green-500 to-emerald-600',
            bg: 'bg-white/20',
            text: 'text-white',
            border: 'border-white/30',
            icon: <CheckCircle size={18} className="text-white" />,
            label: currentLabels.recommended
        };
    }
    if (isConditional) {
        return {
            heroGradient: 'from-amber-400 to-orange-500',
            bg: 'bg-white/20',
            text: 'text-white',
            border: 'border-white/30',
            icon: <AlertTriangle size={18} className="text-white" />,
            label: currentLabels.conditional
        };
    }
    // Reject or default
    return {
        heroGradient: 'from-red-600 to-[#D31145]',
        bg: 'bg-white/20',
        text: 'text-white',
        border: 'border-white/30',
        icon: <XCircle size={18} className="text-white" />,
        label: currentLabels.not_recommended
    };
  };

  const recStyle = getRecommendationStyle(data.hiring_recommendation);
  
  // -- Radar Chart Subcomponent --
  const RadarChart = ({ metrics }: { metrics: any }) => {
    const size = 340; 
    const center = size / 2;
    const radius = 95; 
    const keys = Object.keys(METRIC_CONFIG);
    const totalAxes = keys.length;
    
    const getPoint = (value: number, index: number, maxVal: number = 10) => {
      const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
      const r = (value / maxVal) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        angle
      };
    };

    const points = keys.map((k, i) => {
      const val = metrics[k];
      const { x, y } = getPoint(val, i);
      return `${x},${y}`;
    }).join(' ');

    const levels = [2, 4, 6, 8, 10];
    
    return (
      <div className="flex justify-center items-center py-4 relative">
        <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size}`} className="max-w-[360px] overflow-visible font-sans">
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D31145" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#D31145" stopOpacity="0.1"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Circular Grid Background */}
          {levels.map((level, idx) => (
             <React.Fragment key={level}>
                <polygon 
                  points={keys.map((_, i) => {
                      const { x, y } = getPoint(level, i);
                      return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={level === 10 ? "none" : "currentColor"}
                  strokeOpacity={level === 10 ? 0 : 0.05}
                  strokeWidth="1"
                  className="text-gray-400 dark:text-gray-600"
                />
                {level === 10 && (
                  <circle 
                      cx={center} 
                      cy={center} 
                      r={radius} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeOpacity={0.1}
                      className="text-gray-300 dark:text-gray-600"
                      strokeDasharray="4 4"
                  />
                )}
             </React.Fragment>
          ))}

          {/* Axes Lines */}
          {keys.map((_, i) => {
             const { x, y } = getPoint(10, i);
             return (
               <line 
                 key={i} 
                 x1={center} 
                 y1={center} 
                 x2={x} 
                 y2={y} 
                 stroke="currentColor" 
                 strokeOpacity={0.08}
                 strokeWidth="1" 
                 className="text-gray-400 dark:text-gray-500"
               />
             );
          })}

          {/* Data Area */}
          <polygon 
             points={points}
             fill="url(#radarGradient)"
             stroke="#D31145" 
             strokeWidth="2.5"
             filter="url(#glow)"
             className="drop-shadow-lg transition-all duration-1000 ease-out opacity-90"
          />
          
          {/* Data Vertices */}
          {keys.map((k, i) => {
               const val = metrics[k];
               const { x, y } = getPoint(val, i);
               return (
                 <g key={i} className="animate-fade-in" style={{animationDelay: `${i * 100}ms`}}>
                     <circle cx={x} cy={y} r="3" fill="#fff" className="stroke-[#D31145] stroke-[2px]" />
                     <circle cx={x} cy={y} r="6" fill="transparent" className="stroke-[#D31145] stroke-[1px] opacity-30 animate-pulse" />
                 </g>
               )
          })}

          {/* Labels & Scores */}
          {keys.map((k, i) => {
             const { x, y, angle } = getPoint(10, i); 
             const val = metrics[k];
             const label = METRIC_CONFIG[k].label;
             
             const deg = (angle * 180) / Math.PI;
             const normDeg = (deg + 360) % 360;

             let textAnchor: React.SVGProps<SVGTextElement>['textAnchor'] = "middle";
             let xOff = 0;
             let yOff = 0;

             if (Math.abs(normDeg - 270) < 5) { // Top
                 textAnchor = "middle";
                 yOff = -20;
             } else if (Math.abs(normDeg - 90) < 5) { // Bottom
                 textAnchor = "middle";
                 yOff = 25;
             } else if (normDeg > 90 && normDeg < 270) { // Left
                 textAnchor = "end";
                 xOff = -15;
                 yOff = 5;
             } else { // Right
                 textAnchor = "start";
                 xOff = 15;
                 yOff = 5;
             }

             return (
               <g key={i} transform={`translate(${x + xOff}, ${y + yOff})`}>
                   <text 
                     textAnchor={textAnchor} 
                     className="text-[11px] font-bold fill-gray-600 dark:fill-gray-300"
                     style={{ fontSize: '11px', fontWeight: 700 }}
                   >
                     {label}
                   </text>
                   <text 
                     y="14"
                     textAnchor={textAnchor} 
                     className={`text-[10px] font-mono font-medium ${val >= 8 ? 'fill-green-500' : val >= 5 ? 'fill-amber-500' : 'fill-red-500'}`}
                   >
                     {val.toFixed(1)} / 10
                   </text>
               </g>
             );
          })}
        </svg>
      </div>
    )
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative font-sans">
        {/* Top Spacer for safe area */}
        <div className="h-[env(safe-area-inset-top)] bg-white dark:bg-gray-900 shrink-0"></div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 dark:bg-gray-950 pb-10">
            
            {/* 1. Hero Score Card */}
            <div className="bg-white dark:bg-gray-900 pb-8 rounded-b-[2.5rem] shadow-sm relative overflow-hidden shrink-0">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${recStyle.heroGradient} opacity-95 transition-all duration-500`}></div>
                
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute top-20 -left-10 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>

                <div className="relative z-10 p-6 pt-2 flex flex-col items-center text-white animate-fade-in">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] opacity-80 mb-6">{currentLabels.interview_assessment}</h2>
                    
                    <div className="relative mb-6 shrink-0">
                        <svg className="w-40 h-40 transform -rotate-90 shrink-0" viewBox="0 0 160 160">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-white/20"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * data.overall_score) / 100}
                                className="text-white transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black tracking-tighter">{data.overall_score}</span>
                            <span className="text-xs font-medium opacity-80 uppercase mt-1">{currentLabels.overall}</span>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md border shadow-lg ${recStyle.bg} ${recStyle.border} ${recStyle.text}`}>
                        {recStyle.icon}
                        <span className="font-bold tracking-wide">{recStyle.label}</span>
                    </div>
                </div>
            </div>
            
            <div className="px-5 py-6 flex flex-col gap-6 -mt-4 relative z-20">
                
                {/* 2. Radar Chart Visualization (AI Enhanced) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-[#D31145]/5 rounded-bl-full rounded-tr-3xl"></div>
                    <div className="flex items-center justify-between mb-2 relative z-10">
                         <div className="flex items-center gap-2">
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                <Activity size={20} className="text-blue-500"/>
                             </div>
                             <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                {currentLabels.competency_radar}
                             </h3>
                         </div>
                         <div className="text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md">
                            AI-ANALYSIS
                         </div>
                    </div>
                    <RadarChart metrics={data.metrics} />
                </div>

                {/* 3. Detailed Analysis */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <Brain size={20} className="text-[#D31145]"/> 
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                            {currentLabels.detailed_analysis}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify whitespace-pre-wrap font-medium pl-1 border-l-4 border-gray-100 dark:border-gray-700">
                        {data.detailed_analysis}
                    </p>
                </div>

                {/* 4. Metrics Grid (Detailed Breakdown) */}
                <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">{currentLabels.detail_breakdown}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(data.metrics).map(([k, value]) => {
                            const v = value as number;
                            const config = METRIC_CONFIG[k] || { label: k, icon: Star };
                            const Icon = config.icon;
                            
                            // Color logic
                            const colorClass = v >= 8 ? 'text-green-500' : v >= 5 ? 'text-amber-500' : 'text-red-500';
                            const barColor = v >= 8 ? 'bg-green-500' : v >= 5 ? 'bg-amber-500' : 'bg-red-500';
                            
                            return (
                                <div key={k} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 group-hover:text-[#D31145] group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={`text-xl font-bold ${colorClass}`}>{v}</span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{config.label}</div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{width: `${v * 10}%`}}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Visual Analysis (Conditional) */}
                {data.vision_analysis_summary && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 animate-slide-up" style={{animationDelay: '0.3s'}}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                                <Camera size={20} className="text-purple-500"/> 
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                {currentLabels.visual_analysis}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify whitespace-pre-wrap font-medium pl-1 border-l-4 border-gray-100 dark:border-gray-700">
                            {data.vision_analysis_summary}
                        </p>
                    </div>
                )}

                {/* 6. Next Action */}
                <div className={`p-6 rounded-3xl shadow-lg text-white relative overflow-hidden animate-slide-up ${data.overall_score >= 50 ? 'bg-gray-900 dark:bg-gray-800' : 'bg-gradient-to-br from-red-600 to-red-800'}`} style={{animationDelay: '0.4s'}}>
                    <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-[50px] transform translate-x-10 -translate-y-10"></div>
                    
                    <h3 className="text-[10px] font-bold text-white/60 mb-1 flex items-center gap-2 uppercase tracking-[0.2em] relative z-10">
                         {currentLabels.next_step}
                    </h3>
                    <div className="flex items-start gap-3 mt-3">
                        <ArrowRightCircle size={24} className="mt-0.5 text-[#FF4D6D] shrink-0" />
                        <p className="text-lg font-bold leading-snug relative z-10">
                            {data.next_steps}
                        </p>
                    </div>
                </div>

                {/* 7. Marking Scheme Legend (Collapsed/Minimal) */}
                 <div className="bg-gray-100/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800 animate-slide-up" style={{animationDelay: '0.5s'}}>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 text-center flex items-center justify-center gap-2">
                        <Star size={10} /> {currentLabels.reference_guide}
                    </h3>
                    <div className="flex justify-between text-[9px] text-gray-500 gap-2">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>{isEnglish ? 'Hire (70+)' : '聘用 (70+)'}</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>{isEnglish ? 'Cond. (50-69)' : '條件 (50-69)'}</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>{isEnglish ? 'Reject (<50)' : '不予 (<50)'}</div>
                    </div>
                </div>
            </div>
            
            {/* Bottom Padding for scroll */}
            <div className="h-6"></div>
        </div>

        {/* Fixed Footer for Action Button */}
        <div className="shrink-0 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-30 pb-[calc(1.5rem+env(safe-area-inset-bottom))] transition-all">
             <button 
                onClick={onRestart} 
                className="w-full py-4 bg-gradient-to-r from-[#D31145] to-[#FF4D6D] hover:from-[#b00e3a] hover:to-[#e11d48] text-white rounded-2xl font-bold shadow-[0_10px_30px_rgba(211,17,69,0.3)] hover:shadow-[0_15px_40px_rgba(211,17,69,0.4)] transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <Sparkles size={18} />
                {currentLabels.done}
            </button>
        </div>
    </div>
  );
};

export default ReportView;
