import React, { useState, useEffect, useRef, useCallback } from 'react'

// Types and Interfaces
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

interface BreathHoldProps {
  className?: string;
}

function  BreathHold(){
  // State management
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    seconds: 0,
    maxSeconds: 180,
    bestScore: 0
  });
  
  const [showResult, setShowResult] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ResultMessage | null>(null);
  
  // Refs for timer management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load best score from localStorage on component mount
  useEffect(() => {
    const savedBestScore = localStorage.getItem('dubaiLungCheckerBest');
    if (savedBestScore) {
      setGameState(prev => ({
        ...prev,
        bestScore: parseInt(savedBestScore, 10)
      }));
    }
  }, []);

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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState.isRunning, gameState.maxSeconds]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get result message based on seconds
  const getResultMessage = useCallback((seconds: number): ResultMessage => {
    if (seconds <= 29) {
      return {
        title: "That was quick, habibi!",
        message: "No stress — take a deep breath and give it another try!",
        emoji: "😊"
      };
    } else if (seconds <= 59) {
      return {
        title: "Getting there!",
        message: "With a bit more practice, you'll be flying — slowly slowly, you're building it up!",
        emoji: "🚀"
      };
    } else if (seconds <= 99) {
      return {
        title: "Mashallah! That's strong breathing",
        message: "Keep it steady like a pro!",
        emoji: "💪"
      };
    } else if (seconds <= 149) {
      return {
        title: "Very nice!",
        message: "Your lungs are working like a champ — almost at elite level!",
        emoji: "🏆"
      };
    } else if (seconds <= 179) {
      return {
        title: "Khalas! This is top-tier breathing",
        message: "Solid control, real Dubai style!",
        emoji: "⭐"
      };
    } else {
      return {
        title: "Legendary! You reached the max",
        message: "Salute to your breath control, full respect!",
        emoji: "👑"
      };
    }
  }, []);

  // Save best score to localStorage
  const saveBestScore = useCallback((score: number): void => {
    localStorage.setItem('dubaiLungCheckerBest', score.toString());
  }, []);

  // Game control handlers
  const handleStart = useCallback((): void => {
    setGameState(prev => ({
      ...prev,
      isRunning: true,
      seconds: 0
    }));
    setShowResult(false);
  }, []);

  const handleStop = useCallback((): void => {
    setGameState(prev => {
      const newState = { ...prev, isRunning: false };
      
      // Update best score if current is better
      if (prev.seconds > prev.bestScore) {
        newState.bestScore = prev.seconds;
        saveBestScore(prev.seconds);
      }
      
      return newState;
    });
    
    // Show result modal
    const result = getResultMessage(gameState.seconds);
    setCurrentResult(result);
    setShowResult(true);
  }, [gameState.seconds, getResultMessage, saveBestScore]);

  const handleReset = useCallback((): void => {
    setGameState(prev => ({
      ...prev,
      isRunning: false,
      seconds: 0
    }));
    setShowResult(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const closeModal = useCallback((): void => {
    setShowResult(false);
  }, []);

  // Calculate progress percentage
  const progressPercentage = (gameState.seconds / gameState.maxSeconds) * 100;

  // Get status text
  const getStatusText = (): string => {
    if (gameState.isRunning) {
      return "Hold your breath! Stay strong!";
    } else if (gameState.seconds > 0) {
      return `You held for ${gameState.seconds} seconds!`;
    } else {
      return "Ready to start your breath challenge?";
    }
  };

  return (
    <div className="breath-hold-game">
      <style jsx>{`
        .breath-hold-game {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #2D9AA5 0%, #1e6b73 100%);
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          padding: 1rem;
          overflow: hidden;
        }

        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.5rem;
          text-align: center;
          width: 100%;
          max-width: 900px;
          max-height: 95vh;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr auto;
          gap: 1.5rem;
        }

        .header {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header h1 {
          font-size: 2rem;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .best-score {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .game-section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .lung-container {
          position: relative;
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .lung-icon {
          font-size: 4rem;
          animation: ${gameState.isRunning ? 'breathe 2s ease-in-out infinite' : 'none'};
          z-index: 2;
          position: relative;
        }

        .breathing-circle {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: ${gameState.isRunning ? 'pulse 2s ease-in-out infinite' : 'none'};
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }

        .timer {
          font-size: 4rem;
          font-weight: bold;
          margin: 1rem 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          color: ${gameState.seconds > 150 ? '#FFD700' : 'white'};
        }

        .progress-container {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          margin: 1rem 0;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #FFD700, #FF4444);
          border-radius: 4px;
          width: ${progressPercentage}%;
          transition: width 0.3s ease;
        }

        .status {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 1rem 0;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin: 1rem 0;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 80px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-start {
          background: linear-gradient(45deg, #4CAF50, #45a049);
          color: white;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
        }

        .btn-start:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
        }

        .btn-stop {
          background: linear-gradient(45deg, #f44336, #da190b);
          color: white;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
        }

        .btn-stop:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(244, 67, 54, 0.6);
        }

        .btn-reset {
          background: linear-gradient(45deg, #2D9AA5, #1e6b73);
          color: white;
          box-shadow: 0 4px 15px rgba(45, 154, 165, 0.4);
        }

        .btn-reset:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45, 154, 165, 0.6);
        }

        .instructions {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .instructions h3 {
          margin-bottom: 1rem;
          color: #FFD700;
          font-size: 1.3rem;
        }

        .instructions p {
          margin: 0.3rem 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .modal {
          display: ${showResult ? 'flex' : 'none'};
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: linear-gradient(135deg, #2D9AA5, #1e6b73);
          padding: 2rem;
          border-radius: 20px;
          width: 90%;
          max-width: 450px;
          position: relative;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .close {
          color: white;
          float: right;
          font-size: 2rem;
          font-weight: bold;
          position: absolute;
          top: 1rem;
          right: 1.5rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .close:hover {
          color: #FFD700;
        }

        .result-content {
          padding-top: 1rem;
        }

        .result-emoji {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .result-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #FFD700;
        }

        .result-message {
          font-size: 1.1rem;
          line-height: 1.4;
          margin-bottom: 1.5rem;
        }

        .result-time {
          background: rgba(255, 255, 255, 0.2);
          padding: 1rem;
          border-radius: 15px;
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .container {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto auto;
            max-height: none;
            height: auto;
          }
          
          .header {
            flex-direction: column;
            text-align: center;
          }
          
          .header h1 {
            font-size: 1.8rem;
          }
          
          .timer {
            font-size: 3rem;
          }
          
          .controls {
            flex-wrap: wrap;
          }
          
          .btn {
            flex: 1;
            min-width: 70px;
          }
        }

        @media (min-width: 1200px) {
          .container {
            max-width: 1000px;
          }
          
          .timer {
            font-size: 5rem;
          }
          
          .lung-icon {
            font-size: 5rem;
          }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>🫁 Lung Checker</h1>
          <div className="best-score">
            Best: {formatTime(gameState.bestScore)}
          </div>
        </div>

        <div className="game-section">
          <div className="lung-container">
            <div className="lung-icon">🫁</div>
            <div className="breathing-circle"></div>
          </div>
          
          <div className="timer">{formatTime(gameState.seconds)}</div>
          <div className="progress-container">
            <div className="progress-bar"></div>
          </div>
          <div className="status">{getStatusText()}</div>

          <div className="controls">
            <button 
              className="btn btn-start" 
              onClick={handleStart}
              disabled={gameState.isRunning}
            >
              Start
            </button>
            <button 
              className="btn btn-stop" 
              onClick={handleStop}
              disabled={!gameState.isRunning}
            >
              Stop
            </button>
            <button 
              className="btn btn-reset" 
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="instructions">
          <h3>How to Play:</h3>
          <p>1. Click "Start" and take a deep breath</p>
          <p>2. Hold your breath as long as possible</p>
          <p>3. Click "Stop" when you need to breathe</p>
          <p>4. Maximum time: 180 seconds</p>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && currentResult && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <div className="result-content">
              <div className="result-emoji">{currentResult.emoji}</div>
              <div className="result-title">{currentResult.title}</div>
              <div className="result-time">
                You held for {formatTime(gameState.seconds)}!
              </div>
              <div className="result-message">{currentResult.message}</div>
              {gameState.seconds > gameState.bestScore && (
                <div style={{ color: '#FFD700', fontWeight: 'bold', marginTop: '1rem' }}>
                  🎉 New Personal Best! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreathHold;

BreathHold.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}