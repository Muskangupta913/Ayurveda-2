import React from 'react';

const Loader = () => {
  return (
    <div
      className="fixed inset-0 bg-slate-50/98 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading ZEVA"
    >
      <div className="flex flex-col items-center justify-center space-y-10">
        {/* Main Loader Container */}
        <div className="relative">
          {/* Outer Ring */}
          <div className="w-20 h-20 border-2 border-slate-200 rounded-full"></div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 w-20 h-20 border-2 border-transparent border-t-[#2D9AA5] border-r-[#2D9AA5] rounded-full animate-spin-smooth"></div>
          
          {/* Inner Ring */}
          <div className="absolute inset-2 w-16 h-16 border border-slate-100 rounded-full"></div>
          
          {/* Center Logo Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-[#2D9AA5] rounded-full opacity-90 animate-pulse-gentle"></div>
          </div>
        </div>
        
        {/* Professional Branding */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-slate-800 tracking-wider letter-spacing-wide">
            ZEVA
          </h1>
          <div className="w-16 h-0.5 bg-[#2D9AA5] mx-auto"></div>
          <p className="text-sm text-slate-600 font-medium tracking-wide uppercase">
            
          </p>
        </div>
        
        {/* Loading Progress Indicators */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full animate-pulse-sequence-1"></div>
            <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full animate-pulse-sequence-2"></div>
            <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full animate-pulse-sequence-3"></div>
            <div className="w-1.5 h-1.5 bg-[#2D9AA5] rounded-full animate-pulse-sequence-4"></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin-smooth {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes pulse-sequence-1 {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes pulse-sequence-2 {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes pulse-sequence-3 {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes pulse-sequence-4 {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.2); }
        }
        
        .animate-spin-smooth {
          animation: spin-smooth 2s linear infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 2.5s ease-in-out infinite;
        }
        
        .animate-pulse-sequence-1 {
          animation: pulse-sequence-1 2s ease-in-out infinite;
        }
        
        .animate-pulse-sequence-2 {
          animation: pulse-sequence-2 2s ease-in-out infinite 0.3s;
        }
        
        .animate-pulse-sequence-3 {
          animation: pulse-sequence-3 2s ease-in-out infinite 0.6s;
        }
        
        .animate-pulse-sequence-4 {
          animation: pulse-sequence-4 2s ease-in-out infinite 0.9s;
        }
        
        .letter-spacing-wide {
          letter-spacing: 0.2em;
        }
        
        /* Professional shadow effects */
        .text-4xl {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-spin-smooth,
          .animate-pulse-gentle,
          .animate-pulse-sequence-1,
          .animate-pulse-sequence-2,
          .animate-pulse-sequence-3,
          .animate-pulse-sequence-4 {
            animation: none;
          }
          
          .animate-pulse-sequence-1,
          .animate-pulse-sequence-2,
          .animate-pulse-sequence-3,
          .animate-pulse-sequence-4 {
            opacity: 0.8;
            transform: scale(1);
          }
          
          .animate-pulse-gentle {
            opacity: 0.9;
            transform: scale(1);
          }
        }
        
        /* Performance optimizations */
        .animate-spin-smooth {
          will-change: transform;
        }
        
        .animate-pulse-sequence-1,
        .animate-pulse-sequence-2,
        .animate-pulse-sequence-3,
        .animate-pulse-sequence-4 {
          will-change: opacity, transform;
        }
        
        /* High DPI display optimization */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
          .w-20, .h-20, .w-16, .h-16 {
            transform: translateZ(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;