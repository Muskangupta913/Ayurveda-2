import React, { useState, useEffect } from 'react'
import { Heart, Play, Square, Info } from 'lucide-react';

function HeartRateMonitor(){
  const [heartRate, setHeartRate] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [currentBPM, setCurrentBPM] = useState<number>(0);

  // Simulate heart rate monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring && heartRate) {
      interval = setInterval(() => {
        const baseRate: number = parseInt(heartRate);
        const variation: number = Math.random() * 6 - 3; // ±3 BPM variation
        const newRate: number = Math.max(40, Math.min(200, Math.round(baseRate + variation)));
        setCurrentBPM(newRate);
      }, 1000);
    } else {
      setCurrentBPM(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, heartRate]);

  const getHeartRateStatus = (bpm: number, userAge: string): string => {
    if (!userAge || bpm === 0) return 'Enter details to start';
    
    const maxHR: number = 220 - parseInt(userAge);
    const restingZone: number = maxHR * 0.5;
    const fatBurnZone: number = maxHR * 0.7;
    const cardioZone: number = maxHR * 0.85;
    
    if (bpm < 60) return 'Resting';
    if (bpm < restingZone) return 'Light Activity';
    if (bpm < fatBurnZone) return 'Fat Burn Zone';
    if (bpm < cardioZone) return 'Cardio Zone';
    return 'Peak Zone';
  };

  const status: string = getHeartRateStatus(currentBPM, age);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 relative">
        {/* Back Button */}
        {/* <CalculatorBackButton /> */}
        
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Heart Rate Monitor</h1>
          <p className="text-gray-600">Simple and effective heart rate tracking</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Left Side - Input */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Input</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-3">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAge(e.target.value)}
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#2D9AA5] focus:outline-none transition-colors text-lg placeholder-black"
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-3">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeartRate(e.target.value)}
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#2D9AA5] focus:outline-none transition-colors text-lg placeholder-black"
                  placeholder="Enter BPM"
                  min="30"
                  max="220"
                />
              </div>
              
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                disabled={!heartRate || !age}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  isMonitoring
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[#2D9AA5] hover:bg-[#248a94] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMonitoring ? (
                  <>
                    <Square className="w-5 h-5" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Monitoring
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-[#2D9AA5]/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#2D9AA5] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How to Calculate Your BPM
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <strong>Method 1 - Wrist Pulse:</strong>
                  <p>Place 2 fingers on your wrist below your thumb. Count beats for 15 seconds, then multiply by 4.</p>
                </div>
                <div>
                  <strong>Method 2 - Neck Pulse:</strong>
                  <p>Place 2 fingers on your neck beside your windpipe. Count beats for 15 seconds, then multiply by 4.</p>
                </div>
                <div>
                  <strong>Method 3 - Chest:</strong>
                  <p>Place your hand over your heart. Count beats for 15 seconds, then multiply by 4.</p>
                </div>
                <div className="bg-white rounded-lg p-3 mt-4">
                  <strong className="text-[#2D9AA5]">Quick Tip:</strong> For more accuracy, count for 30 seconds and multiply by 2, or count for a full 60 seconds.
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Results */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Results</h2>
            
            <div className="text-center space-y-6">
              {/* Heart Display */}
              <div className="relative">
                <Heart 
                  className={`w-24 h-24 mx-auto transition-all duration-300 ${
                    isMonitoring ? 'text-[#2D9AA5] animate-pulse' : 'text-gray-300'
                  }`} 
                  fill="currentColor"
                />
                {isMonitoring && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* BPM Display */}
              <div>
                <div className="text-6xl font-bold text-[#2D9AA5] mb-2">
                  {currentBPM}
                </div>
                <div className="text-xl text-gray-600">BPM</div>
              </div>
              
              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-medium text-gray-800">{status}</div>
                {age && currentBPM > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Max HR: {220 - parseInt(age)} BPM
                  </div>
                )}
              </div>
              
              {/* Monitoring Status */}
              {isMonitoring ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Monitoring</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  {!heartRate || !age ? 'Fill in the details to start' : 'Press start to begin monitoring'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Simple Info */}
        {age && (
          <div className="max-w-2xl mx-auto mt-8 bg-[#2D9AA5]/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#2D9AA5] mb-3">Your Heart Rate Zones</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-800">Resting</div>
                <div className="text-gray-600">&lt; 60</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800">Light</div>
                <div className="text-gray-600">60-{Math.round((220 - parseInt(age)) * 0.5)}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800">Fat Burn</div>
                <div className="text-gray-600">{Math.round((220 - parseInt(age)) * 0.5)}-{Math.round((220 - parseInt(age)) * 0.7)}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800">Cardio+</div>
                <div className="text-gray-600">{Math.round((220 - parseInt(age)) * 0.7)}+</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeartRateMonitor;

HeartRateMonitor.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}