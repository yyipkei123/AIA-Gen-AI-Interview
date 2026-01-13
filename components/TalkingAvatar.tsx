
import React, { useState } from 'react';
import { User, Sparkles, Brain } from 'lucide-react';
import { AVATAR_CINDY_URL, AVATAR_MR_CHAN_URL } from '../constants';
import { ScenarioMode, Sentiment } from '../types';

interface TalkingAvatarProps {
  isSpeaking: boolean;
  mode: ScenarioMode;
  size?: 'large' | 'small' | 'hero';
  sentiment?: Sentiment;
}

const TalkingAvatar: React.FC<TalkingAvatarProps> = ({ 
  isSpeaking, 
  mode, 
  size = 'large',
  sentiment = 'neutral'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dynamic styles based on Sentiment and Speaking state
  let ringColor = '#D31145'; // Default Red
  let StatusIcon = null;
  let statusIconColor = '';
  let statusIconBg = '';

  if (isSpeaking) {
    if (sentiment === 'positive') {
        ringColor = '#fbbf24'; // Amber
        StatusIcon = Sparkles;
        statusIconColor = 'text-amber-600';
        statusIconBg = 'bg-amber-50';
    } else if (sentiment === 'serious') {
        ringColor = '#3b82f6'; // Blue
        StatusIcon = Brain;
        statusIconColor = 'text-blue-600';
        statusIconBg = 'bg-blue-50';
    } else {
        ringColor = '#D31145'; // Red
    }
  }

  const avatarUrl = mode === 'standard' ? AVATAR_CINDY_URL : AVATAR_MR_CHAN_URL;

  // HERO MODE: Full screen immersive character style
  if (size === 'hero') {
    return (
      <div className={`relative w-full h-full flex items-end justify-center overflow-hidden transition-all duration-700 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
         {/* Background Glow behind head */}
         <div className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-white/30 rounded-full blur-[60px] pointer-events-none transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-50'}`}></div>
         
         {/* Main Image */}
         <div className="relative z-10 w-[85%] h-[85%] max-w-sm">
             {!imageError ? (
                <img 
                    src={avatarUrl} 
                    alt="AI Avatar" 
                    className={`w-full h-full object-cover object-top rounded-t-[3rem] shadow-2xl transition-all duration-500 mask-gradient-to-b ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ 
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                    }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/10 rounded-t-[3rem]">
                    <User size={80} className="text-white/50" />
                </div>
             )}
             
             {/* Speaking Ring Effect (Hero) */}
             {isSpeaking && (
                 <div className="absolute inset-0 rounded-t-[3rem] border-4 border-white/20 animate-pulse pointer-events-none" style={{ borderColor: ringColor + '40' }}></div>
             )}
         </div>

         {/* Sentiment Icon Floating */}
         {isSpeaking && StatusIcon && (
            <div className={`absolute top-1/3 right-[10%] z-20 ${statusIconBg} p-3 rounded-full shadow-lg animate-bounce`}>
                <StatusIcon size={24} className={statusIconColor} />
            </div>
         )}
      </div>
    );
  }

  // STANDARD / LARGE MODE
  const containerSize = size === 'large' ? 'w-40 h-40' : 'w-10 h-10';
  const iconSize = size === 'large' ? 64 : 20;
  
  let borderColor = 'border-white';
  let shadowStyle = size === 'large' ? 'shadow-xl' : 'shadow-sm';

  if (isSpeaking) {
    if (sentiment === 'positive') {
        borderColor = 'border-amber-400';
        shadowStyle = 'shadow-[0_0_20px_rgba(251,191,36,0.6)]';
    } else if (sentiment === 'serious') {
        borderColor = 'border-blue-500';
        shadowStyle = 'shadow-[0_0_20px_rgba(59,130,246,0.6)]';
    } else {
        borderColor = 'border-[#ff4d6d]';
        shadowStyle = 'shadow-[0_0_20px_rgba(255,77,109,0.4)]';
    }
  }

  const name = mode === 'standard' ? "Cindy (經理)" : "Ms. Lau (資深總監)";
  
  // Animation classes for Posture
  let animationClass = '';
  if (size === 'large' && !isSpeaking) {
      animationClass = 'animate-float';
  } else if (isSpeaking) {
      if (sentiment === 'positive') {
          animationClass = 'animate-breathe rotate-1'; 
      } else if (sentiment === 'serious') {
          animationClass = 'scale-105'; 
      }
  }

  return (
    <div className={`relative ${containerSize} mx-auto transition-all duration-700 ease-in-out ${animationClass} ${size === 'large' ? 'hover:scale-105 cursor-pointer' : ''}`}>
      {/* Speaking Ripple Effect */}
      {isSpeaking && size === 'large' && (
        <>
            <div className={`absolute inset-0 rounded-full opacity-20 animate-ping`} style={{ backgroundColor: ringColor }}></div>
            <div className={`absolute inset-[-8px] rounded-full border-2 opacity-30 animate-pulse`} style={{ borderColor: ringColor }}></div>
        </>
      )}

      {/* Main Avatar Circle */}
      <div className={`
        absolute inset-0 rounded-full bg-white overflow-hidden z-10 
        border-2 ${borderColor} ${shadowStyle} 
        flex items-center justify-center transition-all duration-500
      `}>
        {(!imageLoaded || imageError) && (
            <User className="text-gray-300" size={iconSize} />
        )}
        
        {!imageError && (
            <img 
                src={avatarUrl} 
                alt="AI Avatar" 
                className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
            />
        )}
      </div>

      {/* Name Badge (Large only) */}
      {size === 'large' && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-gray-100 flex items-center whitespace-nowrap z-20 transition-all duration-300 hover:bg-white">
            <div className={`w-2.5 h-2.5 rounded-full mr-2 transition-colors duration-300 ${isSpeaking ? 'animate-pulse' : 'bg-gray-300'}`} style={{ backgroundColor: isSpeaking ? ringColor : undefined }}></div>
            <span className="text-xs font-bold text-gray-700 tracking-wide">
                {name}
            </span>
        </div>
      )}
    </div>
  );
};

export default TalkingAvatar;
