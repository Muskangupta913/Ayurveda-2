import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Download, Upload, Settings, Plus, ChevronLeft, ChevronRight, Heart, Thermometer, Pill, Activity, Moon, Sun, Zap, User, BarChart3, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// TypeScript Interfaces
interface UserProfile {
  name: string;
  age: number;
  dob?: string;
  createdAt: string;
}

interface DailyLog {
  symptoms: string[];
  mood: string;
  bbt?: number;
  medication: string[];
  sexualActivity?: 'protected' | 'unprotected' | 'none';
}

interface Cycle {
  id: string;
  startDate: string;
  endDate: string;
  length: number;
  flowByDay: { date: string; flow: 'light' | 'medium' | 'heavy' }[];
  notes?: string;
}

interface ZevaAppData {
  version: number;
  user: UserProfile | null;
  settings: {
    remindersEnabled: boolean;
    notificationsGranted: boolean;
    preferredCycleLength?: number;
  };
  cycles: Cycle[];
  dailyLogs: Record<string, DailyLog>;
  exports: { date: string; fileName: string }[];
  createdAt: string;
}

// Storage helpers
const STORAGE_KEY = 'zeva_app_data';

function loadData(): ZevaAppData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ZevaAppData;
  } catch (e) {
    console.error('Invalid ZEVA data', e);
    return null;
  }
}

function saveData(data: ZevaAppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureUser(name: string, age: number): void {
  const data: ZevaAppData = loadData() || {
    version: 1,
    user: null,
    settings: {
      remindersEnabled: false,
      notificationsGranted: false
    },
    cycles: [],
    dailyLogs: {},
    exports: [],
    createdAt: new Date().toISOString()
  };

  data.user = { name, age, createdAt: new Date().toISOString() };
  saveData(data);
}

// Utility functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Main App Component
const ZevaPeriodTracker: React.FC = () => {
  const [data, setData] = useState<ZevaAppData | null>(null);
  const [currentView, setCurrentView] = useState<'onboarding' | 'calendar' | 'log' | 'analytics' | 'settings' | 'report'>('onboarding');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showFAQ, setShowFAQ] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedData = loadData();
    if (loadedData?.user) {
      setData(loadedData);
      setCurrentView('calendar');
    } else {
      setCurrentView('onboarding');
    }
  }, []);

  const updateData = (newData: ZevaAppData) => {
    setData(newData);
    saveData(newData);
  };

  // Onboarding Component
  const OnboardingView: React.FC = () => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim() && age && parseInt(age) > 0) {
        ensureUser(name.trim(), parseInt(age));
        const newData = loadData();
        if (newData) {
          setData(newData);
          setCurrentView('calendar');
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#ed449b] rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">ZEVA</h1>
            <p className="text-gray-600 mt-2">Your personal periods tracker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed449b] focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed449b] focus:border-transparent"
                placeholder="Enter your age"
                min="13"
                max="60"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ed449b] text-white py-3 rounded-lg font-medium hover:bg-[#d63d8f] transition-colors"
            >
              Get Started
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            All your data stays private on your device
          </p>
        </div>
      </div>
    );
  };

  // Calendar View Component
  const CalendarView: React.FC = () => {
    if (!data) return null;

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days: Date[] = [];

      // Add empty days for previous month
      const startDay = firstDay.getDay();
      for (let i = startDay - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }

      // Add days of current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      // Add empty days for next month
      const endDay = lastDay.getDay();
      for (let i = 1; i <= (6 - endDay); i++) {
        days.push(new Date(year, month + 1, i));
      }

      return days;
    };

    const getDayType = (date: Date): string => {
      const dateStr = formatDate(date);
      
      // Check if it's a period day
      for (const cycle of data.cycles) {
        for (const flowDay of cycle.flowByDay) {
          if (flowDay.date === dateStr) {
            return `period-${flowDay.flow}`;
          }
        }
      }

      // Check if it's a predicted fertile day
      const avgCycleLength = data.cycles.length > 0 
        ? Math.round(data.cycles.reduce((sum, cycle) => sum + cycle.length, 0) / data.cycles.length)
        : 28;
      
      const lastCycle = data.cycles[data.cycles.length - 1];
      if (lastCycle) {
        const lastPeriodEnd = new Date(lastCycle.endDate);
        const daysSinceLastPeriod = getDaysBetween(formatDate(lastPeriodEnd), dateStr);
        const ovulationDay = avgCycleLength - 14;
        
        if (daysSinceLastPeriod >= ovulationDay - 2 && daysSinceLastPeriod <= ovulationDay + 2) {
          return 'fertile';
        }
      }

      return '';
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateStr = formatDate(day);
              const dayType = getDayType(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = dateStr === formatDate(new Date());
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setCurrentView('log');
                  }}
                  className={`
                    p-2 h-10 text-sm rounded-lg transition-colors
                    ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
                    ${isToday ? 'ring-2 ring-[#ed449b]' : ''}
                    ${isSelected ? 'bg-[#ed449b] text-white' : ''}
                    ${dayType === 'period-light' ? 'bg-pink-200' : ''}
                    ${dayType === 'period-medium' ? 'bg-pink-400' : ''}
                    ${dayType === 'period-heavy' ? 'bg-[#ed449b]' : ''}
                    ${dayType === 'fertile' ? 'bg-green-200' : ''}
                    ${!isSelected && !dayType ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-200 rounded text-black"></div>
              <span>Light flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-400 rounded text-black"></div>
              <span>Medium flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#ed449b] rounded text-black"></div>
              <span>Heavy flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded text-black"></div>
              <span>Fertile window</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Daily Log View Component
  const LogView: React.FC = () => {
    if (!data) return null;

    const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | ''>('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [mood, setMood] = useState<string>('');
    const [bbt, setBbt] = useState<string>('');
    const [medication, setMedication] = useState<string[]>([]);
    const [sexualActivity, setSexualActivity] = useState<'protected' | 'unprotected' | 'none' | ''>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
      const dailyLog = data.dailyLogs[selectedDate];
      if (dailyLog) {
        setSymptoms(dailyLog.symptoms || []);
        setMood(dailyLog.mood || '');
        setBbt(dailyLog.bbt?.toString() || '');
        setMedication(dailyLog.medication || []);
        setSexualActivity(dailyLog.sexualActivity || '');
      }

      // Check if this date has period flow data
      for (const cycle of data.cycles) {
        const flowDay = cycle.flowByDay.find(f => f.date === selectedDate);
        if (flowDay) {
          setFlow(flowDay.flow);
          break;
        }
      }
    }, [selectedDate, data]);

    const availableSymptoms = [
      'Cramps', 'Headache', 'Bloating', 'Breast tenderness',
      'Nausea', 'Fatigue', 'Back pain', 'Mood swings',
      'Acne', 'Food cravings', 'Insomnia', 'Hot flashes'
    ];

    const availableMoods = [
      'Happy', 'Sad', 'Anxious', 'Irritable',
      'Calm', 'Energetic', 'Tired', 'Emotional'
    ];

    const availableMedications = [
      'Ibuprofen', 'Acetaminophen', 'Birth control',
      'Iron supplements', 'Vitamins', 'Other pain relief'
    ];

    const toggleSymptom = (symptom: string) => {
      setSymptoms(prev => 
        prev.includes(symptom) 
          ? prev.filter(s => s !== symptom)
          : [...prev, symptom]
      );
    };

    const toggleMedication = (med: string) => {
      setMedication(prev => 
        prev.includes(med) 
          ? prev.filter(m => m !== med)
          : [...prev, med]
      );
    };

    const saveLog = () => {
      const newData = { ...data };
      
      // Save daily log
      newData.dailyLogs[selectedDate] = {
        symptoms,
        mood,
        bbt: bbt ? parseFloat(bbt) : undefined,
        medication,
        sexualActivity: sexualActivity || undefined
      };

      // Handle period flow
      if (flow) {
        // Find existing cycle or create new one
        let currentCycle = newData.cycles.find(cycle => {
          const cycleStart = new Date(cycle.startDate);
          const cycleEnd = new Date(cycle.endDate);
          const selectedDateObj = new Date(selectedDate);
          return selectedDateObj >= cycleStart && selectedDateObj <= cycleEnd;
        });

        if (!currentCycle) {
          // Create new cycle
          currentCycle = {
            id: Date.now().toString(),
            startDate: selectedDate,
            endDate: selectedDate,
            length: 1,
            flowByDay: [{ date: selectedDate, flow }],
            notes
          };
          newData.cycles.push(currentCycle);
        } else {
          // Update existing cycle
          const existingFlowIndex = currentCycle.flowByDay.findIndex(f => f.date === selectedDate);
          if (existingFlowIndex >= 0) {
            currentCycle.flowByDay[existingFlowIndex].flow = flow;
          } else {
            currentCycle.flowByDay.push({ date: selectedDate, flow });
            // Update cycle dates if necessary
            if (selectedDate < currentCycle.startDate) {
              currentCycle.startDate = selectedDate;
            }
            if (selectedDate > currentCycle.endDate) {
              currentCycle.endDate = selectedDate;
            }
            currentCycle.length = getDaysBetween(currentCycle.startDate, currentCycle.endDate) + 1;
          }
        }
      }

      updateData(newData);
    };

    return (
      <div className="p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Log for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <button
              onClick={() => setCurrentView('calendar')}
              className="text-[#ed449b] hover:text-[#d63d8f]"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          {/* Period Flow */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Period Flow</h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFlow('')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  flow === '' ? 'border-[#ed449b] bg-[#ed449b] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                None
              </button>
              <button
                onClick={() => setFlow('light')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  flow === 'light' ? 'border-pink-300 bg-pink-200 text-pink-800' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setFlow('medium')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  flow === 'medium' ? 'border-pink-400 bg-pink-400 text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFlow('heavy')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  flow === 'heavy' ? 'border-[#ed449b] bg-[#ed449b] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Heavy
              </button>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Symptoms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    symptoms.includes(symptom) 
                      ? 'border-[#ed449b] bg-[#ed449b] text-white' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Mood</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableMoods.map(moodOption => (
                <button
                  key={moodOption}
                  onClick={() => setMood(moodOption)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    mood === moodOption 
                      ? 'border-[#ed449b] bg-[#ed449b] text-white' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {moodOption}
                </button>
              ))}
            </div>
          </div>

          {/* BBT */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              <Thermometer className="w-5 h-5 inline mr-2" />
              Basal Body Temperature (°F)
            </h3>
            <input
              type="number"
              value={bbt}
              onChange={(e) => setBbt(e.target.value)}
              placeholder="e.g., 98.6"
              step="0.1"
              min="95"
              max="105"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed449b] focus:border-transparent"
            />
          </div>

          {/* Medication */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              <Pill className="w-5 h-5 inline mr-2" />
              Medication
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableMedications.map(med => (
                <button
                  key={med}
                  onClick={() => toggleMedication(med)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    medication.includes(med) 
                      ? 'border-[#ed449b] bg-[#ed449b] text-white' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>

          {/* Sexual Activity */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              <Activity className="w-5 h-5 inline mr-2" />
              Sexual Activity
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSexualActivity('none')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  sexualActivity === 'none' ? 'border-[#ed449b] bg-[#ed449b] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                None
              </button>
              <button
                onClick={() => setSexualActivity('protected')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  sexualActivity === 'protected' ? 'border-[#ed449b] bg-[#ed449b] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Protected
              </button>
              <button
                onClick={() => setSexualActivity('unprotected')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  sexualActivity === 'unprotected' ? 'border-[#ed449b] bg-[#ed449b] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Unprotected
              </button>
            </div>
          </div>

          <button
            onClick={saveLog}
            className="w-full bg-[#ed449b] text-white py-3 rounded-lg font-medium hover:bg-[#d63d8f] transition-colors"
          >
            Save Log
          </button>
        </div>
      </div>
    );
  };

  // Analytics View Component
  const AnalyticsView: React.FC = () => {
    if (!data || data.cycles.length === 0) {
      return (
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Data Yet</h3>
            <p className="text-gray-600">Start tracking your periods to see analytics</p>
          </div>
        </div>
      );
    }

    const avgCycleLength = Math.round(
      data.cycles.reduce((sum, cycle) => sum + cycle.length, 0) / data.cycles.length
    );

    const cycleData = data.cycles.map((cycle, index) => ({
      cycle: index + 1,
      length: cycle.length
    }));

    const symptomCount: Record<string, number> = {};
    Object.values(data.dailyLogs).forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });

    const symptomData = Object.entries(symptomCount)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return (
      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Average Cycle</h3>
            <p className="text-2xl font-bold text-[#ed449b]">{avgCycleLength} days</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Cycles</h3>
            <p className="text-2xl font-bold text-[#ed449b]">{data.cycles.length}</p>
          </div>
        </div>

        {/* Cycle Length Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cycle Length Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cycleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cycle" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="length" stroke="#ed449b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Symptoms */}
        {symptomData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Common Symptoms</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={symptomData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symptom" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ed449b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Next Period Prediction */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Predictions</h3>
          {data.cycles.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Next Period:</span>
                <span className="font-semibold text-[#ed449b]">
                  {(() => {
                    const lastCycle = data.cycles[data.cycles.length - 1];
                    const nextPeriod = addDays(new Date(lastCycle.endDate), avgCycleLength);
                    return nextPeriod.toLocaleDateString();
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Fertile Window:</span>
                <span className="font-semibold text-green-600">
                  {(() => {
                    const lastCycle = data.cycles[data.cycles.length - 1];
                    const ovulationDate = addDays(new Date(lastCycle.endDate), avgCycleLength - 14);
                    const fertileStart = addDays(ovulationDate, -2);
                    const fertileEnd = addDays(ovulationDate, 2);
                    return `${fertileStart.toLocaleDateString()} - ${fertileEnd.toLocaleDateString()}`;
                  })()}
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4">
            Predictions are estimates based on your tracking history. Consult healthcare providers for medical advice.
          </p>
        </div>
      </div>
    );
  };

  // Report View Component
  const ReportView: React.FC = () => {
    if (!data) return null;

    const generatePDF = async () => {
      // Since we can't use jsPDF in this environment, we'll simulate the PDF generation
      // In a real implementation, you would use jsPDF + html2canvas here
      const reportElement = reportRef.current;
      if (!reportElement) return;

      // Simulate PDF generation
      const fileName = `ZEVA_report_${data.user?.name || 'user'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Update exports list
      const newData = { ...data };
      newData.exports.push({
        date: new Date().toISOString(),
        fileName
      });
      updateData(newData);

      // Show success message (in real app, this would actually generate and download the PDF)
      alert(`PDF report "${fileName}" would be generated and downloaded. (PDF generation requires additional libraries not available in this demo)`);
    };

    const avgCycleLength = data.cycles.length > 0 
      ? Math.round(data.cycles.reduce((sum, cycle) => sum + cycle.length, 0) / data.cycles.length)
      : 28;

    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Generate Report</h2>
            <button
              onClick={generatePDF}
              className="bg-[#ed449b] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#d63d8f] transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate PDF
            </button>
          </div>

          <div ref={reportRef} className="space-y-6">
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-[#ed449b] mb-2">ZEVA Periods Tracker</h1>
              <p className="text-lg text-gray-700 mb-1">Certified menstrual health report</p>
              <p className="text-sm text-[#ed449b] font-medium mb-4">ZEVA periods tracker</p>
              <div className="text-sm text-gray-600">
                <p>Generated for: {data.user?.name} (Age: {data.user?.age})</p>
                <p>Report date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Summary Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Cycles Tracked</p>
                  <p className="text-2xl font-bold text-[#ed449b]">{data.cycles.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Cycle Length</p>
                  <p className="text-2xl font-bold text-[#ed449b]">{avgCycleLength} days</p>
                </div>
              </div>
            </div>

            {/* Recent Cycles Table */}
            {data.cycles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Cycles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">End Date</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Length (days)</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Flow Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cycles.slice(-5).map((cycle) => (
                        <tr key={cycle.id}>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(cycle.startDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(cycle.endDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{cycle.length}</td>
                          <td className="border border-gray-300 px-4 py-2">{cycle.flowByDay.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FAQs Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-800">How accurate are predictions?</p>
                  <p className="text-sm text-gray-600">Predictions improve as you track more cycles. They are estimates based on your personal data.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Is my data private?</p>
                  <p className="text-sm text-gray-600">Yes, all data stays in localStorage on your device and is never transmitted anywhere.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">How is fertility calculated?</p>
                  <p className="text-sm text-gray-600">Using cycle averages and the standard ovulation timing (14 days before next period). This is not medical advice.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Can I export my data?</p>
                  <p className="text-sm text-gray-600">Yes, you can export as JSON backup or generate this certified PDF report.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">What does certified mean?</p>
                  <p className="text-sm text-gray-600">The PDF report is generated from your local data and certified by ZEVA as an accurate representation of your tracked information.</p>
                </div>
              </div>
            </div>

            {/* Certification Footer */}
            <div className="text-center border-t pt-6 mt-8">
              <p className="text-sm text-gray-600 mb-2">This report was generated from your personal tracking data.</p>
              <p className="font-bold text-[#ed449b]">Certified by ZEVA</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Settings View Component
  const SettingsView: React.FC = () => {
    if (!data) return null;

    const exportData = () => {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zeva_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // Update exports list
      const newData = { ...data };
      newData.exports.push({
        date: new Date().toISOString(),
        fileName: `zeva_backup_${new Date().toISOString().slice(0, 10)}.json`
      });
      updateData(newData);
    };

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string) as ZevaAppData;
          if (importedData.version && importedData.user && importedData.cycles) {
            updateData(importedData);
            alert('Data imported successfully!');
          } else {
            alert('Invalid data format');
          }
        } catch (error) {
          alert('Error importing data');
        }
      };
      reader.readAsText(file);
    };

    const clearAllData = () => {
      if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        setData(null);
        setCurrentView('onboarding');
      }
    };

    return (
      <div className="p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Settings</h2>

          {/* Profile */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Profile</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {data.user?.name}</p>
              <p><span className="font-medium">Age:</span> {data.user?.age}</p>
              <p><span className="font-medium">Member since:</span> {new Date(data.user?.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Data Management */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Data Management</h3>
            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data (JSON)
              </button>
              
              <label className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Data (JSON)
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={clearAllData}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>

          {/* App Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">App Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: 1.0.0</p>
              <p>Total cycles tracked: {data.cycles.length}</p>
              <p>Total daily logs: {Object.keys(data.dailyLogs).length}</p>
              <p>Data exports: {data.exports.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // FAQ Component
  const FAQView: React.FC = () => {
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);

    const faqs = [
      {
        question: "How accurate are predictions?",
        answer: "Predictions improve as you track more cycles. ZEVA uses your personal cycle history to estimate when your next period might start and when you might be in your fertile window. These are estimates based on averages and should not replace medical advice."
      },
      {
        question: "Is my data private?",
        answer: "Yes, absolutely. All your data stays in localStorage on your device and is never transmitted to any servers. Only you have access to your information."
      },
      {
        question: "How is fertility calculated?",
        answer: "ZEVA calculates your fertile window using the standard method: ovulation typically occurs 14 days before your next period. We estimate a 5-day fertile window (2 days before to 2 days after ovulation). This is not medical advice."
      },
      {
        question: "Can I export my data?",
        answer: "Yes! You can export your data as a JSON backup file or generate a certified PDF report. Both options are available in the Settings section."
      },
      {
        question: "What does certified mean?",
        answer: "The PDF report is generated from your local data and certified by ZEVA as an accurate representation of your tracked information. This can be useful for sharing with healthcare providers."
      },
      {
        question: "What should I do if I miss logging a day?",
        answer: "Don't worry! You can go back to any previous date using the calendar and add your information. ZEVA allows you to log data retroactively."
      },
      {
        question: "How many cycles should I track for accurate predictions?",
        answer: "The more cycles you track, the more accurate predictions become. Generally, tracking 3-6 cycles provides a good baseline for predictions, but everyone's cycle is different."
      }
    ];

    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-pink-50 rounded-lg">
            <h3 className="font-medium text-black mb-2">Important Disclaimer</h3>
            <p className="text-sm text-gray-900">
              ZEVA is a tracking tool and should not be used as a substitute for professional medical advice. 
              Always consult with healthcare providers for medical concerns or family planning decisions.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Component
  const Navigation: React.FC = () => {
    if (!data?.user) return null;

    const navItems = [
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'report', label: 'Report', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
      <nav className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-[#ed449b] bg-pink-50' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  };

  // Main App Header
  const Header: React.FC = () => {
    if (!data?.user) return null;

    return (
      <header className="bg-[#ed449b] text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ZEVA</h1>
              <p className="text-sm opacity-90">Hi, {data.user.name}!</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  };

  // Render main app
  if (currentView === 'onboarding') {
    return <OnboardingView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        {showFAQ && <FAQView />}
        {!showFAQ && currentView === 'calendar' && <CalendarView />}
        {!showFAQ && currentView === 'log' && <LogView />}
        {!showFAQ && currentView === 'analytics' && <AnalyticsView />}
        {!showFAQ && currentView === 'report' && <ReportView />}
        {!showFAQ && currentView === 'settings' && <SettingsView />}
      </main>

      <Navigation />
    </div>
  );
};

export default ZevaPeriodTracker;

ZevaPeriodTracker.getLayout = function PageLayout(page: React.ReactNode) {
  return page; 
}