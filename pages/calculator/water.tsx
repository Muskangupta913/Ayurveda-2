import React, { useState, useEffect } from 'react';
import { Droplets, Calculator, Activity, User } from 'lucide-react';

interface WaterCalculatorState {
  weight: string;
  weightUnit: 'kg' | 'lbs';
  activityLevel: 'low' | 'moderate' | 'high';
  exerciseMinutes: string;
  exerciseDays: string;
}

function WaterIntakeCalculator(){
  const [state, setState] = useState<WaterCalculatorState>({
    weight: '',
    weightUnit: 'kg',
    activityLevel: 'moderate',
    exerciseMinutes: '0',
    exerciseDays: '0'
  });

  const [results, setResults] = useState({
    basicWater: 0,
    totalWater: 0,
    cups: 0,
    bottles: 0,
    weeklyExerciseWater: 0,
    dailyAverageExerciseWater: 0
  });

  const updateState = (updates: Partial<WaterCalculatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (state.weight) {
      const weightInKg = state.weightUnit === 'lbs' 
        ? parseFloat(state.weight) * 0.453592 
        : parseFloat(state.weight);
      
      const exerciseMin = parseFloat(state.exerciseMinutes) || 0;
      const exerciseDays = parseFloat(state.exerciseDays) || 0;
      
      // Basic water calculation
      const basicWater = weightInKg * 0.033;
      
      // Activity level multipliers
      const activityMultipliers = {
        low: 1.0,
        moderate: 1.1,
        high: 1.2
      };
      
      // Exercise water calculation
      // Total weekly exercise water
      const weeklyExerciseWater = (exerciseMin / 30) * 0.35 * exerciseDays;
      // Daily average exercise water (spread across 7 days)
      const dailyAverageExerciseWater = weeklyExerciseWater / 7;
      
      // Total daily water calculation
      const totalWater = (basicWater * activityMultipliers[state.activityLevel]) + dailyAverageExerciseWater;
      
      setResults({
        basicWater: Math.round(basicWater * 100) / 100,
        totalWater: Math.round(totalWater * 100) / 100,
        cups: Math.round((totalWater * 4.227) * 10) / 10, // 1 liter = ~4.227 cups
        bottles: Math.round((totalWater / 0.5) * 10) / 10, // assuming 500ml bottles
        weeklyExerciseWater: Math.round(weeklyExerciseWater * 100) / 100,
        dailyAverageExerciseWater: Math.round(dailyAverageExerciseWater * 100) / 100
      });
    } else {
      setResults({ 
        basicWater: 0, 
        totalWater: 0, 
        cups: 0, 
        bottles: 0, 
        weeklyExerciseWater: 0,
        dailyAverageExerciseWater: 0 
      });
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Droplets className="w-10 h-10 text-[#2D9AA5]" />
            <h1 className="text-4xl font-bold text-gray-800">Water Intake Calculator</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Calculate daily water intake by weight, activity, and exercise duration.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Inputs */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-[#2D9AA5]" />
              <h2 className="text-2xl font-semibold text-gray-800">Input Details</h2>
            </div>

            <div className="space-y-6">
              {/* Weight Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <User className="w-4 h-4" />
                  Body Weight
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={state.weight}
                      onChange={(e) => updateState({ weight: e.target.value })}
                      placeholder="Enter weight"
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2D9AA5] focus:outline-none transition-colors text-lg"
                    />
                  </div>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => updateState({ weightUnit: 'kg' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        state.weightUnit === 'kg' 
                          ? 'bg-[#2D9AA5] text-white shadow-md' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => updateState({ weightUnit: 'lbs' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        state.weightUnit === 'lbs' 
                          ? 'bg-[#2D9AA5] text-white shadow-md' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Activity className="w-4 h-4" />
                  Activity Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'low', label: 'Low', desc: 'Sedentary lifestyle' },
                    { key: 'moderate', label: 'Moderate', desc: 'Light exercise' },
                    { key: 'high', label: 'High', desc: 'Active lifestyle' }
                  ].map((level) => (
                    <button
                      key={level.key}
                      onClick={() => updateState({ activityLevel: level.key as any })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        state.activityLevel === level.key
                          ? 'border-[#2D9AA5] bg-[#2D9AA5]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{level.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Droplets className="w-4 h-4" />
                  Additional Exercise
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Days per week</label>
                    <select
                      value={state.exerciseDays}
                      onChange={(e) => updateState({ exerciseDays: e.target.value })}
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2D9AA5] focus:outline-none transition-colors text-lg bg-white"
                    >
                      <option value="0">0 days</option>
                      <option value="1">1 day</option>
                      <option value="2">2 days</option>
                      <option value="3">3 days</option>
                      <option value="4">4 days</option>
                      <option value="5">5 days</option>
                      <option value="6">6 days</option>
                      <option value="7">7 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Minutes per session</label>
                    <input
                      type="number"
                      value={state.exerciseMinutes}
                      onChange={(e) => updateState({ exerciseMinutes: e.target.value })}
                      placeholder="0"
                      min="0"
                      max="480"
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2D9AA5] focus:outline-none transition-colors text-lg"
                    />
                  </div>
                </div>
                {/* <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Formula:</span> +0.35L per 30min session × days per week ÷ 7
                  </p>
                  {state.exerciseDays !== '0' && state.exerciseMinutes !== '0' && (
                    <p className="text-sm text-[#2D9AA5] mt-1">
                      <span className="font-medium">Your exercise:</span> {state.exerciseMinutes} min × {state.exerciseDays} days = +{results.dailyAverageExerciseWater}L daily average
                    </p>
                  )}
                </div> */}
              </div>
            </div>
          </div>

          {/* Right Side - Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Droplets className="w-6 h-6 text-[#2D9AA5]" />
              <h2 className="text-2xl font-semibold text-gray-800">Your Water Intake</h2>
            </div>

            {state.weight ? (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="bg-gradient-to-r from-[#2D9AA5] to-[#2D9AA5]/80 rounded-2xl p-6 text-white">
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold mb-2">
                      {results.totalWater}L
                    </div>
                    <div className="text-lg opacity-90">
                      Recommended Daily Intake
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-[#2D9AA5] mb-1">
                      {results.basicWater}L
                    </div>
                    <div className="text-sm text-gray-600">Base Amount</div>
                    <div className="text-xs text-gray-500 mt-1">Weight × 0.033</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-[#2D9AA5] mb-1">
                      {Math.round(((results.basicWater * (state.activityLevel === 'low' ? 1.0 : state.activityLevel === 'moderate' ? 1.1 : 1.2)) - results.basicWater) * 100) / 100}L
                    </div>
                    <div className="text-sm text-gray-600">Activity Level</div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{state.activityLevel}</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-[#2D9AA5] mb-1">
                      {results.dailyAverageExerciseWater}L
                    </div>
                    <div className="text-sm text-gray-600">Exercise Bonus</div>
                    <div className="text-xs text-gray-500 mt-1">{state.exerciseDays}d × {state.exerciseMinutes}min</div>
                  </div>
                </div>

                {/* Exercise Details */}
                {results.weeklyExerciseWater > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-medium text-gray-800 mb-2">📊 Exercise Water Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total weekly exercise water:</span>
                        <span className="font-semibold text-[#2D9AA5]">{results.weeklyExerciseWater}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily average from exercise:</span>
                        <span className="font-semibold text-[#2D9AA5]">{results.dailyAverageExerciseWater}L</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative Measurements */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Other Measurements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Cups (8 oz)</span>
                      <span className="font-semibold text-[#2D9AA5]">{results.cups}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Bottles (500ml)</span>
                      <span className="font-semibold text-[#2D9AA5]">{results.bottles}</span>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-medium text-amber-800 mb-2">💡 Hydration Tips</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Start your day with a glass of water</li>
                    <li>• Drink before, during, and after exercise</li>
                    <li>• Increase intake in hot weather</li>
                    <li>• Listen to your body's thirst signals</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500 text-lg">
                  Enter your weight to see recommendations
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="text-center mt-12 pb-8">
          <p className="text-gray-500 text-sm">
            This calculator provides general guidance. Consult healthcare professionals for personalized advice.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default WaterIntakeCalculator;



WaterIntakeCalculator.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}