import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 15, text: 'Loading resources...' },
      { progress: 30, text: 'Connecting to servers...' },
      { progress: 45, text: 'Authenticating user...' },
      { progress: 60, text: 'Loading interface...' },
      { progress: 75, text: 'Preparing data...' },
      { progress: 90, text: 'Finalizing setup...' },
      { progress: 100, text: 'Ready!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setProgress(loadingSteps[currentStep].progress);
        setLoadingText(loadingSteps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-slate-50/95 via-blue-50/90 to-teal-50/95 backdrop-blur-lg z-[9999] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading ZEVA"
    >
      <div className="flex flex-col items-center justify-center space-y-12">
        {/* Main Loader Container with Enhanced Design */}
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#2D9AA5]/20 via-blue-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse-glow"></div>
          
          {/* Primary Outer Ring */}
          <div className="w-24 h-24 border-2 border-slate-200/60 rounded-full shadow-lg"></div>
          
          {/* Main Animated Ring */}
          <div className="absolute inset-0 w-24 h-24 border-3 border-transparent border-t-[#2D9AA5] border-r-[#2D9AA5]/70 border-b-blue-500/50 rounded-full animate-spin-elegant shadow-lg"></div>
          
          {/* Secondary Ring */}
          <div className="absolute inset-1 w-22 h-22 border border-slate-100/80 rounded-full"></div>
          
          {/* Inner Animated Ring */}
          <div className="absolute inset-2 w-20 h-20 border-2 border-transparent border-l-teal-400/60 border-b-[#2D9AA5]/40 rounded-full animate-spin-counter"></div>
          
          {/* Center Medical Symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Enhanced Cross Symbol with better visibility */}
              <div className="relative z-10">
                {/* Horizontal bar */}
                <div className="w-7 h-1.5 bg-gradient-to-r from-[#2D9AA5] via-teal-500 to-[#2D9AA5] rounded-full shadow-lg animate-pulse-medical"></div>
                {/* Vertical bar */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-[#2D9AA5] via-teal-500 to-[#2D9AA5] rounded-full shadow-lg animate-pulse-medical"></div>
              </div>
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-[#2D9AA5]/30 via-teal-500/20 to-transparent rounded-full animate-pulse-gentle blur-md"></div>
              {/* Additional bright center glow */}
              <div className="absolute inset-2 bg-[#2D9AA5]/40 rounded-full animate-pulse-gentle blur-sm"></div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Branding */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-[#2D9AA5] to-teal-600 tracking-widest animate-text-shimmer">
            ZEVA
          </h1>
          <div className="relative">
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#2D9AA5] to-transparent mx-auto rounded-full"></div>
            <div className="absolute inset-0 w-20 h-1 bg-gradient-to-r from-transparent via-[#2D9AA5] to-transparent mx-auto rounded-full animate-slide-gradient"></div>
          </div>
          <p className="text-sm text-slate-600/80 font-medium tracking-wider uppercase animate-fade-in-up">
            Healthcare Solutions
          </p>
        </div>
        
        {/* Enhanced Progress Indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-[#2D9AA5] to-teal-500 rounded-full animate-wave-1 shadow-sm"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#2D9AA5] to-teal-500 rounded-full animate-wave-2 shadow-sm"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#2D9AA5] to-teal-500 rounded-full animate-wave-3 shadow-sm"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#2D9AA5] to-teal-500 rounded-full animate-wave-4 shadow-sm"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#2D9AA5] to-teal-500 rounded-full animate-wave-5 shadow-sm"></div>
          </div>
        </div>
        
        {/* Enhanced Progress Bar Animation */}
        <div className="w-96 max-w-md space-y-6">
          {/* Progress Bar Container with Enhanced Design */}
          <div className="relative">
            {/* Background track with subtle gradient */}
            <div className="w-full h-3 bg-gradient-to-r from-slate-200/40 via-slate-100/60 to-slate-200/40 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#2D9AA5] via-teal-400 to-blue-500 rounded-full transition-all duration-1000 ease-out relative shadow-lg"
                style={{ width: `${progress}%` }}
              >
                {/* Primary shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                {/* Secondary glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#2D9AA5]/20 via-white/30 to-blue-500/20 rounded-full animate-shimmer-slow"></div>
                {/* Progress bar end glow */}
                <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-white/60 to-transparent rounded-r-full"></div>
              </div>
            </div>
            
            {/* Animated progress indicator dots */}
            <div className="absolute -top-1 left-0 w-full flex justify-between items-center">
              {[0, 25, 50, 75, 100].map((milestone) => (
                <div 
                  key={milestone}
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    progress >= milestone 
                      ? 'bg-[#2D9AA5] shadow-lg animate-pulse-gentle' 
                      : 'bg-slate-300/60'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Enhanced Loading Status Text */}
          <div className="text-center space-y-2">
            <div className="text-slate-700/90 text-base font-medium tracking-wide animate-fade-text">
              {loadingText}
            </div>
            {/* Loading indicator dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-1 h-1 bg-[#2D9AA5] rounded-full animate-bounce-1"></div>
              <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce-2"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce-3"></div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .border-3 {
          border-width: 3px;
        }
        
        .w-22 { width: 5.5rem; }
        .h-22 { height: 5.5rem; }
        
        @keyframes spin-elegant {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.02); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes spin-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        @keyframes pulse-medical {
          0%, 100% { opacity: 0.8; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        @keyframes text-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slide-gradient {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes wave-1 {
          0%, 80%, 100% { opacity: 0.4; transform: translateY(0) scale(1); }
          20% { opacity: 1; transform: translateY(-8px) scale(1.2); }
        }
        
        @keyframes wave-2 {
          0%, 80%, 100% { opacity: 0.4; transform: translateY(0) scale(1); }
          30% { opacity: 1; transform: translateY(-8px) scale(1.2); }
        }
        
        @keyframes wave-3 {
          0%, 80%, 100% { opacity: 0.4; transform: translateY(0) scale(1); }
          40% { opacity: 1; transform: translateY(-8px) scale(1.2); }
        }
        
        @keyframes wave-4 {
          0%, 80%, 100% { opacity: 0.4; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-8px) scale(1.2); }
        }
        
        @keyframes wave-5 {
          0%, 80%, 100% { opacity: 0.4; transform: translateY(0) scale(1); }
          60% { opacity: 1; transform: translateY(-8px) scale(1.2); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-text {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes dots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .animate-spin-elegant {
          animation: spin-elegant 3s ease-in-out infinite;
        }
        
        .animate-spin-counter {
          animation: spin-counter 4s linear infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .animate-pulse-medical {
          animation: pulse-medical 2s ease-in-out infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 2.5s ease-in-out infinite;
        }
        
        .animate-text-shimmer {
          background-size: 200% 200%;
          animation: text-shimmer 3s ease-in-out infinite;
        }
        
        .animate-slide-gradient {
          animation: slide-gradient 2s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 0.5s both;
        }
        
        .animate-wave-1 { animation: wave-1 2.5s ease-in-out infinite; }
        .animate-wave-2 { animation: wave-2 2.5s ease-in-out infinite; }
        .animate-wave-3 { animation: wave-3 2.5s ease-in-out infinite; }
        .animate-wave-4 { animation: wave-4 2.5s ease-in-out infinite; }
        .animate-wave-5 { animation: wave-5 2.5s ease-in-out infinite; }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-fade-text {
          animation: fade-text 0.5s ease-out;
        }
        
        .animate-dots {
          animation: dots 2s ease-in-out infinite;
        }
        
        /* Professional enhancements */
        .text-5xl {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          filter: drop-shadow(0 1px 2px rgba(45, 154, 165, 0.2));
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .animate-wave-1, .animate-wave-2, .animate-wave-3, .animate-wave-4, .animate-wave-5 {
            opacity: 0.8;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Performance optimizations */
        .animate-spin-elegant, .animate-spin-counter {
          will-change: transform;
          transform-origin: center;
        }
        
        .animate-wave-1, .animate-wave-2, .animate-wave-3, .animate-wave-4, .animate-wave-5 {
          will-change: opacity, transform;
        }
        
        /* Glass effect enhancement */
        .backdrop-blur-lg {
          backdrop-filter: blur(20px) saturate(180%);
        }
        
        /* High DPI optimization */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
          .w-24, .h-24, .w-22, .h-22, .w-20, .h-20 {
            transform: translateZ(0);
            backface-visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;