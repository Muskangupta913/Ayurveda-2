import React, { useState } from 'react'
import { Plus, Trash2, Calculator, Search, Target, TrendingUp } from 'lucide-react';

interface Food {
  name: string;
  portion: number;
}

interface ConsumedFood extends Food {
  calories: number;
  id: number;
}

function CalorieCounter() {
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [consumedFoods, setConsumedFoods] = useState<ConsumedFood[]>([]);

  const uaeFoods: Record<string, { calories: number; emoji: string; category: string }> = {
    // Traditional UAE/Middle Eastern
    'Hummus (100g)': { calories: 166, emoji: '🧄', category: 'Traditional' },
    'Shawarma Chicken': { calories: 300, emoji: '🌯', category: 'Traditional' },
    'Shawarma Lamb': { calories: 400, emoji: '🥙', category: 'Traditional' },
    'Falafel (5 pieces)': { calories: 333, emoji: '🧆', category: 'Traditional' },
    'Kabsa (1 cup)': { calories: 350, emoji: '🍛', category: 'Traditional' },
    'Machboos (1 cup)': { calories: 380, emoji: '🍚', category: 'Traditional' },
    'Manakish Zaatar': { calories: 280, emoji: '🫓', category: 'Traditional' },
    'Luqaimat (5 pieces)': { calories: 250, emoji: '🍯', category: 'Traditional' },
    'Arabic Bread': { calories: 80, emoji: '🥖', category: 'Traditional' },
    'Khubz': { calories: 75, emoji: '🍞', category: 'Traditional' },
    'Mandi Chicken': { calories: 420, emoji: '🍗', category: 'Traditional' },
    'Ouzi (1 serving)': { calories: 480, emoji: '🍖', category: 'Traditional' },
    'Stuffed Grape Leaves': { calories: 150, emoji: '🍃', category: 'Traditional' },
    'Tabbouleh (1 cup)': { calories: 120, emoji: '🥗', category: 'Traditional' },
    'Fattoush (1 cup)': { calories: 140, emoji: '🥙', category: 'Traditional' },
    'Baba Ganoush (100g)': { calories: 130, emoji: '🍆', category: 'Traditional' },
    'Knafeh (1 piece)': { calories: 350, emoji: '🧀', category: 'Traditional' },
    'Baklava (1 piece)': { calories: 245, emoji: '🥮', category: 'Traditional' },
    'Maamoul (3 pieces)': { calories: 180, emoji: '🍪', category: 'Traditional' },
    
    // Popular in UAE/Dubai
    'Biryani (1 cup)': { calories: 400, emoji: '🍛', category: 'Popular' },
    'Curry Chicken': { calories: 320, emoji: '🍛', category: 'Popular' },
    'Dal (1 cup)': { calories: 230, emoji: '🟡', category: 'Popular' },
    'Naan Bread': { calories: 260, emoji: '🫓', category: 'Popular' },
    'Samosa (1 piece)': { calories: 91, emoji: '🥟', category: 'Popular' },
    'Tikka Masala': { calories: 350, emoji: '🍖', category: 'Popular' },
    'Butter Chicken': { calories: 380, emoji: '🍗', category: 'Popular' },
    'Tandoori Chicken': { calories: 280, emoji: '🍗', category: 'Popular' },
    'Roti (1 piece)': { calories: 120, emoji: '🫓', category: 'Popular' },
    'Fish Curry': { calories: 290, emoji: '🐟', category: 'Popular' },
    'Mutton Curry': { calories: 450, emoji: '🍖', category: 'Popular' },
    'Palak Paneer': { calories: 320, emoji: '🟢', category: 'Popular' },
    'Rajma (1 cup)': { calories: 270, emoji: '🫘', category: 'Popular' },
    'Chole (1 cup)': { calories: 290, emoji: '🫛', category: 'Popular' },
    'Paratha (1 piece)': { calories: 300, emoji: '🫓', category: 'Popular' },
    'Lassi (1 glass)': { calories: 180, emoji: '🥛', category: 'Beverages' },
    
    // Beverages
    'Arabic Coffee': { calories: 5, emoji: '☕', category: 'Beverages' },
    'Karak Tea': { calories: 120, emoji: '🍵', category: 'Beverages' },
    'Fresh Orange Juice': { calories: 110, emoji: '🍊', category: 'Beverages' },
    'Laban': { calories: 150, emoji: '🥛', category: 'Beverages' },
    'Date Milkshake': { calories: 280, emoji: '🥤', category: 'Beverages' },
    'Mango Lassi': { calories: 200, emoji: '🥭', category: 'Beverages' },
    'Coffee (Black)': { calories: 5, emoji: '☕', category: 'Beverages' },
    'Cappuccino': { calories: 120, emoji: '☕', category: 'Beverages' },
    'Latte': { calories: 190, emoji: '☕', category: 'Beverages' },
    'Coca Cola (12oz)': { calories: 140, emoji: '🥤', category: 'Beverages' },
    'Fresh Lime Soda': { calories: 80, emoji: '🍋', category: 'Beverages' },
    'Smoothie (Berry)': { calories: 180, emoji: '🫐', category: 'Beverages' },
    'Green Tea': { calories: 2, emoji: '🍵', category: 'Beverages' },
    'Iced Tea': { calories: 70, emoji: '🧊', category: 'Beverages' },
    
    // Fruits & Snacks
    'Dates (5 pieces)': { calories: 100, emoji: '🟫', category: 'Snacks' },
    'Banana': { calories: 105, emoji: '🍌', category: 'Snacks' },
    'Apple': { calories: 80, emoji: '🍎', category: 'Snacks' },
    'Mango': { calories: 135, emoji: '🥭', category: 'Snacks' },
    'Pomegranate': { calories: 134, emoji: '🔴', category: 'Snacks' },
    'Orange': { calories: 65, emoji: '🍊', category: 'Snacks' },
    'Grapes (1 cup)': { calories: 104, emoji: '🍇', category: 'Snacks' },
    'Watermelon (1 cup)': { calories: 46, emoji: '🍉', category: 'Snacks' },
    'Pineapple (1 cup)': { calories: 82, emoji: '🍍', category: 'Snacks' },
    'Almonds (10 pieces)': { calories: 70, emoji: '🥜', category: 'Snacks' },
    'Cashews (10 pieces)': { calories: 90, emoji: '🥜', category: 'Snacks' },
    'Pistachios (10 pieces)': { calories: 40, emoji: '🥜', category: 'Snacks' },
    'Mixed Nuts (1 oz)': { calories: 170, emoji: '🥜', category: 'Snacks' },
    'Popcorn (1 cup)': { calories: 31, emoji: '🍿', category: 'Snacks' },
    'Chips (1 oz)': { calories: 150, emoji: '🥔', category: 'Snacks' },
    
    // International
    'Pizza Slice': { calories: 285, emoji: '🍕', category: 'International' },
    'Burger': { calories: 540, emoji: '🍔', category: 'International' },
    'Pasta (1 cup)': { calories: 220, emoji: '🍝', category: 'International' },
    'Sushi Roll (8 pieces)': { calories: 300, emoji: '🍣', category: 'International' },
    'Fried Rice': { calories: 380, emoji: '🍚', category: 'International' },
    'Pad Thai': { calories: 400, emoji: '🍜', category: 'International' },
    'Tacos (2 pieces)': { calories: 380, emoji: '🌮', category: 'International' },
    'French Fries (Medium)': { calories: 365, emoji: '🍟', category: 'International' },
  };

  const addFood = (): void => {
    if (selectedFoods.length > 0) {
      const newFoods: ConsumedFood[] = selectedFoods.map((food: Food, index: number) => ({
        name: food.name,
        portion: food.portion,
        calories: Math.round(uaeFoods[food.name].calories * food.portion),
        id: Date.now() + index
      }));
      setConsumedFoods((prev: ConsumedFood[]) => [...prev, ...newFoods]);
      setSelectedFoods([]);
    }
  };

  const toggleFood = (foodName: string): void => {
    const exists = selectedFoods.find((f: Food) => f.name === foodName);
    if (exists) {
      setSelectedFoods((prev: Food[]) => prev.filter((f: Food) => f.name !== foodName));
    } else {
      setSelectedFoods((prev: Food[]) => [...prev, { name: foodName, portion: 1 }]);
    }
  };

  const updatePortion = (foodName: string, portionValue: string): void => {
    const portion = parseFloat(portionValue) || 1;
    setSelectedFoods((prev: Food[]) => prev.map((f: Food) => 
      f.name === foodName ? { ...f, portion } : f
    ));
  };

  const removeFood = (id: number): void => {
    setConsumedFoods((prev: ConsumedFood[]) => prev.filter((food: ConsumedFood) => food.id !== id));
  };

  const filteredFoods: string[] = Object.keys(uaeFoods).filter((food: string) =>
    food.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalories: number = consumedFoods.reduce((sum: number, food: ConsumedFood) => sum + food.calories, 0);

  // Group foods by category for better organization
  const groupedFoods = filteredFoods.reduce((acc, food) => {
    const category = uaeFoods[food].category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(food);
    return acc;
  }, {} as Record<string, string[]>);

  const getCalorieStatus = (calories: number) => {
    if (calories < 500) return { status: 'Light', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (calories < 1500) return { status: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (calories < 2500) return { status: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'Very High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const calorieStatus = getCalorieStatus(totalCalories);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/6 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-2xl mb-6 shadow-lg">
              <Calculator className="text-white" size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent mb-4">
              Calorie Counter
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Track your daily nutrition intake with precision and style
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-cyan-600/10 to-cyan-400/10 backdrop-blur-xl border border-cyan-600/20 rounded-2xl p-6 text-center">
              <Target className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{totalCalories}</div>
              <div className="text-sm text-slate-400">Total Calories</div>
            </div>
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{consumedFoods.length}</div>
              <div className="text-sm text-slate-400">Foods Logged</div>
            </div>
            <div className={`backdrop-blur-xl border rounded-2xl p-6 text-center ${calorieStatus.bgColor} border-opacity-20`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-400 to-slate-300 mx-auto mb-2 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">%</span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${calorieStatus.color}`}>{calorieStatus.status}</div>
              <div className="text-sm text-slate-600">Intake Level</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Left Side - Food Selection */}
            <div className="space-y-6">
              <div className="bg-cyan-600/10 backdrop-blur-xl border border-cyan-600/20 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-xl flex items-center justify-center">
                    <Plus className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Add Foods</h2>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search foods..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-cyan-600/30 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Food Categories */}
                <div className="max-h-96 overflow-y-auto space-y-4 mb-6 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-cyan-600/50">
                  {Object.entries(groupedFoods).map(([category, foods]) => (
                    <div key={category} className="space-y-2">
                      <div className="sticky top-0 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border-l-4 border-cyan-500">
                        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">{category}</h3>
                      </div>
                      {foods.map((food: string) => {
                        const isSelected = selectedFoods.find((f: Food) => f.name === food);
                        return (
                          <div key={food} className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-400/20 border-2 border-cyan-500/50 shadow-lg' 
                              : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-700/50 hover:border-cyan-600/30'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div 
                                onClick={() => toggleFood(food)}
                                className="flex-1 min-w-0"
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl bg-slate-700/50 w-10 h-10 rounded-xl flex items-center justify-center">
                                    {uaeFoods[food].emoji}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-white text-sm truncate">{food}</div>
                                    <div className="text-xs text-cyan-400 font-medium">{uaeFoods[food].calories} cal</div>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2">
                                  <span className="text-xs text-slate-400">×</span>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={isSelected.portion}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePortion(food, e.target.value)}
                                    className="w-16 px-2 py-1 bg-slate-700 border border-cyan-600/30 rounded-lg text-center text-white text-sm focus:ring-1 focus:ring-cyan-500"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Selected Foods Summary */}
                {selectedFoods.length > 0 && (
                  <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-cyan-600/30">
                    <div className="text-sm font-semibold text-cyan-400 mb-3">
                      Selected Foods ({selectedFoods.length})
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {selectedFoods.map((food: Food) => (
                        <div key={food.name} className="flex justify-between items-center text-sm">
                          <span className="text-white truncate flex-1">{food.name}</span>
                          <span className="text-cyan-400 ml-2">×{food.portion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={addFood}
                  disabled={selectedFoods.length === 0}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 disabled:from-slate-600 disabled:to-slate-500 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Plus size={20} />
                  Add Selected ({selectedFoods.length})
                </button>
              </div>
            </div>

            {/* Right Side - Consumed Foods */}
            <div className="space-y-6">
              {/* Total Calories Card */}
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-3xl p-8 text-center shadow-xl text-white">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Calculator size={28} />
                  <span className="text-xl font-semibold">Daily Total</span>
                </div>
                <div className="text-5xl font-bold mb-2">{totalCalories}</div>
                <div className="text-cyan-100 opacity-90">calories consumed</div>
              </div>

              {/* Consumed Foods List */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Today&apos;s Intake</h3>
                </div>

                {consumedFoods.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-cyan-600/50">
                    {consumedFoods.map((food: ConsumedFood) => (
                      <div key={food.id} className="group bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 hover:border-cyan-600/30 rounded-2xl p-4 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-slate-600/50 rounded-xl flex items-center justify-center text-xl">
                              {uaeFoods[food.name].emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{food.name}</div>
                              <div className="text-sm text-slate-400">
                                {food.portion}× portion • <span className="text-cyan-400 font-semibold">{food.calories} cal</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFood(food.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-slate-700/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">🍽️</span>
                    </div>
                    <div className="text-slate-400 text-lg font-medium mb-2">No foods logged yet</div>
                    <div className="text-slate-500 text-sm">Start adding foods to track your calories</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalorieCounter;

CalorieCounter.getLayout = function PageLayout(page: React.ReactNode) {
  return page; 
}