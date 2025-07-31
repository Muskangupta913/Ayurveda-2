import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

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

  const uaeFoods: Record<string, { calories: number; emoji: string }> = {
    // Traditional UAE/Middle Eastern
    'Hummus (100g)': { calories: 166, emoji: '🧄' },
    'Shawarma Chicken': { calories: 300, emoji: '🌯' },
    'Shawarma Lamb': { calories: 400, emoji: '🥙' },
    'Falafel (5 pieces)': { calories: 333, emoji: '🧆' },
    'Kabsa (1 cup)': { calories: 350, emoji: '🍛' },
    'Machboos (1 cup)': { calories: 380, emoji: '🍚' },
    'Manakish Zaatar': { calories: 280, emoji: '🫓' },
    'Luqaimat (5 pieces)': { calories: 250, emoji: '🍯' },
    'Arabic Bread': { calories: 80, emoji: '🥖' },
    'Khubz': { calories: 75, emoji: '🍞' },
    'Mandi Chicken': { calories: 420, emoji: '🍗' },
    'Ouzi (1 serving)': { calories: 480, emoji: '🍖' },
    'Stuffed Grape Leaves': { calories: 150, emoji: '🍃' },
    'Tabbouleh (1 cup)': { calories: 120, emoji: '🥗' },
    'Fattoush (1 cup)': { calories: 140, emoji: '🥙' },
    'Baba Ganoush (100g)': { calories: 130, emoji: '🍆' },
    'Knafeh (1 piece)': { calories: 350, emoji: '🧀' },
    'Baklava (1 piece)': { calories: 245, emoji: '🥮' },
    'Maamoul (3 pieces)': { calories: 180, emoji: '🍪' },
    
    // Popular in UAE/Dubai
    'Biryani (1 cup)': { calories: 400, emoji: '🍛' },
    'Curry Chicken': { calories: 320, emoji: '🍛' },
    'Dal (1 cup)': { calories: 230, emoji: '🟡' },
    'Naan Bread': { calories: 260, emoji: '🫓' },
    'Samosa (1 piece)': { calories: 91, emoji: '🥟' },
    'Tikka Masala': { calories: 350, emoji: '🍖' },
    'Butter Chicken': { calories: 380, emoji: '🍗' },
    'Tandoori Chicken': { calories: 280, emoji: '🍗' },
    'Roti (1 piece)': { calories: 120, emoji: '🫓' },
    'Fish Curry': { calories: 290, emoji: '🐟' },
    'Mutton Curry': { calories: 450, emoji: '🍖' },
    'Palak Paneer': { calories: 320, emoji: '🟢' },
    'Rajma (1 cup)': { calories: 270, emoji: '🫘' },
    'Chole (1 cup)': { calories: 290, emoji: '🫛' },
    'Paratha (1 piece)': { calories: 300, emoji: '🫓' },
    'Lassi (1 glass)': { calories: 180, emoji: '🥛' },
    
    // Indian Popular Foods
    'Dosa (1 piece)': { calories: 168, emoji: '🥞' },
    'Idli (2 pieces)': { calories: 78, emoji: '⚪' },
    'Vada (2 pieces)': { calories: 180, emoji: '🍩' },
    'Upma (1 cup)': { calories: 200, emoji: '🌾' },
    'Poha (1 cup)': { calories: 180, emoji: '🍚' },
    'Aloo Gobi': { calories: 250, emoji: '🥔' },
    'Masala Chai': { calories: 50, emoji: '☕' },
    'Gulab Jamun (2 pieces)': { calories: 300, emoji: '🍡' },
    'Jalebi (100g)': { calories: 150, emoji: '🌀' },
    'Rasgulla (2 pieces)': { calories: 186, emoji: '⚪' },
    'Pani Puri (6 pieces)': { calories: 120, emoji: '🫧' },
    'Bhel Puri (1 cup)': { calories: 160, emoji: '🥗' },
    'Vada Pav': { calories: 290, emoji: '🍔' },
    'Misal Pav': { calories: 350, emoji: '🌶️' },
    'Pav Bhaji': { calories: 400, emoji: '🍞' },
    
    // American Popular Foods
    'Pizza Slice': { calories: 285, emoji: '🍕' },
    'Burger': { calories: 540, emoji: '🍔' },
    'Cheeseburger': { calories: 600, emoji: '🍔' },
    'Hot Dog': { calories: 290, emoji: '🌭' },
    'French Fries (Medium)': { calories: 365, emoji: '🍟' },
    'Onion Rings': { calories: 410, emoji: '🧅' },
    'Caesar Salad': { calories: 180, emoji: '🥗' },
    'Buffalo Wings (6 pieces)': { calories: 430, emoji: '🍗' },
    'Mac and Cheese': { calories: 320, emoji: '🧀' },
    'Fried Chicken (1 piece)': { calories: 320, emoji: '🍗' },
    'Pancakes (3 pieces)': { calories: 450, emoji: '🥞' },
    'Waffles (2 pieces)': { calories: 400, emoji: '🧇' },
    'Bagel with Cream Cheese': { calories: 360, emoji: '🥯' },
    'Donut (1 glazed)': { calories: 260, emoji: '🍩' },
    'Muffin (Blueberry)': { calories: 340, emoji: '🧁' },
    'Sandwich (Turkey)': { calories: 320, emoji: '🥪' },
    'Grilled Cheese': { calories: 290, emoji: '🧀' },
    'Tacos (2 pieces)': { calories: 380, emoji: '🌮' },
    'Burrito': { calories: 480, emoji: '🌯' },
    'Nachos (1 cup)': { calories: 550, emoji: '🧀' },
    'Steak (6oz)': { calories: 420, emoji: '🥩' },
    'BBQ Ribs (4 pieces)': { calories: 580, emoji: '🍖' },
    'Coleslaw (1 cup)': { calories: 150, emoji: '🥬' },
    
    // International Popular
    'Pasta (1 cup)': { calories: 220, emoji: '🍝' },
    'Spaghetti Bolognese': { calories: 350, emoji: '🍝' },
    'Grilled Fish': { calories: 206, emoji: '🐟' },
    'Salmon (6oz)': { calories: 350, emoji: '🍣' },
    'Sushi Roll (8 pieces)': { calories: 300, emoji: '🍣' },
    'Fried Rice': { calories: 380, emoji: '🍚' },
    'Pad Thai': { calories: 400, emoji: '🍜' },
    'Ramen (1 bowl)': { calories: 450, emoji: '🍜' },
    'Dim Sum (4 pieces)': { calories: 280, emoji: '🥟' },
    'Spring Rolls (2 pieces)': { calories: 150, emoji: '🌯' },
    
    // Beverages
    'Arabic Coffee': { calories: 5, emoji: '☕' },
    'Karak Tea': { calories: 120, emoji: '🍵' },
    'Fresh Orange Juice': { calories: 110, emoji: '🍊' },
    'Laban': { calories: 150, emoji: '🥛' },
    'Date Milkshake': { calories: 280, emoji: '🥤' },
    'Mango Lassi': { calories: 200, emoji: '🥭' },
    'Coffee (Black)': { calories: 5, emoji: '☕' },
    'Cappuccino': { calories: 120, emoji: '☕' },
    'Latte': { calories: 190, emoji: '☕' },
    'Coca Cola (12oz)': { calories: 140, emoji: '🥤' },
    'Fresh Lime Soda': { calories: 80, emoji: '🍋' },
    'Smoothie (Berry)': { calories: 180, emoji: '🫐' },
    'Green Tea': { calories: 2, emoji: '🍵' },
    'Iced Tea': { calories: 70, emoji: '🧊' },
    
    // Fruits & Snacks
    'Dates (5 pieces)': { calories: 100, emoji: '🟫' },
    'Banana': { calories: 105, emoji: '🍌' },
    'Apple': { calories: 80, emoji: '🍎' },
    'Mango': { calories: 135, emoji: '🥭' },
    'Pomegranate': { calories: 134, emoji: '🔴' },
    'Orange': { calories: 65, emoji: '🍊' },
    'Grapes (1 cup)': { calories: 104, emoji: '🍇' },
    'Watermelon (1 cup)': { calories: 46, emoji: '🍉' },
    'Pineapple (1 cup)': { calories: 82, emoji: '🍍' },
    'Almonds (10 pieces)': { calories: 70, emoji: '🥜' },
    'Cashews (10 pieces)': { calories: 90, emoji: '🥜' },
    'Pistachios (10 pieces)': { calories: 40, emoji: '🥜' },
    'Mixed Nuts (1 oz)': { calories: 170, emoji: '🥜' },
    'Popcorn (1 cup)': { calories: 31, emoji: '🍿' },
    'Chips (1 oz)': { calories: 150, emoji: '🥔' },
    'Crackers (5 pieces)': { calories: 80, emoji: '🍘' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#2D9AA5] to-[#3db4c2] rounded-full mx-auto mb-4 flex items-center justify-center">
            <Calculator className="text-white" size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2">Calorie Counter</h1>
          <p className="text-black opacity-70 text-sm sm:text-base">Track your daily calories</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          
          {/* Left Side - Food Selection */}
          <div className="order-1 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 h-fit">
              <h2 className="text-lg sm:text-xl font-bold text-black mb-4 flex items-center gap-2">
                🍽️ Add Foods
              </h2>
              
              {/* Search Bar */}
              <input
                type="text"
                placeholder="🔍 Search for foods..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full p-3 sm:p-4 border-2 border-[#2D9AA5]/30 rounded-xl mb-4 focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] bg-white text-black font-medium shadow-sm text-sm sm:text-base"
              />

              {/* Food List */}
              <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto mb-4 space-y-2">
                {filteredFoods.map((food: string) => {
                  const isSelected = selectedFoods.find((f: Food) => f.name === food);
                  return (
                    <div key={food} className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#2D9AA5] bg-[#2D9AA5]/10' 
                        : 'border-gray-200 hover:border-[#2D9AA5]/50 bg-white'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          onClick={() => toggleFood(food)}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{uaeFoods[food].emoji}</span>
                            <div className="font-medium text-black text-sm sm:text-base truncate">{food}</div>
                          </div>
                          <div className="text-xs sm:text-sm text-black opacity-60 ml-7">{uaeFoods[food].calories} cal</div>
                        </div>
                        {isSelected && (
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={isSelected.portion}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePortion(food, e.target.value)}
                            className="w-12 sm:w-16 p-1 sm:p-2 border border-[#2D9AA5]/30 rounded-lg text-center text-black font-medium text-xs sm:text-sm"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Foods Summary */}
              {selectedFoods.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded-xl border border-[#2D9AA5]/30">
                  <div className="text-sm font-medium text-black mb-2">Selected ({selectedFoods.length}):</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {selectedFoods.map((food: Food) => (
                      <div key={food.name} className="text-xs sm:text-sm text-black opacity-70 truncate">
                        {food.name} × {food.portion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={addFood}
                disabled={selectedFoods.length === 0}
                className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#3db4c2] text-white p-3 sm:p-4 rounded-xl font-bold hover:from-[#257a83] hover:to-[#35a0ac] disabled:from-gray-300 disabled:to-gray-400 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <Plus size={18} />
                Add Selected Foods ({selectedFoods.length})
              </button>
            </div>
          </div>

          {/* Right Side - Results */}
          <div className="order-2 lg:order-2">
            <div className="space-y-4 lg:space-y-6">
              
              {/* Total Calories */}
              <div className="bg-gradient-to-r from-[#2D9AA5] to-[#3db4c2] text-white p-4 sm:p-6 rounded-2xl text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calculator size={20} />
                  <span className="text-base sm:text-lg font-medium">Total Calories</span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold">{totalCalories}</div>
                <div className="text-xs sm:text-sm opacity-90 mt-1">calories consumed today</div>
              </div>

              {/* Consumed Foods List */}
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
                {consumedFoods.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-black text-base sm:text-lg mb-3 flex items-center gap-2">
                      📋 Today&apos;s Intake:
                    </h3>
                    <div className="max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto space-y-2">
                      {consumedFoods.map((food: ConsumedFood) => (
                        <div key={food.id} className="flex items-center justify-between bg-gradient-to-r from-white to-[#2D9AA5]/5 p-3 sm:p-4 rounded-xl border border-[#2D9AA5]/20 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{uaeFoods[food.name].emoji}</span>
                              <div className="font-bold text-black text-sm sm:text-base truncate">{food.name}</div>
                            </div>
                            <div className="text-xs sm:text-sm text-black opacity-70 ml-7">
                              {food.portion}x portion • {food.calories} calories
                            </div>
                          </div>
                          <button
                            onClick={() => removeFood(food.id)}
                            className="text-red-500 hover:text-red-700 p-1 sm:p-2 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-black opacity-60 py-8 sm:py-12 bg-gradient-to-r from-[#2D9AA5]/5 to-[#3db4c2]/5 rounded-2xl border-2 border-dashed border-[#2D9AA5]/30">
                    <div className="text-3xl sm:text-4xl mb-4">🍽️</div>
                    <div className="font-medium text-sm sm:text-base">No foods added yet</div>
                    <div className="text-xs sm:text-sm mt-1">Start tracking your calories!</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCounter;

CalorieCounter.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}