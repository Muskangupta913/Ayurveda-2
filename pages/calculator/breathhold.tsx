import React, { useState, useEffect, useRef, useCallback } from 'react'

interface GameState {
  isRunning: boolean;
  seconds: number;
  maxSeconds: number;
  bestScore: number;
}

interface ResultMessage {
  title: string;
  message: string;
  emoji: string;
}

function BreathHold() {
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    seconds: 0,
    maxSeconds: 180,
    bestScore: 0
  });
  
  const [showResult, setShowResult] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ResultMessage | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState.isRunning) {
      startTimeRef.current = Date.now() - (gameState.seconds * 1000);
      
      const updateTimer = () => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          if (elapsed >= gameState.maxSeconds) {
            handleStop();
            return;
          }
          
          setGameState(prev => ({ ...prev, seconds: elapsed }));
          timerRef.current = setTimeout(updateTimer, 100);
        }
      };
      
      timerRef.current = setTimeout(updateTimer, 100);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState.isRunning, gameState.maxSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getResultMessage = useCallback((seconds: number): ResultMessage => {
    const messages = [
      { max: 29, title: "That was quick, habibi!", message: "No stress — take a deep breath and give it another try!", emoji: "😊" },
      { max: 59, title: "Getting there!", message: "With a bit more practice, you'll be flying — slowly slowly, you're building it up!", emoji: "🚀" },
      { max: 99, title: "Mashallah! That's strong breathing", message: "Keep it steady like a pro!", emoji: "💪" },
      { max: 149, title: "Very nice!", message: "Your lungs are working like a champ — almost at elite level!", emoji: "🏆" },
      { max: 179, title: "Khalas! This is top-tier breathing", message: "Solid control, real Dubai style!", emoji: "⭐" },
      { max: Infinity, title: "Legendary! You reached the max", message: "Salute to your breath control, full respect!", emoji: "👑" }
    ];
    
    return messages.find(m => seconds <= m.max) || messages[messages.length - 1];
  }, []);

  const handleStart = useCallback((): void => {
    setGameState(prev => ({ ...prev, isRunning: true, seconds: 0 }));
    setShowResult(false);
    setCurrentResult(null);
  }, []);

  const handleStop = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setGameState(prev => {
      const newBest = prev.seconds > prev.bestScore ? prev.seconds : prev.bestScore;
      return { ...prev, isRunning: false, bestScore: newBest };
    });
    
    const result = getResultMessage(gameState.seconds);
    setCurrentResult(result);
    setShowResult(true);
  }, [gameState.seconds, getResultMessage]);

  const handleReset = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setGameState(prev => ({ ...prev, isRunning: false, seconds: 0 }));
    setShowResult(false);
    setCurrentResult(null);
  }, []);

  const closeModal = useCallback((): void => {
    setShowResult(false);
    setCurrentResult(null);
    // Reset the game state after closing modal
    setGameState(prev => ({ ...prev, seconds: 0, isRunning: false }));
  }, []);

  const progressPercentage = (gameState.seconds / gameState.maxSeconds) * 100;
  
  const getStatusText = (): string => {
    if (gameState.isRunning) return "Hold your breath! Stay strong!";
    if (gameState.seconds > 0 && !showResult) return `You held for ${gameState.seconds} seconds!`;
    return "Ready to start your breath challenge?";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-cyan-600/10 backdrop-blur-xl border border-cyan-600/20 rounded-3xl p-8 w-full max-w-6xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
            🫁 Lung Checker
          </h1>
          <div className="bg-gradient-to-r from-cyan-600/20 to-cyan-600/10 backdrop-blur-lg px-6 py-3 rounded-full border border-cyan-600/30 shadow-lg">
            <span className="text-lg font-semibold text-white">
              Best: {formatTime(gameState.bestScore)}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Game Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Lung Animation */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <div className={`text-6xl md:text-7xl relative z-10 transition-all duration-1000 ${
                gameState.isRunning ? 'animate-pulse scale-110' : 'scale-100'
              }`}>
                🫁
              </div>
              {gameState.isRunning && (
                <>
                  <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-0 border-2 border-cyan-400/10 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </>
              )}
            </div>
            
            {/* Timer */}
            <div className={`text-5xl md:text-7xl font-mono font-bold transition-all duration-300 ${
              gameState.seconds > 150 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent'
            }`}>
              {formatTime(gameState.seconds)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md h-3 bg-slate-800/60 rounded-full overflow-hidden border border-cyan-600/20">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-yellow-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            {/* Status */}
            <div className="text-lg md:text-xl text-slate-300 font-medium">
              {getStatusText()}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button 
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-600 disabled:to-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25 active:scale-95 uppercase tracking-wider"
                onClick={handleStart}
                disabled={gameState.isRunning}
              >
                Start
              </button>
              <button 
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-600 disabled:to-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 active:scale-95 uppercase tracking-wider"
                onClick={handleStop}
                disabled={!gameState.isRunning}
              >
                Stop
              </button>
              <button 
                className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-slate-500/25 active:scale-95 uppercase tracking-wider border border-cyan-600/30"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-cyan-600/10 to-slate-800/20 backdrop-blur-lg border border-cyan-600/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">How to Play:</h3>
            <div className="space-y-4 text-slate-300">
              <p className="flex items-center gap-3 text-lg">
                <span className="text-cyan-400 font-bold text-xl">1.</span>
                Click Start and take a deep breath
              </p>
              <p className="flex items-center gap-3 text-lg">
                <span className="text-cyan-400 font-bold text-xl">2.</span>
                Hold your breath as long as possible
              </p>
              <p className="flex items-center gap-3 text-lg">
                <span className="text-cyan-400 font-bold text-xl">3.</span>
                Click Stop when you need to breathe
              </p>
              <p className="flex items-center gap-3 text-lg">
                <span className="text-cyan-400 font-bold text-xl">4.</span>
                Maximum time: 180 seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && currentResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-600/30 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-cyan-400 transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
              onClick={closeModal}
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
            
            <div className="text-center pt-4">
              <div className="text-6xl mb-4 animate-bounce">
                {currentResult.emoji}
              </div>
              
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                {currentResult.title}
              </h2>
              
              <div className="bg-gradient-to-r from-cyan-600/20 to-slate-700/20 backdrop-blur-lg border border-cyan-600/30 rounded-2xl p-4 mb-4">
                <div className="text-xl font-bold text-cyan-300">
                  You held for {formatTime(gameState.seconds)}!
                </div>
              </div>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {currentResult.message}
              </p>
              
              {gameState.seconds > gameState.bestScore && (
                <div className="text-yellow-400 font-bold text-lg animate-pulse">
                  🎉 New Personal Best! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BreathHold;

BreathHold.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};