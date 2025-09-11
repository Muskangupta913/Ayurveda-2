import React, { useState, useRef, useEffect } from 'react';
import {Baby, Dumbbell, Scale, Activity, Wind, Apple, Calculator, ArrowRight, ChevronLeft, ChevronRight, Gamepad2, Target, Zap, Brain, Heart, Timer, BookOpen } from 'lucide-react';
export interface Calculator {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  image: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  image: string;
}

export const calculators: Calculator[] = [
  {
    id: 'pregnancy-and-ovulation/pregnancy&ovulation',
    title: 'Pregnancy & Ovulation Calculator',
    description: ' Free Pregnancy Calculator & Ovulation Calendar to track your cycle',
    icon: Baby,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=400&h=200&fit=crop&auto=format'
  },
  {
    id: 'bmi',
    title: 'BMI Calculator',
    description: 'Calculate your Body Mass Index and understand your weight category',
    icon: Scale,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=400&h=200&fit=crop'
  },
  {
    id: 'bmr-tdee',
    title: 'BMR-TDEE Calculator',
    description: 'Calculate Basal Metabolic Rate & Total Daily Energy Expenditure',
    icon: Activity,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop'
  },
  {
    id: 'depression-test',
    title: 'Depression Test Calculator',
    description: 'Begin a gentle test to understand depression signs',
    icon: Brain,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1628563694622-5a76957fd09c?w=400&h=200&fit=crop'
  },
  {
    id: 'breathhold',
    title: 'Breath Hold Calculator',
    description: 'Track your breath holding capacity and improve lung health',
    icon: Wind,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop'
  },
  {
    id: 'calorie-counter',
    title: 'Calorie Count Calculator',
    description: 'Track your daily calorie intake and maintain healthy diet',
    icon: Apple,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop'
  },
  {
    id: 'heartrate',
    title: 'Heart Rate Monitor',
    description: 'Monitor your heart rate and cardiovascular health',
    icon: Activity,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=cro'
  },
  {
    id: 'water',
    title: 'Water Intake Tracker',
    description: 'Track your daily water consumption for optimal hydration',
    icon: Apple,
    color: 'from-[#2D9AA5] to-[#238a94]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=200&fit=crop'
  }
];

export const games: Game[] = [
  {
    id: 'quiz',
    title: 'Health Quiz Challenge',
    description: 'Test your health knowledge with quizzes',
    icon: BookOpen,
    color: 'from-[#64B5F6] to-[#5aa3e8]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop'
  },
  {
    id: 'flipcards',
    title: 'FitFlip Cards',
    description: 'Match exercises, burn calories fast.',
    icon: Dumbbell, // More fitting for fitness than Brain
    color: 'from-[#FF6B6B] to-[#4ECDC4]', // Energetic red to refreshing teal gradient
    bgColor: 'bg-white',
    borderColor: 'border-grey-200', // Complementary border
    hoverColor: 'hover:shadow-xl hover:scale-105 hover:border-orange-300', // More dynamic hover effect
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=200&fit=crop' // Fitness/workout equipment image
  },


  {
    id: 'fitwithzeva',
    title: 'Be Fit with Zeva',
    description: 'Build immunity and strength with fun exercises',
    icon: Heart,
    color: 'from-[#FF8A65] to-[#f4795b]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=200&fit=crop'
  },
  {
    id: 'HealthyFood',
    title: 'Healthy Food Picker Game',
    description: 'Smash junk, grab greens, beat the clock!',
    icon: Target,
    color: 'from-[#4ECDC4] to-[#44b3ac]',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:shadow-lg',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop'
  },
  // {
  //   id: 'workout-timer',
  //   title: 'Workout Timer Challenge',
  //   description: 'Complete timed exercises and build healthy workout habits',
  //   icon: Timer,
  //   color: 'from-[#9C27B0] to-[#8e24aa]',
  //   bgColor: 'bg-white',
  //   borderColor: 'border-gray-200',
  //   hoverColor: 'hover:shadow-lg',
  //   image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop'
  // },
  // {
  //   id: 'sleep-puzzle',
  //   title: 'Sleep Cycle Puzzle',
  //   description: 'Solve puzzles while learning about healthy sleep patterns',
  //   icon: Brain,
  //   color: 'from-[#7986CB] to-[#6a7bc2]',
  //   bgColor: 'bg-white',
  //   borderColor: 'border-gray-200',
  //   hoverColor: 'hover:shadow-lg',
  //   image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=200&fit=crop'
  // }
];

const HealthCalculatorApp: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<string>('home');
  const sliderRef = useRef<HTMLDivElement>(null);
  const gamesSliderRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Restore calculator slider scroll
    const calcScroll = localStorage.getItem('calcSliderScroll');
    if (sliderRef.current && calcScroll) {
      sliderRef.current.scrollLeft = parseInt(calcScroll, 10);
      localStorage.removeItem('calcSliderScroll');
    }
    // Restore games slider scroll
    const gamesScroll = localStorage.getItem('gamesSliderScroll');
    if (gamesSliderRef.current && gamesScroll) {
      gamesSliderRef.current.scrollLeft = parseInt(gamesScroll, 10);
      localStorage.removeItem('gamesSliderScroll');
    }
    // Manual scroll restoration using localStorage flag
    if (localStorage.getItem('shouldScrollToGames') === 'true' && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      localStorage.removeItem('shouldScrollToGames');
    }
    // Robust scroll to section if hash is present
    function scrollToSectionIfHash() {
      if (window.location.hash === '#games-section' && sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // Scroll on mount
    scrollToSectionIfHash();
    // Scroll on hash change
    window.addEventListener('hashchange', scrollToSectionIfHash);
    // Scroll on popstate (browser back/forward)
    window.addEventListener('popstate', scrollToSectionIfHash);
    // Try again after a short delay
    setTimeout(scrollToSectionIfHash, 100);
    return () => {
      window.removeEventListener('hashchange', scrollToSectionIfHash);
      window.removeEventListener('popstate', scrollToSectionIfHash);
    };
  }, []);

  const scrollLeft = (): void => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = (): void => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const scrollGamesLeft = (): void => {
    if (gamesSliderRef.current) {
      gamesSliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollGamesRight = (): void => {
    if (gamesSliderRef.current) {
      gamesSliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const NavigationBar: React.FC = () => (
    <div ref={sectionRef} id="games-section" className="bg-white rounded-2xl p-6 mb-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#2D9AA5' }}>Track Your Health Status</h1>
      </div>

      {/* Calculators Slider Container */}
      <div className="relative mb-12 px-12">
        {/* Left Arrow - Positioned closer to cards */}
        <button
          onClick={scrollLeft}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-orange-500 shadow-lg rounded-full p-3 text-white hover:bg-orange-600 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Right Arrow - Positioned closer to cards */}
        <button
          onClick={scrollRight}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-orange-500 shadow-lg rounded-full p-3 text-white hover:bg-orange-600 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight size={15} />
        </button>

        {/* Scrollable Cards Container - Display exactly 3 cards */}
        <div
          ref={sliderRef}
          className="flex overflow-x-auto scrollbar-hide gap-6 pb-4 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {calculators.map((calc: Calculator) => {
            const IconComponent = calc.icon;
            return (
              <div
                key={calc.id}
                className={`${calc.bgColor} ${calc.borderColor} ${calc.hoverColor} flex-shrink-0 border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 group overflow-hidden`}
                style={{
                  width: 'calc((100% - 3rem) / 3)', // Exactly 3 cards with gaps
                  minWidth: '280px' // Minimum width for responsiveness
                }}
              >
                {/* Image Section */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={calc.image}
                    alt={calc.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <div className={`bg-gradient-to-r ${calc.color} p-2 rounded-lg shadow-lg`}>
                      <IconComponent className="text-white" size={20} />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">{calc.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{calc.description}</p>
                  <a
                    href={`/calculator/${calc.id}#games-section`}
                    onClick={() => {
                      if (sliderRef.current) {
                        localStorage.setItem('calcSliderScroll', sliderRef.current.scrollLeft.toString());
                      }
                      localStorage.setItem('shouldScrollToGames', 'true');
                    }}
                    className="inline-flex items-center bg-[#2D9AA5] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#238a94] transition-colors"
                  >
                    Calculate Now
                    <ArrowRight size={16} className="ml-2" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <a
            href="/calculator/allcalc#games-section"
            onClick={() => {
              if (sliderRef.current) {
                localStorage.setItem('calcSliderScroll', sliderRef.current.scrollLeft.toString());
              }
              localStorage.setItem('shouldScrollToGames', 'true');
            }}
            className="inline-flex items-center bg-orange-400 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors"
          >
            View All Calculators
            <ArrowRight size={20} className="ml-2" />
          </a>
        </div>
      </div>

      {/* Health Games Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#2D9AA5' }}>Health & Wellness Games</h1>
      </div>

      {/* Games Slider Container */}
      <div className="relative px-12">
        {/* Left Arrow - Positioned closer to cards */}
        <button
          onClick={scrollGamesLeft}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-orange-500 shadow-lg rounded-full p-3 text-white hover:bg-orange-600 transition-colors"
          aria-label="Scroll games left"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Right Arrow - Positioned closer to cards */}
        <button
          onClick={scrollGamesRight}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-orange-500 shadow-lg rounded-full p-3 text-white hover:bg-orange-600 transition-colors"
          aria-label="Scroll games right"
        >
          <ChevronRight size={15} />
        </button>

        {/* Scrollable Games Cards Container - Display exactly 3 cards */}
        <div
          ref={gamesSliderRef}
          className="flex overflow-x-auto scrollbar-hide gap-6 pb-4 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {games.map((game: Game) => {
            const IconComponent = game.icon;
            return (
              <div
                key={game.id}
                className={`${game.bgColor} ${game.borderColor} ${game.hoverColor} flex-shrink-0 border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 group overflow-hidden`}
                style={{
                  width: 'calc((100% - 3rem) / 3)', // Exactly 3 cards with gaps
                  minWidth: '280px' // Minimum width for responsiveness
                }}
              >
                {/* Image Section */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <div className={`bg-gradient-to-r ${game.color} p-2 rounded-lg shadow-lg`}>
                      <IconComponent className="text-white" size={20} />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">{game.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{game.description}</p>
                  <a
                    href={`/games/${game.id}#games-section`}
                    onClick={() => {
                      if (gamesSliderRef.current) {
                        localStorage.setItem('gamesSliderScroll', gamesSliderRef.current.scrollLeft.toString());
                      }
                      localStorage.setItem('shouldScrollToGames', 'true');
                    }}
                    className="inline-flex items-center bg-[#FF6B6B] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#ee5a52] transition-colors"
                  >
                    Play Now
                    <Gamepad2 size={16} className="ml-2" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Games Button */}
        <div className="text-center mt-8">
          <a
            href="/games/allgames#games-section"
            onClick={() => {
              if (gamesSliderRef.current) {
                localStorage.setItem('gamesSliderScroll', gamesSliderRef.current.scrollLeft.toString());
              }
              localStorage.setItem('shouldScrollToGames', 'true');
            }}
            className="inline-flex items-center bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-purple-600 transition-colors"
          >
            View All Games
            <Gamepad2 size={20} className="ml-2" />
          </a>
        </div>
      </div>
    </div>
  );

  const SimpleCalculatorView: React.FC<{ title: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = ({ title, icon: IconComponent }) => (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center">
        <IconComponent className="mx-auto mb-4 text-[#2D9AA5]" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="bg-[#2D9AA5]/10 p-8 rounded-lg border border-[#2D9AA5]/30">
          <p className="text-gray-600 text-lg mb-4">
            This calculator will help you monitor your health metrics effectively.
          </p>
          <div className="text-4xl font-bold text-[#2D9AA5] mb-2">Ready</div>
          <div className="text-gray-700 font-medium">Calculator Interface</div>
        </div>
      </div>
    </div>
  );

  const renderCalculator = () => {
    const currentCalc = calculators.find(calc => calc.id === activeCalculator);

    switch (activeCalculator) {
      case 'bmi':
        return <SimpleCalculatorView title="BMI Calculator" icon={Scale} />;
      case 'bmr':
        return <SimpleCalculatorView title="BMR-TDEE Calculator" icon={Activity} />;
      case 'breath':
        return <SimpleCalculatorView title="Breath Hold Calculator" icon={Wind} />;
      case 'calorie':
        return <SimpleCalculatorView title="Calorie Count Calculator" icon={Apple} />;
      case 'heart':
        return <SimpleCalculatorView title="Heart Rate Monitor" icon={Activity} />;
      case 'water':
        return <SimpleCalculatorView title="Water Intake Tracker" icon={Apple} />;
      default:
        return <NavigationBar />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#2D9AA5]/10 p-6">
      <div className="max-w-7xl mx-auto">
        {renderCalculator()}
      </div>
    </div>
  );
};

export default HealthCalculatorApp;