import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Trophy, RotateCcw, Play, Star, Home, Pause, PlayCircle, Volume2, VolumeX } from 'lucide-react';

interface Exercise {
  name: string;
  icon: string;
  calories: number;
}

interface GameCard extends Exercise {
  id: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Level {
  level: number;
  pairs: number;
  timeLimit: number;
  name: string;
}

type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

function FitnessMemoryGame() {
  const exercises: Exercise[] = [
    { name: 'Push-ups', icon: '💪', calories: 8 },
    { name: 'Jumping Jacks', icon: '🤸', calories: 10 },
    { name: 'Squats', icon: '🏋️', calories: 6 },
    { name: 'Burpees', icon: '🔥', calories: 15 },
    { name: 'Planks', icon: '🧘', calories: 5 },
    { name: 'Lunges', icon: '🦵', calories: 7 },
    { name: 'Mountain Climbers', icon: '⛰️', calories: 12 },
    { name: 'High Knees', icon: '🏃', calories: 9 },
    { name: 'Sit-ups', icon: '💺', calories: 6 },
    { name: 'Pull-ups', icon: '🚁', calories: 14 },
    { name: 'Tricep Dips', icon: '💺', calories: 8 },
    { name: 'Bicycle Crunches', icon: '🚴', calories: 7 }
  ];

  const levels: Level[] = [
    { level: 1, pairs: 6, timeLimit: 60, name: 'Beginner' },
    { level: 2, pairs: 8, timeLimit: 45, name: 'Intermediate' },
    { level: 3, pairs: 10, timeLimit: 35, name: 'Advanced' },
    { level: 4, pairs: 12, timeLimit: 30, name: 'Expert' }
  ];

  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(levels[0].timeLimit);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [moves, setMoves] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [recentMatch, setRecentMatch] = useState<string>('');

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const initializeGame = useCallback(() => {
    const level = levels[currentLevel];
    const selectedExercises = exercises.slice(0, level.pairs);
    const gameCards: GameCard[] = [];
    
    selectedExercises.forEach((exercise, index) => {
      gameCards.push({ ...exercise, id: `${index}-1`, isFlipped: false, isMatched: false });
      gameCards.push({ ...exercise, id: `${index}-2`, isFlipped: false, isMatched: false });
    });
    
    setCards(shuffleArray(gameCards));
    setFlippedCards([]);
    setMatchedPairs([]);
    setTimeLeft(level.timeLimit);
    setMoves(0);
    setGameState('playing');
    setRecentMatch('');
  }, [currentLevel]);

  const calculateStars = useCallback((): number => {
    const level = levels[currentLevel];
    const maxMoves = level.pairs * 2.5;
    const perfectMoves = level.pairs;
    
    if (moves <= perfectMoves) return 3;
    if (moves <= maxMoves) return 2;
    return 1;
  }, [moves, currentLevel]);

  const handleCardClick = (clickedCard: GameCard): void => {
    if (gameState !== 'playing') return;
    if (clickedCard.isFlipped || clickedCard.isMatched) return;
    if (flippedCards.length >= 2) return;

    const updatedCards = cards.map(card =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );
    setCards(updatedCards);

    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      if (newFlippedCards[0].name === newFlippedCards[1].name) {
        // Match found
        const calories = newFlippedCards[0].calories;
        setTotalCalories(prev => prev + calories);
        setScore(prev => prev + calories * 10);
        setRecentMatch(`+${calories} calories!`);
        
        // Show celebration animation
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
        
        setTimeout(() => {
          const matchedCards = cards.map(card =>
            card.name === newFlippedCards[0].name
              ? { ...card, isMatched: true, isFlipped: false }
              : card
          );
          setCards(matchedCards);
          setMatchedPairs(prev => [...prev, newFlippedCards[0].name]);
          setFlippedCards([]);

          // Check if level complete
          if (matchedCards.filter(card => card.isMatched).length === levels[currentLevel].pairs * 2) {
            const earnedStars = calculateStars();
            setStars(earnedStars);
            setTimeout(() => setGameState('won'), 500);
          }
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = cards.map(card =>
            newFlippedCards.some(fc => fc.id === card.id)
              ? { ...card, isFlipped: false }
              : card
          );
          setCards(resetCards);
          setFlippedCards([]);
        }, 1500);
      }
    }
  };

  const togglePause = (): void => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const nextLevel = (): void => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
      initializeGame();
    } else {
      setGameState('menu');
      setCurrentLevel(0);
    }
  };

  const resetLevel = (): void => {
    initializeGame();
  };

  const backToMenu = (): void => {
    setGameState('menu');
    setScore(0);
    setTotalCalories(0);
    setCurrentLevel(0);
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('lost');
    }
  }, [timeLeft, gameState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGridConfig = () => {
    const pairs = levels[currentLevel].pairs;
    if (pairs <= 6) return { cols: 'grid-cols-3 sm:grid-cols-4', gap: 'gap-2 sm:gap-3' };
    if (pairs <= 8) return { cols: 'grid-cols-4 sm:grid-cols-4', gap: 'gap-2 sm:gap-3' };
    if (pairs <= 10) return { cols: 'grid-cols-4 sm:grid-cols-5', gap: 'gap-1 sm:gap-2' };
    return { cols: 'grid-cols-4 sm:grid-cols-6', gap: 'gap-1 sm:gap-2' };
  };

  const getProgress = (): number => {
    const totalPairs = levels[currentLevel].pairs;
    return (matchedPairs.length / totalPairs) * 100;
  };

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen p-2 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-6xl mx-auto">
          {/* Header with Animation */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-block animate-bounce mb-4">
              {/* <div className="text-6xl sm:text-8xl">🏃</div> */}
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Fitness Memory Game
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Match exercises, burn calories, and challenge your memory! 🔥
            </p>
          </div>
          
          {/* Level Selection */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 px-2">
            {levels.map((level, index) => (
              <div
                key={index}
                className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                  index === currentLevel 
                    ? 'shadow-lg animate-pulse' 
                    : 'hover:shadow-md'
                }`}
                style={{ 
                  backgroundColor: '#ffffff',
                  borderColor: index === currentLevel ? '#2D9AA5' : '#e5e7eb',
                  boxShadow: index === currentLevel ? '0 10px 25px rgba(45, 154, 165, 0.2)' : undefined
                }}
                onClick={() => setCurrentLevel(index)}
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">
                    {index === 0 && '🌟'}
                    {index === 1 && '⚡'}
                    {index === 2 && '🔥'}
                    {index === 3 && '💎'}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    Level {level.level}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-1">{level.name}</p>
                  <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <p>{level.pairs} pairs</p>
                    <p>{level.timeLimit}s limit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <div className="text-center mb-6">
            <button
              onClick={initializeGame}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-white font-bold text-lg sm:text-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto animate-pulse"
              style={{ backgroundColor: '#2D9AA5' }}
            >
              <Play size={20} className="sm:w-6 sm:h-6" />
              Start Level {currentLevel + 1}
            </button>
          </div>

          {/* Session Stats */}
          {totalCalories > 0 && (
            <div className="mt-6 sm:mt-8 text-center p-4 sm:p-6 rounded-2xl mx-2 animate-slide-up" style={{ backgroundColor: '#ffffff' }}>
              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: '#2D9AA5' }}>
                🏆 Session Stats
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#2D9AA5' }}>{score}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1" style={{ color: '#2D9AA5' }}>
                    <Zap size={16} className="sm:w-5 sm:h-5" />
                    {totalCalories}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Calories</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Paused Screen
  if (gameState === 'paused') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-6 sm:p-8 rounded-2xl max-w-md w-full mx-4 animate-scale-in" style={{ backgroundColor: '#ffffff' }}>
          <div className="text-6xl sm:text-8xl mb-4 animate-pulse">⏸️</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#2D9AA5' }}>Game Paused</h2>
          <p className="text-gray-600 mb-6">Take a break and come back stronger!</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={togglePause}
              className="px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2D9AA5' }}
            >
              <PlayCircle size={20} />
              Resume
            </button>
            <button
              onClick={backToMenu}
              className="px-6 py-3 rounded-xl border-2 font-bold transition-all duration-300 hover:scale-105"
              style={{ borderColor: '#2D9AA5', color: '#2D9AA5' }}
            >
              <Home size={20} className="inline mr-2" />
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Won Screen
  if (gameState === 'won') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-6 sm:p-8 rounded-2xl max-w-md w-full mx-4 animate-bounce-in" style={{ backgroundColor: '#ffffff' }}>
          <div className="animate-bounce mb-4">
            <Trophy size={48} className="sm:w-16 sm:h-16 mx-auto" style={{ color: '#2D9AA5' }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
            Level Complete! 🎉
          </h2>
          
          <div className="flex justify-center mb-6 animate-star-burst">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                size={24}
                className={`sm:w-8 sm:h-8 mx-1 transition-all duration-300 ${
                  star <= stars ? 'text-yellow-400 fill-current animate-pulse' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="space-y-3 mb-6 text-sm sm:text-base">
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
              <span>Moves:</span>
              <span className="font-bold">{moves}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
              <span>Calories Burned:</span>
              <span className="font-bold text-green-600">+{levels[currentLevel].pairs * 8}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
              <span>Score:</span>
              <span className="font-bold" style={{ color: '#2D9AA5' }}>+{levels[currentLevel].pairs * 80}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetLevel}
              className="px-4 sm:px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2D9AA5' }}
            >
              <RotateCcw size={16} />
              Retry
            </button>
            {currentLevel < levels.length - 1 ? (
              <button
                onClick={nextLevel}
                className="px-4 sm:px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 animate-pulse"
                style={{ backgroundColor: '#16a34a' }}
              >
                Next Level 🚀
              </button>
            ) : (
              <button
                onClick={backToMenu}
                className="px-4 sm:px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: '#16a34a' }}
              >
                Complete! 🏆
              </button>
            )}
            <button
              onClick={backToMenu}
              className="px-4 sm:px-6 py-3 rounded-xl border-2 font-bold transition-all duration-300 hover:scale-105"
              style={{ borderColor: '#2D9AA5', color: '#2D9AA5' }}
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lost Screen
  if (gameState === 'lost') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-6 sm:p-8 rounded-2xl max-w-md w-full mx-4 animate-shake" style={{ backgroundColor: '#ffffff' }}>
          <div className="text-5xl sm:text-6xl mb-4 animate-pulse">⏰</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-red-500">Time's Up!</h2>
          <p className="text-base sm:text-lg mb-6 text-gray-600">
            Don't give up! 💪<br />
            <span className="text-sm">Every champion was once a beginner!</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetLevel}
              className="px-4 sm:px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2D9AA5' }}
            >
              <RotateCcw size={16} />
              Try Again
            </button>
            <button
              onClick={backToMenu}
              className="px-4 sm:px-6 py-3 rounded-xl border-2 font-bold transition-all duration-300 hover:scale-105"
              style={{ borderColor: '#2D9AA5', color: '#2D9AA5' }}
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Game Screen
  const gridConfig = getGridConfig();
  
  return (
    <div className="min-h-screen p-2 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl animate-slide-down" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-0">
            <h1 className="text-lg sm:text-2xl font-bold" style={{ color: '#2D9AA5' }}>
              Level {currentLevel + 1}: {levels[currentLevel].name}
            </h1>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
              style={{ color: '#2D9AA5' }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="text-center">
              <div className="text-gray-500">Time</div>
              <div className={`text-base sm:text-lg font-bold transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 animate-pulse scale-110' : ''
              }`} style={{ color: timeLeft > 10 ? '#2D9AA5' : undefined }}>
                {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-500">Moves</div>
              <div className="text-base sm:text-lg font-bold" style={{ color: '#2D9AA5' }}>{moves}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-500">Calories</div>
              <div className="text-base sm:text-lg font-bold flex items-center justify-center gap-1" style={{ color: '#2D9AA5' }}>
                <Zap size={12} className="sm:w-4 sm:h-4" />
                {totalCalories}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-500">Score</div>
              <div className="text-base sm:text-lg font-bold" style={{ color: '#2D9AA5' }}>{score}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6 px-2">
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ 
                backgroundColor: '#2D9AA5',
                width: `${getProgress()}%`,
                boxShadow: '0 0 10px rgba(45, 154, 165, 0.5)'
              }}
            ></div>
          </div>
          <div className="text-center mt-2 text-xs sm:text-sm text-gray-600">
            {matchedPairs.length} / {levels[currentLevel].pairs} pairs matched
          </div>
        </div>

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-2xl sm:text-4xl font-bold text-green-500 animate-bounce-big">
              {recentMatch}
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className={`grid ${gridConfig.cols} ${gridConfig.gap} max-w-3xl mx-auto px-2 justify-items-center`}>
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 cursor-pointer transition-all duration-300 transform hover:scale-105 animate-card-appear"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleCardClick(card)}
            >
              <div
                className={`w-full h-full rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-center p-1 sm:p-2 border-2 transition-all duration-500 transform-gpu ${
                  card.isFlipped || card.isMatched
                    ? 'animate-flip-front shadow-lg'
                    : 'animate-flip-back hover:shadow-md'
                } ${card.isMatched ? 'animate-pulse-success' : ''}`}
                style={{
                  backgroundColor: card.isFlipped || card.isMatched ? '#ffffff' : '#2D9AA5',
                  borderColor: card.isMatched ? '#16a34a' : card.isFlipped ? '#2D9AA5' : 'transparent',
                  perspective: '1000px',
                  boxShadow: card.isMatched 
                    ? '0 0 20px rgba(22, 163, 74, 0.4)' 
                    : card.isFlipped 
                    ? '0 5px 15px rgba(45, 154, 165, 0.3)' 
                    : undefined
                }}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="animate-scale-in flex flex-col items-center justify-center h-full">
                    <div className="text-lg sm:text-xl md:text-2xl mb-1">{card.icon}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight text-center px-1">{card.name}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                      <Zap size={8} className="sm:w-2 sm:h-2" />
                      <span className="text-xs">{card.calories}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl md:text-3xl text-white animate-pulse">🏃</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 px-2">
          <button
            onClick={togglePause}
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
            style={{ backgroundColor: '#f59e0b' }}
          >
            <Pause size={16} />
            Pause
          </button>
          <button
            onClick={resetLevel}
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
            style={{ backgroundColor: '#2D9AA5' }}
          >
            <RotateCcw size={16} />
            Restart
          </button>
          <button
            onClick={backToMenu}
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
            style={{ borderColor: '#2D9AA5', color: '#2D9AA5' }}
          >
            <Home size={16} />
            Menu
          </button>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce-big {
          0%, 20%, 60%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-30px) scale(1.2); }
          80% { transform: translateY(-15px) scale(1.1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes flip-front {
          from { transform: rotateY(180deg); }
          to { transform: rotateY(0deg); }
        }
        
        @keyframes flip-back {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(0deg); }
        }
        
        @keyframes pulse-success {
          0%, 100% { box-shadow: 0 0 20px rgba(22, 163, 74, 0.4); }
          50% { box-shadow: 0 0 30px rgba(22, 163, 74, 0.8); }
        }
        
        @keyframes card-appear {
          from { opacity: 0; transform: scale(0.8) rotateY(180deg); }
          to { opacity: 1; transform: scale(1) rotateY(0deg); }
        }
        
        @keyframes star-burst {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        .animate-slide-down { animation: slide-down 0.5s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.8s ease-out; }
        .animate-bounce-big { animation: bounce-big 1s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-flip-front { animation: flip-front 0.6s ease-in-out; }
        .animate-flip-back { animation: flip-back 0.6s ease-in-out; }
        .animate-pulse-success { animation: pulse-success 2s infinite; }
        .animate-card-appear { animation: card-appear 0.5s ease-out; }
        .animate-star-burst { animation: star-burst 0.6s ease-out; }
        
        /* Responsive grid adjustments */
        @media (max-width: 640px) {
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        
        @media (min-width: 641px) {
          .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .sm\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .sm\\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        }
        
        /* Card flip effect */
        .transform-gpu {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Enhanced hover effects */
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        .hover\\:scale-110:hover {
          transform: scale(1.1);
        }
        
        .hover\\:-translate-y-1:hover {
          transform: translateY(-0.25rem);
        }
        
        /* Gradient text effect */
        .bg-gradient-to-r {
          background-image: linear-gradient(to right, var(--tw-gradient-stops));
        }
        
        .from-teal-600 {
          --tw-gradient-from: #0d9488;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(13, 148, 136, 0));
        }
        
        .to-cyan-600 {
          --tw-gradient-to: #0891b2;
        }
        
        .bg-clip-text {
          background-clip: text;
          -webkit-background-clip: text;
        }
        
        .text-transparent {
          color: transparent;
        }
        
        /* Additional responsive utilities */
        @media (max-width: 480px) {
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .text-5xl { font-size: 3rem; line-height: 1; }
        }
        
        @media (min-width: 1024px) {
          .lg\\:text-6xl { font-size: 3.75rem; line-height: 1; }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        
        /* Performance optimizations */
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #2D9AA5;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #1e6b73;
        }
        
        /* Focus states for accessibility */
        button:focus {
          outline: 2px solid #2D9AA5;
          outline-offset: 2px;
        }
        
        /* Touch device optimizations */
        @media (hover: none) {
          .hover\\:scale-105:hover {
            transform: none;
          }
          
          .hover\\:scale-110:hover {
            transform: none;
          }
          
          .hover\\:-translate-y-1:hover {
            transform: none;
          }
        }
        
        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FitnessMemoryGame;

FitnessMemoryGame.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};