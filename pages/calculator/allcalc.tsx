// pages/allcalc.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { calculators } from '../../components/CalculatorGames';

function AllCalculators(){
  const router = useRouter();

  const handleCalculatorClick = (calculatorId: string) => {
    router.push(`/calculator/${calculatorId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2D9AA5] to-[#1e6b73] py-8 px-4 sm:py-10 sm:px-6 md:py-12 md:px-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Title and description */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                Health Calculators
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
                Comprehensive tools to monitor and optimize your health journey
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <div className="w-20 h-1 bg-white/60 rounded-full"></div>
              </div>
            </div>
            
            {/* Right side - Stats */}
            <div className="lg:justify-self-end">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 sm:p-8">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                      {calculators.length}+
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm">Health Tools</div>
                  </div>
                  <div className="text-center border-l border-r border-white/20">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">100%</div>
                    <div className="text-white/80 text-xs sm:text-sm">Free to Use</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">24/7</div>
                    <div className="text-white/80 text-xs sm:text-sm">Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 translate-y-16"></div>
      </div>

      {/* Calculators Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        

        {/* Calculator Cards Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {calculators.map((calc, index) => {
            const Icon = calc.icon;
            return (
              <div
                key={calc.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
                onClick={() => handleCalculatorClick(calc.id)}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src={calc.image} 
                    alt={calc.title} 
                    className="w-full h-36 sm:h-40 md:h-44 object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Floating Icon */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Icon className="text-[#2D9AA5]" size={18} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start mb-3">
                    <div className="w-8 h-8 bg-[#2D9AA5]/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Icon className="text-[#2D9AA5]" size={16} />
                    </div>
                    <h2 className="text-gray-900 text-base sm:text-lg font-bold leading-tight group-hover:text-[#2D9AA5] transition-colors duration-300">
                      {calc.title}
                    </h2>
                  </div>
                  
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                    {calc.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => handleCalculatorClick(calc.id)}
                      className="bg-[#2D9AA5] hover:bg-[#237a83] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Calculate
                    </button>
                    <div className="flex items-center text-xs text-gray-500">
                      {/* <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                      Free */}
                    </div>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#2D9AA5] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Extra small screens */
        @media (max-width: 475px) {
          .xs\\:grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }

        /* Responsive text sizing */
        @media (max-width: 640px) {
          .grid {
            gap: 1rem;
          }
        }

        /* Hover effects for touch devices */
        @media (hover: none) and (pointer: coarse) {
          .group:hover .group-hover\\:scale-110 {
            transform: scale(1);
          }
          .group:hover .group-hover\\:-translate-y-2 {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AllCalculators;

AllCalculators.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}