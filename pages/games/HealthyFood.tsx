import React, { useState, useEffect, useCallback } from 'react';
import {Timer, RotateCcw, Zap, Target, Flame, Star } from 'lucide-react';

interface FoodItem {
  name: string;
  label: string;
  calories: number;
  nutrition?: number;
  rarity?: 'common' | 'rare' | 'legendary';
}

interface GridFood extends FoodItem {
  id: number;
  isHealthy: boolean;
  selected: boolean;
  nutrition: number;
  rarity: 'common' | 'rare' | 'legendary';
}

interface PowerUp {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  active: boolean;
}

type GameState = 'menu' | 'playing' | 'gameOver';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

function HealthyFoodPickerGame() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [gameGrid, setGameGrid] = useState<GridFood[]>([]);
  const [caloriesSaved, setCaloriesSaved] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [nutritionBonus, setNutritionBonus] = useState<number>(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [wrongSelections, setWrongSelections] = useState<number>(0);
  const [perfectStreak, setPerfectStreak] = useState<number>(0);

  // Enhanced food database
  const foodItems: { healthy: FoodItem[]; junk: FoodItem[] } = {
    healthy: [
      // Common healthy foods
      { name: '🥕', label: 'Carrot', calories: 25, nutrition: 8, rarity: 'common' },
      { name: '🥦', label: 'Broccoli', calories: 55, nutrition: 9, rarity: 'common' },
      { name: '🍎', label: 'Apple', calories: 80, nutrition: 7, rarity: 'common' },
      { name: '🍌', label: 'Banana', calories: 105, nutrition: 6, rarity: 'common' },
      { name: '🥬', label: 'Lettuce', calories: 10, nutrition: 5, rarity: 'common' },
      { name: '🍇', label: 'Grapes', calories: 60, nutrition: 6, rarity: 'common' },
      { name: '🥒', label: 'Cucumber', calories: 15, nutrition: 4, rarity: 'common' },
      { name: '🍊', label: 'Orange', calories: 65, nutrition: 8, rarity: 'common' },
      { name: '🍅', label: 'Tomato', calories: 18, nutrition: 6, rarity: 'common' },
      { name: '🥝', label: 'Kiwi', calories: 42, nutrition: 7, rarity: 'common' },
      
      // Rare healthy foods
      { name: '🫐', label: 'Blueberries', calories: 40, nutrition: 10, rarity: 'rare' },
      { name: '🥑', label: 'Avocado', calories: 120, nutrition: 12, rarity: 'rare' },
      { name: '🍑', label: 'Cherry', calories: 50, nutrition: 8, rarity: 'rare' },
      { name: '🍓', label: 'Strawberry', calories: 32, nutrition: 9, rarity: 'rare' },
      { name: '🥭', label: 'Mango', calories: 60, nutrition: 9, rarity: 'rare' },
      { name: '🍍', label: 'Pineapple', calories: 50, nutrition: 8, rarity: 'rare' },
      { name: '🥜', label: 'Almonds', calories: 85, nutrition: 11, rarity: 'rare' },
      { name: '🌰', label: 'Chestnuts', calories: 56, nutrition: 7, rarity: 'rare' },
      { name: '🫒', label: 'Olives', calories: 15, nutrition: 8, rarity: 'rare' },
      
      // Legendary healthy foods (Dubai specialties & superfoods)
      { name: '🥙', label: 'Quinoa Wrap', calories: 180, nutrition: 15, rarity: 'legendary' },
      { name: '🥗', label: 'Superfood Salad', calories: 150, nutrition: 18, rarity: 'legendary' },
      { name: '🧆', label: 'Baked Falafel', calories: 120, nutrition: 14, rarity: 'legendary' },
      { name: '🐟', label: 'Grilled Salmon', calories: 180, nutrition: 20, rarity: 'legendary' },
      { name: '🦐', label: 'Grilled Shrimp', calories: 85, nutrition: 16, rarity: 'legendary' },
      { name: '🌾', label: 'Ancient Grain Bowl', calories: 120, nutrition: 17, rarity: 'legendary' },
      { name: '🫘', label: 'Protein Beans', calories: 90, nutrition: 13, rarity: 'legendary' }
    ],
    junk: [
      // Common junk foods
      { name: '🍕', label: 'Pizza', calories: 300, nutrition: 0, rarity: 'common' },
      { name: '🍔', label: 'Burger', calories: 540, nutrition: 0, rarity: 'common' },
      { name: '🍟', label: 'Fries', calories: 365, nutrition: 0, rarity: 'common' },
      { name: '🌭', label: 'Hot Dog', calories: 290, nutrition: 0, rarity: 'common' },
      { name: '🍩', label: 'Donut', calories: 250, nutrition: 0, rarity: 'common' },
      { name: '🍪', label: 'Cookie', calories: 150, nutrition: 0, rarity: 'common' },
      { name: '🥤', label: 'Soda', calories: 140, nutrition: 0, rarity: 'common' },
      { name: '🍿', label: 'Buttery Popcorn', calories: 110, nutrition: 0, rarity: 'common' },
      
      // Rare junk foods (more tempting)
      { name: '🧁', label: 'Cupcake', calories: 200, nutrition: 0, rarity: 'rare' },
      { name: '🍫', label: 'Chocolate Bar', calories: 235, nutrition: 0, rarity: 'rare' },
      { name: '🍰', label: 'Cheesecake', calories: 320, nutrition: 0, rarity: 'rare' },
      { name: '🍦', label: 'Ice Cream', calories: 207, nutrition: 0, rarity: 'rare' },
      { name: '🥛', label: 'Milkshake', calories: 350, nutrition: 0, rarity: 'rare' },
      { name: '🥨', label: 'Soft Pretzel', calories: 380, nutrition: 0, rarity: 'rare' },
      
      // Legendary junk foods (Dubai luxury junk)
      { name: '🧇', label: 'Gold Waffle', calories: 290, nutrition: 0, rarity: 'legendary' },
      { name: '🌯', label: 'Loaded Shawarma', calories: 450, nutrition: 0, rarity: 'legendary' },
      { name: '🫓', label: 'Cheese Bomb Manakish', calories: 380, nutrition: 0, rarity: 'legendary' },
      { name: '🍜', label: 'Luxury Ramen', calories: 380, nutrition: 0, rarity: 'legendary' },
      { name: '🍝', label: 'Truffle Pasta', calories: 420, nutrition: 0, rarity: 'legendary' },
      { name: '🥟', label: 'Diamond Dumplings', calories: 280, nutrition: 0, rarity: 'legendary' }
    ]
  };

  // Difficulty settings
  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return { 
          gridSize: 12, 
          timeLimit: 60, 
          healthyRatio: 0.7, 
          pointMultiplier: 1, 
          penaltyMultiplier: 0.5,
          rareFoodChance: 0.1,
          legendaryFoodChance: 0.02
        };
      case 'medium':
        return { 
          gridSize: 16, 
          timeLimit: 45, 
          healthyRatio: 0.6, 
          pointMultiplier: 1.2, 
          penaltyMultiplier: 1,
          rareFoodChance: 0.15,
          legendaryFoodChance: 0.05
        };
      case 'hard':
        return { 
          gridSize: 20, 
          timeLimit: 35, 
          healthyRatio: 0.5, 
          pointMultiplier: 1.5, 
          penaltyMultiplier: 1.5,
          rareFoodChance: 0.2,
          legendaryFoodChance: 0.08
        };
      case 'expert':
        return { 
          gridSize: 25, 
          timeLimit: 30, 
          healthyRatio: 0.4, 
          pointMultiplier: 2, 
          penaltyMultiplier: 2,
          rareFoodChance: 0.25,
          legendaryFoodChance: 0.12
        };
    }
  };

  // Enhanced grid generation with rarity system
  const generateGrid = useCallback(() => {
    const grid: GridFood[] = [];
    const settings = getDifficultySettings(difficulty);
    
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const selectFoodByRarity = (foods: FoodItem[], isHealthy: boolean) => {
      const rand = Math.random();
      let targetRarity: 'common' | 'rare' | 'legendary';
      
      if (rand < settings.legendaryFoodChance) {
        targetRarity = 'legendary';
      } else if (rand < settings.rareFoodChance) {
        targetRarity = 'rare';
      } else {
        targetRarity = 'common';
      }
      
      const rarityFoods = foods.filter(f => (f.rarity || 'common') === targetRarity);
      if (rarityFoods.length === 0) {
        return foods[Math.floor(Math.random() * foods.length)];
      }
      
      return rarityFoods[Math.floor(Math.random() * rarityFoods.length)];
    };
    
    for (let i = 0; i < settings.gridSize; i++) {
      const shouldBeHealthy = Math.random() < settings.healthyRatio;
      const foodPool = shouldBeHealthy ? foodItems.healthy : foodItems.junk;
      const selectedFood = selectFoodByRarity(foodPool, shouldBeHealthy);
      
      grid.push({
        id: i,
        ...selectedFood,
        nutrition: selectedFood.nutrition || 0,
        rarity: selectedFood.rarity || 'common',
        isHealthy: shouldBeHealthy,
        selected: false
      });
    }
    
    return shuffleArray(grid).map((item, index) => ({
      ...item,
      id: index
    }));
  }, [difficulty]);

  // Enhanced scoring system
  const calculatePoints = (food: GridFood, isCorrect: boolean): number => {
    const settings = getDifficultySettings(difficulty);
    let basePoints = isCorrect ? 10 : -8;
    
    // Rarity multipliers
    const rarityMultiplier = food.rarity === 'legendary' ? 3 : food.rarity === 'rare' ? 2 : 1;
    
    // Combo multiplier
    const comboMultiplier = Math.min(combo * 0.1 + 1, 3);
    
    // Nutrition bonus for healthy foods
    const nutritionMultiplier = isCorrect && food.isHealthy ? (1 + food.nutrition * 0.05) : 1;
    
    return Math.round(basePoints * settings.pointMultiplier * rarityMultiplier * comboMultiplier * nutritionMultiplier);
  };

  // Start game with difficulty
  const startGame = () => {
    const settings = getDifficultySettings(difficulty);
    setGameState('playing');
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setSelectedFoods(new Set());
    setCaloriesSaved(0);
    setHealthScore(100);
    setCombo(0);
    setMaxCombo(0);
    setLevel(1);
    setNutritionBonus(0);
    setPowerUps([]);
    setWrongSelections(0);
    setPerfectStreak(0);
    setGameGrid(generateGrid());
  };

  // Enhanced food selection logic
  const selectFood = (foodId: number) => {
    if (gameState !== 'playing' || selectedFoods.has(foodId)) return;

    const food = gameGrid.find(f => f.id === foodId);
    if (!food) return;

    const newSelectedFoods = new Set(selectedFoods);
    newSelectedFoods.add(foodId);
    setSelectedFoods(newSelectedFoods);

    const isCorrect = food.isHealthy;
    const points = calculatePoints(food, isCorrect);

    if (isCorrect) {
      // Correct selection
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, combo + 1));
      setCaloriesSaved(prev => prev + (400 - food.calories));
      setHealthScore(prev => Math.min(100, prev + 3));
      setNutritionBonus(prev => prev + food.nutrition);
      setPerfectStreak(prev => prev + 1);
      
      // Level up every 10 correct selections
      if ((perfectStreak + 1) % 10 === 0) {
        setLevel(prev => prev + 1);
      }
    } else {
      // Wrong selection
      const settings = getDifficultySettings(difficulty);
      setScore(prev => Math.max(0, prev + Math.round(points * settings.penaltyMultiplier)));
      setCombo(0);
      setHealthScore(prev => Math.max(0, prev - 15));
      setWrongSelections(prev => prev + 1);
      setPerfectStreak(0);
      
      // Penalty: lose time on harder difficulties
      if (difficulty === 'hard' || difficulty === 'expert') {
        setTimeLeft(prev => Math.max(0, prev - 2));
      }
    }
  };

  // Enhanced timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [gameState, timeLeft]);

  // Calculate comprehensive stats
  const healthySelected = gameGrid.filter(food => 
    selectedFoods.has(food.id) && food.isHealthy
  ).length;
  
  const totalHealthy = gameGrid.filter(food => food.isHealthy).length;
  const accuracy = totalHealthy > 0 ? Math.round((healthySelected / totalHealthy) * 100) : 0;
  
  const legendaryFound = gameGrid.filter(food => 
    selectedFoods.has(food.id) && food.rarity === 'legendary' && food.isHealthy
  ).length;

  // Enhanced performance evaluation
  const getPerformanceMessage = (score: number, accuracy: number, maxCombo: number, level: number) => {
    const totalScore = score + (accuracy * 2) + (maxCombo * 5) + (level * 10);
    
    if (totalScore < 50) {
      return {
        title: "Learning Phase 🌱",
        message: "Keep practicing! Focus on colorful fruits and vegetables. Avoid processed foods with high calories.",
        color: "text-red-600",
        bgColor: "bg-red-100",
        emoji: "📚"
      };
    } else if (totalScore < 150) {
      return {
        title: "Health Enthusiast 💪",
        message: "Good progress! You're starting to recognize healthy foods. Try to build longer combos!",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        emoji: "🌟"
      };
    } else if (totalScore < 300) {
      return {
        title: "Nutrition Detective 🕵️",
        message: "Great work! You clearly understand healthy eating. Keep hunting for those legendary superfoods!",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        emoji: "🎯"
      };
    } else if (totalScore < 500) {
      return {
        title: "Health Champion 🏆",
        message: "Excellent! You're a master of nutrition. Dubai's restaurants would love your expertise!",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        emoji: "⭐"
      };
    } else if (totalScore < 750) {
      return {
        title: "Superfood Master 👑",
        message: "Outstanding performance! You've achieved nutritional enlightenment. You're ready to teach others!",
        color: "text-green-600",
        bgColor: "bg-green-100",
        emoji: "🔥"
      };
    } else {
      return {
        title: "Legendary Nutritionist 🌟",
        message: "INCREDIBLE! You've reached legendary status! Your food wisdom is unmatched across all of Dubai!",
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        emoji: "💎"
      };
    }
  };

  const performanceData = getPerformanceMessage(score, accuracy, maxCombo, level);
  const gridSize = getDifficultySettings(difficulty).gridSize;
  const columns = Math.ceil(Math.sqrt(gridSize));

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated Background */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom right, #2D9AA5, #246b73, #1a4f56)'}}></div>
                
        {/* Floating Food Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <span className="text-4xl">
                {['🍎', '🥕', '🥦', '🍌', '🫐', '🥑', '🍊', '🍇'][Math.floor(Math.random() * 8)]}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md w-full relative z-10 border border-white border-opacity-20">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Enhanced Healthy Food Picker</h1>
            <p className="text-gray-600">Advanced nutrition game with power-ups and combos!</p>
          </div>
                      
          {/* Difficulty Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-black">Choose Difficulty:</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    difficulty === diff
                      ? 'text-white transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={difficulty === diff ? {backgroundColor: '#2D9AA5'} : {}}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
                      
          <div className="mb-6 space-y-2 text-sm text-gray-700">
            <p>🌟 Build combos for bonus points</p>
            <p>💎 Find legendary superfoods</p>
            <p>🇦🇪 Features Dubai's premium cuisine!</p>
          </div>
                      
          <button
            onClick={startGame}
            className="text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden group"
            style={{background: `linear-gradient(to right, #2D9AA5, #246b73)`}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #3aafbb, #2a7d86)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #2D9AA5, #246b73)';
            }}
          >
            <span className="relative z-10">Start Game</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-6 xl:p-8">
        {/* Victory Background Animation */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom right, #2D9AA5, #246b73, #1a4f56)'}}></div>
        
        {/* Celebration Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            >
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
                {['🏆', '⭐', '🎉', '💎', '🔥', '✨', '🌟'][Math.floor(Math.random() * 7)]}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content Container */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl relative z-10 border border-white border-opacity-30 mx-2">
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Game Complete!
          </h2>
          
          {/* Performance Card */}
          <div className={`${performanceData.bgColor} p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4`}>
            <div className="text-2xl sm:text-3xl md:text-4xl mb-2">{performanceData.emoji}</div>
            <h3 className={`text-base sm:text-lg md:text-xl font-bold ${performanceData.color} mb-2`}>
              {performanceData.title}
            </h3>
            <p className={`${performanceData.color} text-xs sm:text-sm`}>
              {performanceData.message}
            </p>
          </div>
          
          {/* Stats Section */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {/* Main Score */}
            <div className="bg-green-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-800">{score} Points</p>
              <p className="text-xs sm:text-sm text-green-600">Final Score • Level {level}</p>
            </div>
            
            {/* Two-column stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <p className="text-base sm:text-lg md:text-xl font-bold text-blue-800">{maxCombo}x</p>
                <p className="text-xs sm:text-sm text-blue-600">Max Combo</p>
              </div>
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <p className="text-base sm:text-lg md:text-xl font-bold text-purple-800">{nutritionBonus}</p>
                <p className="text-xs sm:text-sm text-purple-600">Nutrition Pts</p>
              </div>
            </div>
            
            {/* Three-column stats */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              <div className="bg-yellow-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
                <p className="text-sm sm:text-base md:text-lg font-bold text-yellow-800">{accuracy}%</p>
                <p className="text-xs text-yellow-600">Accuracy</p>
              </div>
              <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
                <p className="text-sm sm:text-base md:text-lg font-bold text-indigo-800">{legendaryFound}</p>
                <p className="text-xs text-indigo-600">Legendary</p>
              </div>
              <div className="bg-pink-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
                <p className="text-sm sm:text-base md:text-lg font-bold text-pink-800">{caloriesSaved}</p>
                <p className="text-xs text-pink-600">Cal Saved</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={startGame}
              className="w-full text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transform hover:scale-105 transition-all duration-200"
              style={{background: 'linear-gradient(to right, #2D9AA5, #246b73)'}}
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Play Again
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="w-full bg-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-gray-600 transition-colors duration-200"
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING STATE - This was missing!
  return (
    <div className="min-h-screen relative overflow-hidden p-2 sm:p-4">
      {/* Game Background */}
      <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom right, #2D9AA5, #246b73, #1a4f56)'}}></div>
      
      {/* Floating particles during gameplay */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <span className="text-2xl">
              {['🍎', '🥕', '🥦', '🍌'][Math.floor(Math.random() * 4)]}
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header Stats */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 text-center">
            {/* Timer */}
            <div className="bg-red-100 p-2 sm:p-3 rounded-lg">
              <Timer className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-red-600" />
              <p className="text-lg sm:text-xl font-bold text-red-800">{timeLeft}s</p>
              <p className="text-xs text-red-600">Time</p>
            </div>
            
            {/* Score */}
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-green-600" />
              <p className="text-lg sm:text-xl font-bold text-green-800">{score}</p>
              <p className="text-xs text-green-600">Score</p>
            </div>
            
            {/* Combo */}
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-blue-600" />
              <p className="text-lg sm:text-xl font-bold text-blue-800">{combo}x</p>
              <p className="text-xs text-blue-600">Combo</p>
            </div>
            
            {/* Level */}
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-purple-600" />
              <p className="text-lg sm:text-xl font-bold text-purple-800">{level}</p>
              <p className="text-xs text-purple-600">Level</p>
            </div>
            
            {/* Health Score */}
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg">
              <div className="text-yellow-600 mx-auto mb-1">❤️</div>
              <p className="text-lg sm:text-xl font-bold text-yellow-800">{healthScore}</p>
              <p className="text-xs text-yellow-600">Health</p>
            </div>
            
            {/* Calories Saved */}
            <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg">
              <div className="text-indigo-600 mx-auto mb-1">🔥</div>
              <p className="text-lg sm:text-xl font-bold text-indigo-800">{caloriesSaved}</p>
              <p className="text-xs text-indigo-600">Cal Saved</p>
            </div>
            
            {/* Nutrition Bonus */}
            <div className="bg-pink-100 p-2 sm:p-3 rounded-lg">
              <div className="text-pink-600 mx-auto mb-1">⚡</div>
              <p className="text-lg sm:text-xl font-bold text-pink-800">{nutritionBonus}</p>
              <p className="text-xs text-pink-600">Nutrition</p>
            </div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-3 mb-4 text-center">
          <p className="text-sm sm:text-base text-gray-700">
            🎯 Click on <span className="font-bold text-green-600">HEALTHY FOODS</span> to earn points! 
            Avoid junk food. Build combos for bonus points!
          </p>
        </div>

        {/* Food Grid */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-4">
          <div 
            className="grid gap-1 md:gap-1.5 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8"
            style={{ maxHeight: '60vh' }}
          >
            {gameGrid.map((food) => {
              const isSelected = selectedFoods.has(food.id);
              const rarityBorder = food.rarity === 'legendary' ? 'border-2 border-yellow-400 shadow-md' :
                                 food.rarity === 'rare' ? 'border border-purple-400' :
                                 'border border-gray-200';
              
              const selectionStyle = isSelected 
                ? food.isHealthy 
                  ? 'bg-green-100 border-green-400 scale-95' 
                  : 'bg-red-100 border-red-400 scale-95'
                : 'bg-white hover:bg-gray-100';

              return (
                <button
                  key={food.id}
                  onClick={() => selectFood(food.id)}
                  disabled={isSelected}
                  className={`
                    flex flex-col items-center justify-center
                    p-1 md:p-0.5
                    rounded-lg shadow-sm
                    min-h-[36px] max-h-[48px] min-w-[36px] max-w-[70px]
                    text-[10px] md:text-[9px] leading-tight
                    transition
                    ${rarityBorder} ${selectionStyle}
                    ${isSelected ? 'cursor-not-allowed opacity-70' : 'hover:shadow-md'}
                  `}
                  style={{ height: '48px', width: '70px', opacity: isSelected ? 0.7 : 1 }}
                >
                  {/* Rarity indicator */}
                  {food.rarity === 'legendary' && (
                    <div className="absolute top-0 right-0 text-[10px] bg-yellow-400 text-yellow-900 px-0.5 rounded font-bold">
                      ⭐
                    </div>
                  )}
                  {food.rarity === 'rare' && (
                    <div className="absolute top-0 right-0 text-[10px] bg-purple-400 text-purple-900 px-0.5 rounded font-bold">
                      💎
                    </div>
                  )}
                  
                  {/* Food emoji */}
                  <span className="text-lg md:text-base mb-0.5">{food.name}</span>
                  
                  {/* Food label */}
                  <span className="truncate w-full text-center">{food.label}</span>
                  
                  {/* Calories */}
                  <span className="text-[9px] text-gray-500">{food.calories} cal</span>
                  
                  {/* Selection feedback */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-xl">
                      <span className="text-2xl">
                        {food.isHealthy ? '✅' : '❌'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {selectedFoods.size} / {gameGrid.length} foods selected
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(selectedFoods.size / gameGrid.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthyFoodPickerGame;

HealthyFoodPickerGame.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};
