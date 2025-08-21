import React, { useState } from 'react';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  MapPin,
  Search
} from 'lucide-react';

interface Disease {
  id: string;
  name: string;
  image: string;
  color: string;
  questions: string[];
}

interface Answer {
  [key: number]: string;
}

const KnowHealth: React.FC = () => {
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const diseases: Disease[] = [
    {
      id: 'fever',
      name: 'Fever',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center',
      color: 'from-red-400 to-red-600',
      questions: [
        'Do you have a body temperature above 100.4°F (38°C)?',
        'Are you experiencing chills or shivering?',
        'Do you have a headache?',
        'Are you feeling unusually tired or weak?',
        'Do you have muscle aches or body pain?',
        'Are you experiencing sweating?',
        'Do you have a loss of appetite?',
        'Are you feeling nauseous?',
        'Do you have a sore throat?',
        'Are you experiencing difficulty sleeping?'
      ]
    },
    {
      id: 'std',
      name: 'STD',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=center',
      color: 'from-purple-400 to-purple-600',
      questions: [
        'Do you have unusual discharge from genital area?',
        'Are you experiencing pain during urination?',
        'Do you have sores or bumps in the genital area?',
        'Are you experiencing itching in the genital area?',
        'Do you have pelvic pain (for women)?',
        'Are you experiencing pain during intercourse?',
        'Do you have swollen lymph nodes in the groin?',
        'Are you experiencing unusual bleeding?',
        'Do you have a rash in the genital area?',
        'Are you experiencing flu-like symptoms with genital symptoms?'
      ]
    },
    {
      id: 'liver',
      name: 'Liver',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=300&fit=crop&crop=center',
      color: 'from-amber-400 to-amber-600',
      questions: [
        'Do you have yellowing of skin or eyes (jaundice)?',
        'Are you experiencing abdominal pain in the upper right area?',
        'Do you have dark-colored urine?',
        'Are you experiencing unusual fatigue?',
        'Do you have pale or clay-colored stools?',
        'Are you feeling nauseous or vomiting?',
        'Do you have swelling in legs and ankles?',
        'Are you experiencing loss of appetite?',
        'Do you have easy bruising or bleeding?',
        'Are you experiencing confusion or difficulty thinking?'
      ]
    },
    {
      id: 'vitamins',
      name: 'Vitamin Deficiency',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center',
      color: 'from-green-400 to-green-600',
      questions: [
        'Are you experiencing unusual fatigue or weakness?',
        'Do you have frequent infections or slow healing?',
        'Are you experiencing hair loss or brittle nails?',
        'Do you have muscle weakness or bone pain?',
        'Are you experiencing mood changes or depression?',
        'Do you have vision problems, especially night vision?',
        'Are you experiencing numbness or tingling in hands/feet?',
        'Do you have frequent bleeding gums?',
        'Are you experiencing memory problems or confusion?',
        'Do you have pale skin or cold hands and feet?'
      ]
    },
    {
      id: 'diabetes',
      name: 'Diabetes',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=300&fit=crop&crop=center',
      color: 'from-blue-400 to-blue-600',
      questions: [
        'Are you experiencing excessive thirst?',
        'Do you have frequent urination?',
        'Are you feeling unusually hungry?',
        'Have you noticed unexplained weight loss?',
        'Are you experiencing blurred vision?',
        'Do you have slow-healing cuts or wounds?',
        'Are you feeling unusually tired?',
        'Do you have frequent infections?',
        'Are you experiencing tingling in hands or feet?',
        'Do you have dry, itchy skin?'
      ]
    },
    {
      id: 'heart',
      name: 'Heart Disease',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=center',
      color: 'from-rose-400 to-rose-600',
      questions: [
        'Are you experiencing chest pain or discomfort?',
        'Do you have shortness of breath during normal activities?',
        'Are you experiencing rapid or irregular heartbeat?',
        'Do you have swelling in legs, ankles, or feet?',
        'Are you feeling unusually tired or weak?',
        'Do you have dizziness or lightheadedness?',
        'Are you experiencing pain in arms, neck, jaw, or back?',
        'Do you have difficulty lying flat due to breathing problems?',
        'Are you experiencing cold sweats?',
        'Do you have a persistent cough with white or pink phlegm?'
      ]
    },
    {
      id: 'thyroid',
      name: 'Thyroid',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center',
      color: 'from-teal-400 to-teal-600',
      questions: [
        'Are you experiencing unexplained weight changes?',
        'Do you have changes in heart rate (fast or slow)?',
        'Are you feeling unusually tired or energetic?',
        'Do you have changes in body temperature sensitivity?',
        'Are you experiencing mood changes or anxiety?',
        'Do you have changes in hair texture or hair loss?',
        'Are you experiencing changes in bowel movements?',
        'Do you have muscle weakness or tremors?',
        'Are you experiencing changes in menstrual cycle (for women)?',
        'Do you have difficulty concentrating or memory problems?'
      ]
    },
    {
      id: 'kidney',
      name: 'Kidney Disease',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=300&fit=crop&crop=center',
      color: 'from-indigo-400 to-indigo-600',
      questions: [
        'Are you experiencing changes in urination frequency?',
        'Do you have swelling in legs, ankles, or around eyes?',
        'Are you feeling unusually tired or weak?',
        'Do you have persistent back pain below the ribs?',
        'Are you experiencing nausea or vomiting?',
        'Do you have a metallic taste in your mouth?',
        'Are you experiencing shortness of breath?',
        'Do you have foamy or bloody urine?',
        'Are you having trouble sleeping?',
        'Do you have muscle cramps or twitching?'
      ]
    },
    {
      id: 'cancer',
      name: 'Cancer',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=center',
      color: 'from-orange-400 to-orange-600',
      questions: [
        'Have you noticed unexplained weight loss?',
        'Are you experiencing persistent fatigue?',
        'Do you have persistent pain in any area?',
        'Have you noticed any unusual lumps or growths?',
        'Are you experiencing persistent cough or hoarseness?',
        'Do you have changes in bowel or bladder habits?',
        'Are you experiencing unusual bleeding or discharge?',
        'Do you have persistent indigestion or swallowing difficulty?',
        'Have you noticed changes in a mole or skin lesion?',
        'Are you experiencing persistent fever or night sweats?'
      ]
    },
    {
      id: 'respiratory',
      name: 'Respiratory',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center',
      color: 'from-cyan-400 to-cyan-600',
      questions: [
        'Are you experiencing persistent cough?',
        'Do you have shortness of breath during normal activities?',
        'Are you experiencing chest tightness or pain?',
        'Do you have wheezing or whistling sounds when breathing?',
        'Are you coughing up mucus or blood?',
        'Do you have frequent respiratory infections?',
        'Are you experiencing difficulty breathing when lying down?',
        'Do you have a persistent sore throat?',
        'Are you experiencing fatigue due to breathing difficulties?',
        'Do you have nasal congestion or sinus pressure?'
      ]
    }
  ];

  const handleDiseaseSelect = (disease: Disease): void => {
    setSelectedDisease(disease);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (answer: string): void => {
    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: answer
    };
    setAnswers(newAnswers);

    if (selectedDisease && currentQuestionIndex < selectedDisease.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const getResults = () => {
    const yesAnswers = Object.values(answers).filter(answer => answer === 'yes').length;
    const totalQuestions = selectedDisease?.questions.length || 0;
    const percentage = (yesAnswers / totalQuestions) * 100;

    if (percentage >= 60) {
      return {
        type: 'high' as const,
        message: 'Zeva cares for you. You need good and right treatment.',
        recommendation: 'Based on your symptoms, we recommend consulting with a healthcare professional immediately.'
      };
    } else if (percentage >= 30) {
      return {
        type: 'medium' as const,
        message: 'Some symptoms match. Zeva can help you find the right care.',
        recommendation: 'Consider scheduling a consultation to discuss your symptoms with a qualified doctor.'
      };
    } else {
      return {
        type: 'low' as const,
        message: 'Good news! Your symptoms appear minimal.',
        recommendation: 'Stay healthy with Zeva! Find nearby clinics and doctors for regular checkups.'
      };
    }
  };

  const resetTest = (): void => {
    setSelectedDisease(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults && selectedDisease) {
    const results = getResults();
    const yesAnswers = Object.values(answers).filter(answer => answer === 'yes').length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={resetTest}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Health Check
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className={`relative w-20 h-20 mx-auto rounded-full overflow-hidden mb-4`}>
                <img 
                  src={selectedDisease.image} 
                  alt={selectedDisease.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${selectedDisease.color} opacity-80`}></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedDisease.name} Assessment</h2>
              <p className="text-gray-600">Results: {yesAnswers} out of {selectedDisease.questions.length} symptoms</p>
            </div>

            <div className={`p-6 rounded-xl mb-6 ${
              results.type === 'high' ? 'bg-red-50 border border-red-200' :
              results.type === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-2 ${
                results.type === 'high' ? 'text-red-700' :
                results.type === 'medium' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {results.message}
              </h3>
              <p className="text-gray-700">{results.recommendation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                <MapPin className="w-5 h-5" />
                Find Nearby Clinics
              </button>
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                <Search className="w-5 h-5" />
                Find Doctors
              </button>
            </div>

            <button
              onClick={resetTest}
              className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedDisease) {
    const currentQuestion = selectedDisease.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedDisease.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedDisease(null)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Diseases
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden mb-4">
                <img 
                  src={selectedDisease.image} 
                  alt={selectedDisease.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${selectedDisease.color} opacity-80`}></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedDisease.name} Screening</h2>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {selectedDisease.questions.length}</p>
            </div>

            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer('yes')}
                className="flex items-center justify-center gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all duration-300 group"
              >
                <CheckCircle className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-semibold text-green-700">Yes</span>
              </button>
              <button
                onClick={() => handleAnswer('no')}
                className="flex items-center justify-center gap-3 p-6 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-300 group"
              >
                <XCircle className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-semibold text-red-700">No</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Know Your <span className="text-[#2D9AA5]">Health</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Take a quick health screening to understand your symptoms better. 
            Zeva is here to help you find the right care when you need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {diseases.map((disease) => (
            <div
              key={disease.id}
              onClick={() => handleDiseaseSelect(disease)}
              className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6"
            >
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={disease.image} 
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${disease.color} opacity-70`}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#2D9AA5] transition-colors">
                  {disease.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Click to start screening
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-[#2D9AA5] transition-colors">
                  10 Questions
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Professional Healthcare at Your Fingertips
            </h2>
            <p className="text-gray-600 mb-6">
              Our health screening tool is designed to help you understand your symptoms better. 
              Remember, this is not a substitute for professional medical advice.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-[#2D9AA5]/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-[#2D9AA5] flex-shrink-0" />
                <span className="text-gray-700">Quick & Easy Assessment</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#2D9AA5]/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-[#2D9AA5] flex-shrink-0" />
                <span className="text-gray-700">Find Nearby Healthcare</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowHealth;