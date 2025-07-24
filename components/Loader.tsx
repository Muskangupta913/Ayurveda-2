import React from 'react';

const Loader = () => {
  return (
    <div
      className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading Ayurveda Near Me"
    >
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Main Loader */}
        <div className="relative">
          {/* Primary Ring */}
          <div className="w-16 h-16 border-3 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
          
          {/* Center Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          </div>
        </div>
        
        {/* Branding */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
            Ayurveda Near Me
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            Professional Healthcare Platform
          </p>
        </div>
        
        {/* Loading Progress */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-1"></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-2"></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-3"></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-1 {
          0%, 70%, 100% { opacity: 0.3; }
          35% { opacity: 1; }
        }
        
        @keyframes pulse-2 {
          0%, 70%, 100% { opacity: 0.3; }
          35% { opacity: 1; }
        }
        
        @keyframes pulse-3 {
          0%, 70%, 100% { opacity: 0.3; }
          35% { opacity: 1; }
        }
        
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
        
        .animate-pulse-1 {
          animation: pulse-1 1.8s ease-in-out infinite;
        }
        
        .animate-pulse-2 {
          animation: pulse-2 1.8s ease-in-out infinite 0.3s;
        }
        
        .animate-pulse-3 {
          animation: pulse-3 1.8s ease-in-out infinite 0.6s;
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          .animate-pulse-1,
          .animate-pulse-2,
          .animate-pulse-3 {
            animation: none;
          }
          
          .animate-pulse-1,
          .animate-pulse-2,
          .animate-pulse-3 {
            opacity: 0.7;
          }
        }
        
        /* Performance */
        .animate-spin {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default Loader;