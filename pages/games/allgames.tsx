// pages/allgames.tsx
import React from 'react';
import { games } from '../../components/CalculatorGames';

function AllGames(){

  const handleGameClick = (gameId: string) => {
    // For now, just log the game ID
    console.log(`Navigating to game: ${gameId}`);
    // You can implement navigation later
    // router.push(`/games/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B6B] to-[#ee5a52] py-8 px-4 sm:py-10 sm:px-6 md:py-12 md:px-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Title and description */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                Health Games
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
                Fun and interactive games to learn about health and wellness
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
                      {games.length}+
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm">Health Games</div>
                  </div>
                  <div className="text-center border-l border-r border-white/20">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">100%</div>
                    <div className="text-white/80 text-xs sm:text-sm">Free to Play</div>
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

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        
        {/* Games Cards Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
                onClick={() => handleGameClick(game.id)}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="w-full h-36 sm:h-40 md:h-44 object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Floating Icon */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Icon className="text-[#FF6B6B]" size={18} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start mb-3">
                    <div className="w-8 h-8 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Icon className="text-[#FF6B6B]" size={16} />
                    </div>
                    <h2 className="text-gray-900 text-base sm:text-lg font-bold leading-tight group-hover:text-[#FF6B6B] transition-colors duration-300">
                      {game.title}
                    </h2>
                  </div>
                  
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                    {game.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => handleGameClick(game.id)}
                      className="bg-[#FF6B6B] hover:bg-[#ee5a52] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Play Now
                    </button>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                      Free
                    </div>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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

export default AllGames;

AllGames.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
}
