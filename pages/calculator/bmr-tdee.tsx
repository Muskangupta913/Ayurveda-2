import { useState, useEffect } from 'react';
import { Calculator, Activity, User, Scale, Ruler, Calendar } from 'lucide-react';

interface FormData {
  age: string;
  gender: 'male' | 'female';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  height: string;
  heightUnit: 'cm' | 'inches';
  activityLevel: string;
}

interface Results {
  bmr: number;
  tdee: number;
}

const BMRCalculator = () => {
  const [formData, setFormData] = useState<FormData>({
    age: '',
    gender: 'male',
    weight: '',
    weightUnit: 'kg',
    height: '',
    heightUnit: 'cm',
    activityLevel: '1.2'
  });

  const [results, setResults] = useState<Results | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activityLevels = [
    { value: '1.2', label: 'Sedentary', description: 'Little or no exercise' },
    { value: '1.375', label: 'Light Activity', description: 'Light exercise 1-3 days/week' },
    { value: '1.55', label: 'Moderate Activity', description: 'Moderate exercise 3-5 days/week' },
    { value: '1.725', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: '1.9', label: 'Extra Active', description: 'Hard exercise 2x/day or intense job' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = 'Please enter a valid height';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertToMetric = () => {
    let weightInKg = parseFloat(formData.weight);
    let heightInCm = parseFloat(formData.height);

    if (formData.weightUnit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }

    if (formData.heightUnit === 'inches') {
      heightInCm = heightInCm * 2.54;
    }

    return { weightInKg, heightInCm };
  };

  const calculateBMR = () => {
    if (!validateForm()) return;

    const { weightInKg, heightInCm } = convertToMetric();
    const age = parseInt(formData.age);

    let bmr: number;
    if (formData.gender === 'male') {
      bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;
    }

    const tdee = bmr * parseFloat(formData.activityLevel);

    setResults({ bmr: Math.round(bmr), tdee: Math.round(tdee) });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      age: '',
      gender: 'male',
      weight: '',
      weightUnit: 'kg',
      height: '',
      heightUnit: 'cm',
      activityLevel: '1.2'
    });
    setResults(null);
    setErrors({});
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <Calculator className="w-8 h-8 text-[#2D9AA5] mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">BMR & TDEE Calculator</h1>
          </div>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Calculate your BMR and TDEE using the Mifflin-St Jeor equation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-lg p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 text-[#2D9AA5] mr-1" />
              Your Information
            </h2>

            <div className="space-y-3">
              {/* Age Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Age (years)
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className={`text-black w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:border-[#2D9AA5] transition-colors placeholder-black ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {['male', 'female'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => handleInputChange('gender', gender as 'male' | 'female')}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                        formData.gender === gender
                          ? 'bg-[#2D9AA5] text-white border-[#2D9AA5]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#2D9AA5]'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Scale className="w-3 h-3 mr-1" />
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className={`text-black flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:border-[#2D9AA5] transition-colors placeholder-black ${
                      errors.weight ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter weight"
                    step="0.1"
                    min="0"
                  />
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                    className="text-black px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D9AA5] bg-white text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Ruler className="w-3 h-3 mr-1" />
                  Height
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className={`text-black flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:border-[#2D9AA5] transition-colors placeholder-black ${
                      errors.height ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter height"
                    step="0.1"
                    min="0"
                  />
                  <select
                    value={formData.heightUnit}
                    onChange={(e) => handleInputChange('heightUnit', e.target.value)}
                    className="text-black px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D9AA5] bg-white text-sm"
                  >
                    <option value="cm">cm</option>
                    <option value="inches">inches</option>
                  </select>
                </div>
                {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  Activity Level
                </label>
                <div className="space-y-1">
                  {activityLevels.map((level) => (
                    <label key={level.value} className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        checked={formData.activityLevel === level.value}
                        onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                        className="mt-0.5 mr-2 text-[#2D9AA5] focus:ring-[#2D9AA5]"
                      />
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{level.label}</div>
                        <div className="text-xs text-gray-600">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={calculateBMR}
                  className="flex-1 bg-[#2D9AA5] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#2D9AA5]/90 transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-3 overflow-y-auto">
            {/* Results Card */}
            {results && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Results</h3>
                
                <div className="space-y-3">
                  {/* BMR Result */}
                  <div className="bg-gradient-to-r from-[#2D9AA5]/10 to-[#2D9AA5]/5 rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Basal Metabolic Rate</div>
                      <div className="text-2xl font-bold text-[#2D9AA5] mb-1">{results.bmr}</div>
                      <div className="text-xs text-gray-600">calories/day</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-700 text-center">
                      Calories needed at rest
                    </div>
                  </div>

                  {/* TDEE Result */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Total Daily Energy Expenditure</div>
                      <div className="text-2xl font-bold text-emerald-600 mb-1">{results.tdee}</div>
                      <div className="text-xs text-gray-600">calories/day</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-700 text-center">
                      Total calories burned daily
                    </div>
                  </div>

                  {/* Calorie Goals */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">Calorie Goals</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Weight Loss:</span>
                        <span className="font-semibold text-red-600">{results.tdee - 500} cal/day</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Maintain:</span>
                        <span className="font-semibold text-[#2D9AA5]">{results.tdee} cal/day</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Weight Gain:</span>
                        <span className="font-semibold text-emerald-600">{results.tdee + 500} cal/day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">About BMR & TDEE</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div>
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">BMR</h4>
                  <p>Calories needed for basic body functions at rest.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">TDEE</h4>
                  <p>BMR multiplied by activity factor for total daily burn.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2D9AA5] mb-1">Formula</h4>
                  <p>Uses the accurate Mifflin-St Jeor equation (1990).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMRCalculator;

BMRCalculator.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}