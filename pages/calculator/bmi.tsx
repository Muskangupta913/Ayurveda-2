import React, { useState, useEffect } from 'react';

interface BMIResult {
  bmi: number;
  category: string;
  color: string;
}

interface UnitConversion {
  [key: string]: number;
}

function BMICalculator() {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<string>('kg');
  const [heightUnit, setHeightUnit] = useState<string>('m');
  const [result, setResult] = useState<BMIResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Weight units (to kg conversion)
  const weightUnits: UnitConversion = {
    'kg': 1,
    'g': 0.001,
    'lb': 0.453592,
    'oz': 0.0283495,
    'st': 6.35029, // stone
    'ton': 1000
  };

  // Height units (to meter conversion)
  const heightUnits: UnitConversion = {
    'm': 1,
    'cm': 0.01,
    'mm': 0.001,
    'ft': 0.3048,
    'in': 0.0254,
    'yd': 0.9144
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3498db' };
    if (bmi < 25) return { category: 'Normal Weight', color: '#27ae60' };
    if (bmi < 30) return { category: 'Overweight', color: '#f39c12' };
    if (bmi < 35) return { category: 'Obese Class I', color: '#e67e22' };
    if (bmi < 40) return { category: 'Obese Class II', color: '#e74c3c' };
    return { category: 'Obese Class III', color: '#8e44ad' };
  };

  const convertToBaseUnits = (value: number, unit: string, isWeight: boolean): number => {
    const conversionTable = isWeight ? weightUnits : heightUnits;
    return value * conversionTable[unit];
  };

  const calculateBMI = async (): Promise<void> => {
    if (!weight || !height) return;
    
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const weightValue = parseFloat(weight);
    const heightValue = parseFloat(height);
    
    // Convert to base units (kg and m)
    const weightInKg = convertToBaseUnits(weightValue, weightUnit, true);
    const heightInM = convertToBaseUnits(heightValue, heightUnit, false);
    
    const bmi = weightInKg / (heightInM * heightInM);
    const { category, color } = getBMICategory(bmi);
    
    setResult({ bmi: Math.round(bmi * 10) / 10, category, color });
    setIsCalculating(false);
  };

  const resetCalculator = (): void => {
    setWeight('');
    setHeight('');
    setResult(null);
  };

  useEffect(() => {
    if (weight && height) {
      const timer = setTimeout(calculateBMI, 300);
      return () => clearTimeout(timer);
    }
  }, [weight, height, weightUnit, heightUnit]);

  const getUnitLabel = (unit: string): string => {
    const labels: { [key: string]: string } = {
      'kg': 'Kilograms',
      'g': 'Grams',
      'lb': 'Pounds',
      'oz': 'Ounces',
      'st': 'Stone',
      'ton': 'Metric Tons',
      'm': 'Meters',
      'cm': 'Centimeters',
      'mm': 'Millimeters',
      'ft': 'Feet',
      'in': 'Inches',
      'yd': 'Yards'
    };
    return labels[unit] || unit;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] mx-4 my-4 grid lg:grid-cols-2 animate-fadeIn overflow-hidden">
        
        {/* Form Section */}
        <div className="bg-[#2D9AA5] p-4 sm:p-6 lg:p-8 flex flex-col justify-center text-white overflow-y-auto">
          <div className="space-y-4 lg:space-y-6">
            <div className="animate-slideDown">
              <h1 className="text-2xl sm:text-3xl font-light mb-2">BMI Calculator</h1>
              <p className="text-xs sm:text-sm opacity-90">Calculate your Body Mass Index with multiple unit options</p>
            </div>
            
            {/* Weight Input with Unit Selector */}
            <div className="animate-slideRight">
              <label className="block mb-2 text-sm font-medium opacity-90">Weight</label>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="flex-1 p-3 sm:p-4 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white/80 focus:bg-white/20 transition-all duration-300 focus:scale-105 outline-none text-sm sm:text-base"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="bg-white/10 border-2 border-white/30 rounded-xl text-white px-2 sm:px-4 py-2 focus:border-white/80 focus:bg-white/20 transition-all duration-300 outline-none cursor-pointer min-w-[70px] sm:min-w-[100px] text-sm"
                >
                  {Object.keys(weightUnits).map(unit => (
                    <option key={unit} value={unit} className="bg-[#2D9AA5] text-white">
                      {unit.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs opacity-70 mt-1 block">{getUnitLabel(weightUnit)}</span>
            </div>

            {/* Height Input with Unit Selector */}
            <div className="animate-slideRight" style={{ animationDelay: '0.1s' }}>
              <label className="block mb-2 text-sm font-medium opacity-90">Height</label>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Enter height"
                  className="flex-1 p-3 sm:p-4 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white/80 focus:bg-white/20 transition-all duration-300 focus:scale-105 outline-none text-sm sm:text-base"
                />
                <select
                  value={heightUnit}
                  onChange={(e) => setHeightUnit(e.target.value)}
                  className="bg-white/10 border-2 border-white/30 rounded-xl text-white px-2 sm:px-4 py-2 focus:border-white/80 focus:bg-white/20 transition-all duration-300 outline-none cursor-pointer min-w-[70px] sm:min-w-[100px] text-sm"
                >
                  {Object.keys(heightUnits).map(unit => (
                    <option key={unit} value={unit} className="bg-[#2D9AA5] text-white">
                      {unit.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs opacity-70 mt-1 block">{getUnitLabel(heightUnit)}</span>
            </div>

            {/* Quick Unit Presets */}
            <div>
              <label className="block mb-2 text-sm font-medium opacity-90">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {setWeightUnit('kg'); setHeightUnit('m');}}
                  className="py-2 px-2 sm:px-3 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-all duration-300"
                >
                  Metric (kg/m)
                </button>
                <button
                  onClick={() => {setWeightUnit('lb'); setHeightUnit('ft');}}
                  className="py-2 px-2 sm:px-3 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-all duration-300"
                >
                  Imperial (lb/ft)
                </button>
                <button
                  onClick={() => {setWeightUnit('kg'); setHeightUnit('cm');}}
                  className="py-2 px-2 sm:px-3 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-all duration-300"
                >
                  Metric (kg/cm)
                </button>
                <button
                  onClick={() => {setWeightUnit('lb'); setHeightUnit('in');}}
                  className="py-2 px-2 sm:px-3 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-all duration-300"
                >
                  Imperial (lb/in)
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={calculateBMI}
                disabled={!weight || !height || isCalculating}
                className="flex-1 bg-white text-[#2D9AA5] py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                {isCalculating ? 'Calculating...' : 'Calculate BMI'}
              </button>
              <button
                onClick={resetCalculator}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-white/10 border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center bg-gray-50 overflow-y-auto">
          {result ? (
            <div className="text-center animate-bounceIn w-full max-w-md">
              <div 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 animate-pulse"
                style={{ color: result.color }}
              >
                {result.bmi}
              </div>
              <div className="text-xl sm:text-2xl font-semibold mb-2 text-gray-700">
                Your BMI
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-4 lg:mb-6">
                {weight} {weightUnit.toUpperCase()} • {height} {heightUnit.toUpperCase()}
              </div>
              
              <div 
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-semibold text-sm sm:text-lg animate-fadeIn mb-4 lg:mb-6"
                style={{ backgroundColor: result.color }}
              >
                {result.category}
              </div>
              
              {/* BMI Categories Reference */}
              <div className="w-full space-y-1 sm:space-y-2 text-xs sm:text-sm text-black mb-4">
                <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg bg-blue-50">
                  <span>Underweight</span>
                  <span className="font-semibold text-blue-600">&lt; 18.5</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg bg-green-50">
                  <span>Normal Weight</span>
                  <span className="font-semibold text-green-600">18.5 - 24.9</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg bg-yellow-50">
                  <span>Overweight</span>
                  <span className="font-semibold text-yellow-600">25.0 - 29.9</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg bg-red-50">
                  <span>Obese</span>
                  <span className="font-semibold text-red-600">≥ 30.0</span>
                </div>
              </div>
              
              {/* BMI Scale Visual */}
              <div className="w-full max-w-xs mx-auto">
                <div className="h-3 sm:h-4 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-400 rounded-full relative">
                  <div 
                    className="absolute w-3 sm:w-4 h-3 sm:h-4 bg-white border-2 rounded-full transform -translate-y-0 shadow-lg animate-bounce"
                    style={{ 
                      left: `${Math.min(Math.max((result.bmi - 15) / 25 * 100, 0), 100)}%`,
                      borderColor: result.color,
                      marginLeft: '-6px'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 sm:mt-2">
                  <span>15</span>
                  <span>25</span>
                  <span>35</span>
                  <span>40+</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 animate-pulse">
              <div className="w-24 sm:w-32 h-24 sm:h-32 bg-gray-200 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <svg className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base sm:text-lg mb-2">Enter your measurements</p>
              <p className="text-xs sm:text-sm">Select units and calculate your BMI</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
        .animate-slideRight { animation: slideRight 0.6s ease-out; }
        .animate-bounceIn { animation: bounceIn 0.8s ease-out; }
        
        select option {
          background-color: #2D9AA5;
          color: white;
        }

        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BMICalculator;



BMICalculator.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};