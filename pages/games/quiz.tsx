import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, XCircle, Trophy, Brain } from 'lucide-react';

interface Question {
  q: string;
  o: string[];
  c: number[];
}

interface QuizLevel {
  name: string;
  questions: Question[];
}

interface ChartData {
  level: string;
  score: number;
  percentage: number;
  total: number;
}

const QUIZ_DATA: Record<number, QuizLevel> = {
  1: {
    name: "Basic Health",
    questions: [
      { q: "How many glasses of water should you drink daily?", o: ["2-3", "4-6", "8-10", "12-15"], c: [2] },
      { q: "Which vitamin is produced by sunlight?", o: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], c: [3] },
      { q: "How many hours of sleep do adults need?", o: ["4-5", "6-7", "7-9", "10-12"], c: [2] },
      { q: "What are good sources of protein?", o: ["Eggs", "Beans", "Fish", "Candy"], c: [0, 1, 2] },
      { q: "Regular exercise helps with:", o: ["Heart health", "Mental health", "Weight control", "All above"], c: [3] },
      { q: "Which is a healthy breakfast?", o: ["Donuts", "Oatmeal with fruit", "Energy drink", "Candy bar"], c: [1] },
      { q: "How often should you brush teeth?", o: ["Once daily", "Twice daily", "Weekly", "Monthly"], c: [1] },
      { q: "What's a good way to reduce stress?", o: ["Deep breathing", "Exercise", "Meditation", "Smoking"], c: [0, 1, 2] },
      { q: "Which foods are high in fiber?", o: ["White bread", "Fruits", "Vegetables", "Whole grains"], c: [1, 2, 3] },
      { q: "What's the recommended daily fruit serving?", o: ["1-2", "2-3", "4-5", "6-7"], c: [1] },
      { q: "Which activity burns calories?", o: ["Walking", "Swimming", "Dancing", "All above"], c: [3] },
      { q: "What helps build strong bones?", o: ["Calcium", "Vitamin D", "Exercise", "All above"], c: [3] },
      { q: "How much exercise per week is recommended?", o: ["30 min", "75 min", "150 min", "300 min"], c: [2] },
      { q: "Which is a warning sign of dehydration?", o: ["Dark urine", "Headache", "Fatigue", "All above"], c: [3] },
      { q: "What's important for eye health?", o: ["Vitamin A", "Beta carotene", "Omega-3", "All above"], c: [3] },
      { q: "Which habit improves mental health?", o: ["Social connection", "Regular sleep", "Exercise", "All above"], c: [3] },
      { q: "What's a healthy snack?", o: ["Chips", "Nuts", "Soda", "Cookies"], c: [1] },
      { q: "How does smoking affect health?", o: ["Damages lungs", "Increases cancer risk", "Affects heart", "All above"], c: [3] },
      { q: "What's good for digestive health?", o: ["Fiber", "Water", "Probiotics", "All above"], c: [3] },
      { q: "Which prevents tooth decay?", o: ["Fluoride", "Flossing", "Less sugar", "All above"], c: [3] },
      { q: "What helps prevent colds?", o: ["Hand washing", "Vitamin C", "Sleep", "All above"], c: [3] },
      { q: "Which is a healthy cooking method?", o: ["Deep frying", "Grilling", "Steaming", "Baking"], c: [1, 2, 3] },
      { q: "What's important for heart health?", o: ["Exercise", "Healthy diet", "No smoking", "All above"], c: [3] },
      { q: "How much sodium per day is recommended?", o: ["1000mg", "2300mg", "3000mg", "4000mg"], c: [1] },
      { q: "Which helps muscle recovery?", o: ["Protein", "Rest", "Hydration", "All above"], c: [3] },
      { q: "What's a sign of good mental health?", o: ["Managing stress", "Good relationships", "Self-care", "All above"], c: [3] },
      { q: "Which foods boost immunity?", o: ["Citrus fruits", "Garlic", "Yogurt", "All above"], c: [3] },
      { q: "What helps prevent diabetes?", o: ["Exercise", "Healthy weight", "Balanced diet", "All above"], c: [3] },
      { q: "Which is important for brain health?", o: ["Omega-3", "Exercise", "Sleep", "All above"], c: [3] },
      { q: "What's a healthy portion size?", o: ["Your palm", "Your fist", "Half your plate", "All above"], c: [3] }
    ]
  },
  2: {
    name: "Intermediate Health",
    questions: [
      { q: "What's the ideal BMI range?", o: ["15-18", "18.5-24.9", "25-30", "30-35"], c: [1] },
      { q: "Which nutrients are antioxidants?", o: ["Vitamin C", "Vitamin E", "Beta-carotene", "All above"], c: [3] },
      { q: "What's the target heart rate during exercise?", o: ["50-70% max", "70-85% max", "85-95% max", "95-100% max"], c: [1] },
      { q: "Which affect blood pressure?", o: ["Sodium intake", "Potassium", "Weight", "All above"], c: [3] },
      { q: "What's metabolic syndrome?", o: ["High BP", "High blood sugar", "Excess belly fat", "All above"], c: [3] },
      { q: "Which vitamins are fat-soluble?", o: ["A, D", "E, K", "B, C", "A, D, E, K"], c: [3] },
      { q: "What affects cholesterol levels?", o: ["Saturated fat", "Trans fat", "Exercise", "All above"], c: [3] },
      { q: "Which are complex carbohydrates?", o: ["White bread", "Brown rice", "Quinoa", "Oats"], c: [1, 2, 3] },
      { q: "What's the glycemic index?", o: ["Blood sugar impact", "Protein content", "Fat content", "Fiber amount"], c: [0] },
      { q: "Which minerals support bone health?", o: ["Calcium", "Magnesium", "Phosphorus", "All above"], c: [3] },
      { q: "What's the recommended fiber intake?", o: ["15g daily", "25-35g daily", "50g daily", "75g daily"], c: [1] },
      { q: "Which affects metabolism?", o: ["Muscle mass", "Age", "Thyroid function", "All above"], c: [3] },
      { q: "What's inflammation linked to?", o: ["Heart disease", "Diabetes", "Cancer", "All above"], c: [3] },
      { q: "Which foods reduce inflammation?", o: ["Fatty fish", "Berries", "Leafy greens", "All above"], c: [3] },
      { q: "What's the difference between HDL and LDL?", o: ["Good vs bad cholesterol", "Types of fat", "Blood proteins", "Sugar levels"], c: [0] },
      { q: "Which affect insulin sensitivity?", o: ["Exercise", "Sleep", "Stress", "All above"], c: [3] },
      { q: "What's the role of probiotics?", o: ["Gut health", "Immunity", "Digestion", "All above"], c: [3] },
      { q: "Which are essential fatty acids?", o: ["Omega-3", "Omega-6", "Both", "Neither"], c: [2] },
      { q: "What affects calcium absorption?", o: ["Vitamin D", "Magnesium", "Phosphorus", "All above"], c: [3] },
      { q: "Which exercise types improve bone density?", o: ["Weight-bearing", "Resistance", "Both", "Neither"], c: [2] },
      { q: "What's the thermic effect of food?", o: ["Energy to digest", "Food temperature", "Spice level", "Cooking method"], c: [0] },
      { q: "Which affects sleep quality?", o: ["Caffeine", "Blue light", "Stress", "All above"], c: [3] },
      { q: "What's sarcopenia?", o: ["Muscle loss", "Bone loss", "Fat gain", "Joint pain"], c: [0] },
      { q: "Which nutrients support immune function?", o: ["Zinc", "Selenium", "Vitamin C", "All above"], c: [3] },
      { q: "What's the DASH diet designed for?", o: ["Weight loss", "Blood pressure", "Diabetes", "Heart health"], c: [1] }
    ]
  },
  3: {
    name: "Advanced Health",
    questions: [
      { q: "What's the mechanism of insulin resistance?", o: ["Cell receptor dysfunction", "Pancreatic failure", "Liver malfunction", "All above"], c: [0] },
      { q: "Which hormones affect appetite?", o: ["Leptin", "Ghrelin", "Both", "Neither"], c: [2] },
      { q: "What's autophagy?", o: ["Cell death", "Cell recycling", "Cell division", "Cell mutation"], c: [1] },
      { q: "Which factors influence epigenetics?", o: ["Diet", "Exercise", "Stress", "All above"], c: [3] },
      { q: "What's the role of mitochondria in aging?", o: ["Energy production", "Oxidative stress", "Both", "Neither"], c: [2] },
      { q: "Which affect circadian rhythm?", o: ["Light exposure", "Meal timing", "Temperature", "All above"], c: [3] },
      { q: "What's hormesis?", o: ["Beneficial stress", "Harmful stress", "No stress", "Chronic stress"], c: [0] },
      { q: "Which are longevity genes?", o: ["FOXO", "SIRT1", "Both", "Neither"], c: [2] },
      { q: "What's the gut-brain axis?", o: ["Neural connection", "Hormonal pathway", "Immune link", "All above"], c: [3] },
      { q: "Which affect telomere length?", o: ["Stress", "Exercise", "Diet", "All above"], c: [3] },
      { q: "What's metabolic flexibility?", o: ["Using different fuels", "Changing metabolism", "Adapting to food", "All above"], c: [0] },
      { q: "Which are heat shock proteins?", o: ["Stress response", "Temperature regulation", "Protein repair", "All above"], c: [3] },
      { q: "What's HIIT's mechanism?", o: ["EPOC effect", "Mitochondrial growth", "Hormone optimization", "All above"], c: [3] },
      { q: "Which affect methylation?", o: ["B vitamins", "Choline", "Betaine", "All above"], c: [3] },
      { q: "What's the mTOR pathway?", o: ["Growth signaling", "Longevity pathway", "Both", "Neither"], c: [2] },
      { q: "Which are senescent cells?", o: ["Old cells", "Damaged cells", "Non-dividing cells", "All above"], c: [3] },
      { q: "What's neuroplasticity?", o: ["Brain adaptation", "Neural growth", "Both", "Neither"], c: [2] },
      { q: "Which affect NAD+ levels?", o: ["Age", "Exercise", "Fasting", "All above"], c: [3] },
      { q: "What's the Warburg effect?", o: ["Cancer metabolism", "Normal metabolism", "Both", "Neither"], c: [0] },
      { q: "Which are xenohormetic compounds?", o: ["Plant stress molecules", "Animal hormones", "Synthetic drugs", "All above"], c: [0] }
    ]
  },
  4: {
    name: "Expert Health",
    questions: [
      { q: "What's the role of AMPK in longevity?", o: ["Energy sensor", "Autophagy activator", "mTOR inhibitor", "All above"], c: [3] },
      { q: "Which pathways regulate lifespan?", o: ["IGF-1/mTOR", "FOXO/SIRT", "AMPK/PGC-1α", "All above"], c: [3] },
      { q: "What's the free radical theory limitation?", o: ["Antioxidant paradox", "Hormesis concept", "Both", "Neither"], c: [2] },
      { q: "Which are NAD+ precursors?", o: ["NR", "NMN", "Both", "Neither"], c: [2] },
      { q: "What's caloric restriction mimetics?", o: ["Compounds mimicking CR", "Calorie restriction", "Both", "Neither"], c: [0] },
      { q: "Which affect protein aggregation?", o: ["Heat shock proteins", "Autophagy", "Chaperones", "All above"], c: [3] },
      { q: "What's the hallmarks of aging?", o: ["Genomic instability", "Telomere attrition", "Epigenetic alterations", "All above"], c: [3] },
      { q: "Which are geroprotectors?", o: ["Metformin", "Rapamycin", "Both", "Neither"], c: [2] },
      { q: "What's the role of sirtuins?", o: ["Deacetylation", "DNA repair", "Stress resistance", "All above"], c: [3] },
      { q: "Which affect stem cell function?", o: ["Age", "Oxidative stress", "Inflammation", "All above"], c: [3] },
      { q: "What's senolytics?", o: ["Senescent cell clearance", "Anti-aging drugs", "Both", "Neither"], c: [2] },
      { q: "Which are longevity interventions?", o: ["Intermittent fasting", "Exercise", "Cold exposure", "All above"], c: [3] },
      { q: "What's the disposable soma theory?", o: ["Energy trade-off", "Reproduction vs longevity", "Both", "Neither"], c: [2] },
      { q: "Which affect epigenetic clocks?", o: ["Age", "Lifestyle", "Environment", "All above"], c: [3] },
      { q: "What's parabiosis research showing?", o: ["Young blood benefits", "Shared circulation", "Both", "Neither"], c: [2] }
    ]
  },
  5: {
    name: "Master Health",
    questions: [
      { q: "What's the unified theory of aging?", o: ["Multiple mechanisms", "Single pathway", "Random damage", "Genetic program"], c: [0] },
      { q: "Which are the most promising longevity targets?", o: ["Senescence", "Mitochondria", "Stem cells", "All above"], c: [3] },
      { q: "What's the maximum human lifespan debate?", o: ["Fixed limit", "Plastic limit", "Both theories valid", "No consensus"], c: [3] },
      { q: "Which epigenetic modifications affect aging?", o: ["DNA methylation", "Histone modifications", "microRNA", "All above"], c: [3] },
      { q: "What's the antagonistic pleiotropy theory?", o: ["Beneficial genes become harmful", "Age-related trade-offs", "Both", "Neither"], c: [2] },
      { q: "Which are emerging longevity biomarkers?", o: ["Epigenetic clocks", "Proteomic signatures", "Metabolomic profiles", "All above"], c: [3] },
      { q: "What's the rate of living theory critique?", o: ["Metabolic rate ≠ lifespan", "Species variations", "Both", "Neither"], c: [2] },
      { q: "Which cellular reprogramming factors show promise?", o: ["Yamanaka factors", "Partial reprogramming", "Both", "Neither"], c: [2] },
      { q: "What's the inflammaging concept?", o: ["Chronic low inflammation", "Age-related immunity", "Both", "Neither"], c: [2] },
      { q: "Which are the most validated longevity interventions?", o: ["Caloric restriction", "Exercise", "Both proven", "Neither proven"], c: [2] }
    ]
  }
};

const COLORS: string[] = ['#2D9AA5', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function HealthQuiz() {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [levelScores, setLevelScores] = useState<Record<number, number>>({});
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(true);

  const shuffle = (array: Question[]): Question[] => [...array].sort(() => Math.random() - 0.5);

  useEffect(() => {
    const levelData = QUIZ_DATA[currentLevel];
    const shuffled = shuffle(levelData.questions);
    const count = currentLevel === 1 ? 30 : currentLevel === 2 ? 25 : currentLevel === 3 ? 20 : currentLevel === 4 ? 15 : 10;
    setQuestions(shuffled.slice(0, count));
    setCurrentQ(0);
    setScore(0);
    setSelected([]);
    setShowResult(false);
  }, [currentLevel]);

  const handleAnswer = (optionIndex: number): void => {
    const isMultipleChoice = questions[currentQ]?.c.length > 1;
    if (isMultipleChoice) {
      // Multiple answers allowed: toggle selection
      if (selected.includes(optionIndex)) {
        setSelected(selected.filter((i: number) => i !== optionIndex));
      } else {
        setSelected([...selected, optionIndex]);
      }
    } else {
      // Single answer: only one can be selected
      setSelected([optionIndex]);
    }
  };

  const checkAnswer = (): void => {
    const correct: number[] = questions[currentQ].c;
    const isCorrect: boolean = correct.length === selected.length && correct.every((c: number) => selected.includes(c));
    if (isCorrect) setScore(score + 1);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected([]);
    } else {
      const finalScore: number = isCorrect ? score + 1 : score;
      setLevelScores({...levelScores, [currentLevel]: finalScore});
      setShowResult(true);
    }
  };

  const nextLevel = (): void => {
    if (currentLevel < 5) {
      setCurrentLevel(currentLevel + 1);
    } else {
      setGameComplete(true);
    }
  };

  const resetQuiz = (): void => {
    setCurrentLevel(1);
    setLevelScores({});
    setGameComplete(false);
    setShowLevelSelect(true);
  };

  const getChartData = (): ChartData[] => {
    return Object.entries(levelScores).map(([level, score]: [string, number]) => {
      const levelNum: number = parseInt(level);
      const total: number = levelNum === 1 ? 30 : levelNum === 2 ? 25 : levelNum === 3 ? 20 : levelNum === 4 ? 15 : 10;
      return {
        level: `Level ${level}`,
        score: score,
        percentage: Math.round((score / total) * 100),
        total: total
      };
    });
  };

  if (showLevelSelect) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#2D9AA5'}}>Select Quiz Level</h2>
          {[1,2,3,4,5].map(level => (
            <button
              key={level}
              onClick={() => {
                setCurrentLevel(level);
                setShowLevelSelect(false);
              }}
              className="block w-full my-2 px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
              style={{backgroundColor: '#2D9AA5'}}
            >
              Level {level}: {QUIZ_DATA[level].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            {Object.keys(levelScores).length === 5 && Object.entries(levelScores).every(([level, score]) => {
              const total = parseInt(level) === 1 ? 30 : parseInt(level) === 2 ? 25 : parseInt(level) === 3 ? 20 : parseInt(level) === 4 ? 15 : 10;
              return (score / total) * 100 >= 70; // 70% passing threshold
            }) ? (
              <>
                <h1 className="text-4xl font-bold text-black mb-4">Congratulations!</h1>
                <p className="text-xl text-black">You've completed all 5 levels!</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-black mb-4">Quiz Complete</h1>
                <p className="text-xl text-black">You did not pass all levels. See your performance summary below.</p>
              </>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-center mb-6" style={{color: '#2D9AA5'}}>Your Performance Summary</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {getChartData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={resetQuiz}
              className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
              style={{backgroundColor: '#2D9AA5'}}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              {percentage >= 70 ? 
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" /> :
                <XCircle className="w-20 h-20 text-red-500 mx-auto" />
              }
            </div>
            
            <h2 className="text-3xl font-bold mb-4" style={{color: '#2D9AA5'}}>
              Level {currentLevel} Complete!
            </h2>
            <p className="text-xl mb-6 text-black">Score: {score}/{questions.length} ({percentage}%)</p>
            
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{level: `Level ${currentLevel}`, score: percentage}]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="level" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#1f2937', fontSize: 14, fontWeight: 600 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#1f2937', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="url(#colorGradient)" 
                    radius={[8, 8, 0, 0]}
                    stroke="#e5e7eb"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B6B" />
                      <stop offset="25%" stopColor="#4ECDC4" />
                      <stop offset="50%" stopColor="#45B7D1" />
                      <stop offset="75%" stopColor="#96CEB4" />
                      <stop offset="100%" stopColor="#FFEAA7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {percentage >= 85 ? (
              <button
                onClick={nextLevel}
                className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
                style={{backgroundColor: '#2D9AA5'}}
              >
                Next Level
              </button>
            ) : (
              <button
                onClick={() => setGameComplete(true)}
                className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
                style={{backgroundColor: '#2D9AA5'}}
              >
                View Final Results
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  const currentQuestion: Question = questions[currentQ];
  const percentage: number = Math.round((score / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 mr-2" style={{color: '#2D9AA5'}} />
            <h1 className="text-3xl font-bold text-black">Health Quiz</h1>
          </div>
          <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-md">
            <span className="font-semibold" style={{color: '#2D9AA5'}}>
              Level {currentLevel}: {QUIZ_DATA[currentLevel].name}
            </span>
            <span className="text-black">
              {currentQ + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQ + 1) / questions.length) * 100}%`,
                backgroundColor: '#2D9AA5'
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-black">
            {currentQuestion.q}
          </h2>
          
          <div className="space-y-3">
            {currentQuestion.o.map((option: string, idx: number) => {
              const isMultipleChoice = currentQuestion.c.length > 1;
              const isSelected = selected.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-opacity-100 text-white'
                      : 'border-gray-200 hover:border-gray-300 text-black bg-gray-50'
                  }`}
                  style={isSelected ? {
                    backgroundColor: '#2D9AA5',
                    borderColor: '#2D9AA5'
                  } : {}}
                >
                  <span className="flex items-center">
                    {isMultipleChoice ? (
                      <span className={`w-5 h-5 mr-3 border-2 flex-shrink-0 ${
                        isSelected ? 'bg-white border-white' : 'border-gray-300'
                      }`} />
                    ) : (
                      <span className={`w-5 h-5 rounded-full mr-3 border-2 flex-shrink-0 ${
                        isSelected ? 'bg-white border-white' : 'border-gray-300'
                      }`} />
                    )}
                    {option}
                    {/* Show tick for selected options in multiple-choice */}
                    {isMultipleChoice && isSelected && (
                      <span className="ml-2 text-lg">✔️</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={checkAnswer}
            disabled={selected.length === 0}
            className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
            style={{backgroundColor: '#2D9AA5'}}
          >
            {currentQ === questions.length - 1 ? 'Finish Level' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HealthQuiz;

HealthQuiz.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}