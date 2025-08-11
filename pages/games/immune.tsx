import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Star, Shield, Heart, Zap, ChevronRight } from 'lucide-react';

const ImmunityBuilderGame = () => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [matches, setMatches] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameStarted, setGameStarted] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [streak, setStreak] = useState(0);
  const [wrongMatches, setWrongMatches] = useState([]);
  const [currentLevelComplete, setCurrentLevelComplete] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Level configurations
  const levelConfigs = [
    {
      level: 1,
      timeLimit: 90,
      vitamins: ['vitamin-c', 'vitamin-d', 'zinc'],
      benefits: ['immune-support', 'bone-health', 'wound-healing'],
      title: "Immunity Basics"
    },
    {
      level: 2,
      timeLimit: 80,
      vitamins: ['vitamin-c', 'vitamin-d', 'zinc', 'vitamin-e'],
      benefits: ['immune-support', 'bone-health', 'antioxidant', 'wound-healing'],
      title: "Antioxidant Power"
    },
    {
      level: 3,
      timeLimit: 70,
      vitamins: ['vitamin-c', 'vitamin-d', 'zinc', 'vitamin-e', 'selenium', 'iron'],
      benefits: ['immune-support', 'bone-health', 'antioxidant', 'wound-healing', 'energy-metabolism', 'cell-protection'],
      title: "Complete Immunity"
    }
  ];

  const allVitamins = [
    { 
      id: 'vitamin-c', 
      name: 'Vitamin C', 
      icon: '🍊', 
      color: '#FF6B35'
    },
    { 
      id: 'vitamin-d', 
      name: 'Vitamin D', 
      icon: '☀️', 
      color: '#FFD23F'
    },
    { 
      id: 'zinc', 
      name: 'Zinc', 
      icon: '⚡', 
      color: '#8B5A3C'
    },
    { 
      id: 'vitamin-e', 
      name: 'Vitamin E', 
      icon: '🌰', 
      color: '#A0522D'
    },
    { 
      id: 'selenium', 
      name: 'Selenium', 
      icon: '🐟', 
      color: '#4682B4'
    },
    { 
      id: 'iron', 
      name: 'Iron', 
      icon: '🥩', 
      color: '#B22222'
    }
  ];

  const allBenefits = [
    { 
      id: 'immune-support', 
      name: 'Immune Support', 
      icon: <Shield className="w-5 h-5" />, 
      matches: ['vitamin-c', 'zinc', 'vitamin-d']
    },
    { 
      id: 'bone-health', 
      name: 'Bone Health', 
      icon: '🦴', 
      matches: ['vitamin-d']
    },
    { 
      id: 'antioxidant', 
      name: 'Antioxidant', 
      icon: <Star className="w-5 h-5" />, 
      matches: ['vitamin-c', 'vitamin-e', 'selenium']
    },
    { 
      id: 'wound-healing', 
      name: 'Wound Healing', 
      icon: <Heart className="w-5 h-5" />, 
      matches: ['vitamin-c', 'zinc']
    },
    { 
      id: 'energy-metabolism', 
      name: 'Energy Boost', 
      icon: <Zap className="w-5 h-5" />, 
      matches: ['iron', 'zinc']
    },
    { 
      id: 'cell-protection', 
      name: 'Cell Shield', 
      icon: '🛡️', 
      matches: ['vitamin-e', 'selenium']
    }
  ];

  // Get current level data
  const currentConfig = levelConfigs[level - 1];
  const vitamins = allVitamins.filter(v => currentConfig.vitamins.includes(v.id));
  const benefits = allBenefits.filter(b => currentConfig.benefits.includes(b.id));

  // Timer effect
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !currentLevelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameComplete(true);
    }
  }, [gameStarted, timeLeft, gameComplete, currentLevelComplete]);

  const handleDragStart = (e, vitamin) => {
    setDraggedItem(vitamin);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, benefitId) => {
    e.preventDefault();
    if (benefitId) {
      setDragOverTarget(benefitId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e, benefit) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (!draggedItem || !gameStarted) return;

    const matchKey = `${draggedItem.id}-${benefit.id}`;
    
    if (matches.includes(matchKey)) {
      return;
    }

    if (benefit.matches.includes(draggedItem.id)) {
      // Correct match
      setMatches(prev => [...prev, matchKey]);
      setScore(prev => prev + (150 * multiplier * level));
      setStreak(prev => prev + 1);
      
      if (streak > 0 && streak % 2 === 1) {
        setMultiplier(prev => Math.min(prev + 0.5, 4));
      }
      
      // Check if level complete
      const totalPossibleMatches = benefits.reduce((acc, b) => acc + b.matches.length, 0);
      if (matches.length + 1 >= totalPossibleMatches) {
        setCurrentLevelComplete(true);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }
    } else {
      // Wrong match
      setWrongMatches(prev => [...prev, matchKey]);
      setStreak(0);
      setMultiplier(1);
      setTimeout(() => {
        setWrongMatches(prev => prev.filter(m => m !== matchKey));
      }, 800);
    }
    
    setDraggedItem(null);
  };

  const nextLevel = () => {
    if (level < levelConfigs.length) {
      setLevel(prev => prev + 1);
      setMatches([]);
      setCurrentLevelComplete(false);
      setTimeLeft(levelConfigs[level].timeLimit);
      setMultiplier(1);
      setStreak(0);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setMatches([]);
    setGameComplete(false);
    setCurrentLevelComplete(false);
    setShowCelebration(false);
    setTimeLeft(levelConfigs[0].timeLimit);
    setGameStarted(false);
    setMultiplier(1);
    setStreak(0);
    setWrongMatches([]);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const isMatched = (vitaminId, benefitId) => {
    return matches.includes(`${vitaminId}-${benefitId}`);
  };

  const isWrongMatch = (vitaminId, benefitId) => {
    return wrongMatches.includes(`${vitaminId}-${benefitId}`);
  };

  const getProgress = () => {
    const totalPossibleMatches = benefits.reduce((acc, b) => acc + b.matches.length, 0);
    return totalPossibleMatches > 0 ? (matches.length / totalPossibleMatches) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Clean Header */}
        <div className="bg-[#2D9AA5] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🧬 Immunity Builder
              </h1>
              <p className="text-sm opacity-90 mt-1">Level {level}: {currentConfig.title}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xl font-bold">{score}</div>
                <div className="text-xs opacity-80">Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{timeLeft}s</div>
                <div className="text-xs opacity-80">Time</div>
              </div>
              {multiplier > 1 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-300">×{multiplier}</div>
                  <div className="text-xs opacity-80">Bonus</div>
                </div>
              )}
              <button
                onClick={resetGame}
                className="bg-white text-[#2D9AA5] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Game Start Screen */}
        {!gameStarted && (
          <div className="flex items-center justify-center p-16">
            <div className="text-center max-w-md">
              <div className="text-8xl mb-6">🧬</div>
              <h2 className="text-3xl font-bold text-[#2D9AA5] mb-4">
                Build Your Immunity Knowledge
              </h2>
              <p className="text-black mb-8">
                Match vitamins to their health benefits across 3 challenging levels
              </p>
              <button
                onClick={startGame}
                className="bg-[#2D9AA5] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#1E7A85] transform hover:scale-105 transition-all duration-200"
              >
                Start Level 1
              </button>
            </div>
          </div>
        )}

        {/* Level Complete Screen */}
        {currentLevelComplete && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#2D9AA5] mb-4">Level {level} Complete!</h2>
              <p className="text-black text-lg mb-6">Great job! Ready for the next challenge?</p>
              {level < levelConfigs.length ? (
                <button
                  onClick={nextLevel}
                  className="bg-[#2D9AA5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1E7A85] transition-colors w-full flex items-center justify-center gap-2"
                >
                  Next Level <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div>
                  <p className="text-green-600 font-bold mb-4">🎉 All Levels Complete!</p>
                  <button
                    onClick={resetGame}
                    className="bg-[#2D9AA5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1E7A85] transition-colors w-full"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Complete Screen */}
        {gameComplete && gameStarted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#2D9AA5] mb-4">Game Over!</h2>
              <p className="text-black text-lg mb-6">Final Score: <span className="font-bold text-[#2D9AA5]">{score}</span></p>
              <button
                onClick={resetGame}
                className="bg-[#2D9AA5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1E7A85] transition-colors w-full"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Celebration Effect */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        {/* Game Board - Clean & Simple */}
        {gameStarted && !gameComplete && (
          <div className="p-8">
            <div className="grid grid-cols-2 gap-12">
              
              {/* Vitamins Side */}
              <div>
                <h3 className="text-xl font-bold text-[#2D9AA5] mb-6 text-center">
                  Vitamins & Minerals
                </h3>
                <div className="space-y-4">
                  {vitamins.map(vitamin => (
                    <div
                      key={vitamin.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, vitamin)}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 cursor-move hover:border-[#2D9AA5] hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-4"
                    >
                      <div className="text-3xl">{vitamin.icon}</div>
                      <div>
                        <div className="font-semibold text-black">{vitamin.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits Side */}
              <div>
                <h3 className="text-xl font-bold text-[#2D9AA5] mb-6 text-center">
                  Health Benefits
                </h3>
                <div className="space-y-4">
                  {benefits.map(benefit => (
                    <div
                      key={benefit.id}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, benefit.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, benefit)}
                      className={`
                        bg-gradient-to-r from-[#2D9AA5] to-[#1E7A85] text-white rounded-xl p-4 min-h-[80px] flex items-center gap-4 transition-all duration-200
                        ${dragOverTarget === benefit.id ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''}
                        hover:shadow-lg
                      `}
                    >
                      <div className="text-2xl">
                        {typeof benefit.icon === 'string' ? benefit.icon : benefit.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{benefit.name}</div>
                        
                        {/* Show matched vitamins */}
                        <div className="flex gap-2 mt-2">
                          {benefit.matches.map(matchId => {
                            const vitamin = allVitamins.find(v => v.id === matchId);
                            const matched = isMatched(matchId, benefit.id);
                            const wrongMatch = isWrongMatch(matchId, benefit.id);
                            
                            if (matched) {
                              return (
                                <div key={matchId} className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <span>{vitamin.icon}</span>
                                </div>
                              );
                            } else if (wrongMatch) {
                              return (
                                <div key={`wrong-${matchId}`} className="bg-red-500 text-xs px-2 py-1 rounded-full animate-pulse">
                                  ❌
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Instructions */}
            <div className="mt-8 text-center">
              <p className="text-black opacity-70">
                Drag vitamins to their matching benefits • Build streaks for bonus points
              </p>
              {streak > 1 && (
                <div className="mt-2">
                  <span className="bg-yellow-100 text-[#2D9AA5] px-3 py-1 rounded-full text-sm font-semibold">
                    🔥 {streak} Streak Active!
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImmunityBuilderGame;
ImmunityBuilderGame.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}