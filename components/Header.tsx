import React, { useState} from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { useRouter } from 'next/router';

// Define a type for navigation items
interface NavItem {
  name: string;
  href: string;
  icon: string;
  action?: () => void;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  // Navigation items - dynamically change based on auth status
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { name: 'Home', href: '/', icon: '🏠' },
      // { name: 'About', href: '/about', icon: '🌿' },
      // { name: 'Blog', href: '/blogs1', icon: '📖' },
      // { name: 'Contact', href: '/contact', icon: '📞' },
    ];

    if (isAuthenticated) {
      return [
        ...baseItems,
        // { name: 'Profile', href: '/profile', icon: '👤' },
        // { name: 'Clinic Login', href: '/clinic/login-clinic', icon: '🔐' },
      ];
    } else {
      return [
        ...baseItems,
        { name: 'Doctor Login', href: '/doctor/login', icon: '🩺' },
        { name: 'User Login', href: '#', icon: '🔑', action: () => openAuthModal('login') },
        { name: 'Clinic Login', href: '/clinic/login-clinic', icon: '🏥' },
      ];
    }
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Optional: Show success message or redirect
  };

 const handleLogout = () => {
  logout();
  router.push('/');
};
  const navItems = getNavItems();

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-green-100 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-xl text-white">🌿</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-80 animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                  AyurVeda
                </h1>
                <p className="text-xs text-green-600 font-medium -mt-1">NEAR ME</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="group relative px-4 py-2 rounded-full text-gray-700 hover:text-green-700 font-medium transition-all duration-300 hover:bg-green-50"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:w-full transition-all duration-300"></div>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group relative px-4 py-2 rounded-full text-gray-700 hover:text-green-700 font-medium transition-all duration-300 hover:bg-green-50"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:w-full transition-all duration-300"></div>
                  </Link>
                )
              ))}
              
              {/* User Menu for Authenticated Users */}
              {isAuthenticated && (
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-700 hover:text-green-700 font-medium transition-all duration-300 hover:bg-green-50">
                    <span className="text-sm">👤</span>
                    <span>{user?.name}</span>
                    <span className="text-xs">▼</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="py-2">
                      <Link
                        href="/Profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <span>👤</span>
                        <span>My Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA & Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Register Clinic Button */}
              <Link
                href="/clinic/register-clinic"
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
              >
                <span>🏥</span>
                <span>Register your clinic</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative w-10 h-10 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors duration-300"
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-green-700 transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-green-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-green-700 transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
            <div className="pt-4 space-y-2">
              {navItems.map((item) => (
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:text-green-700 hover:bg-green-50 font-medium transition-all duration-300 group text-left"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:text-green-700 hover:bg-green-50 font-medium transition-all duration-300 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                )
              ))}
              
              {/* Mobile User Menu */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-600">Signed in as:</p>
                    <p className="font-medium text-gray-800">{user?.name}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:text-green-700 hover:bg-green-50 font-medium transition-all duration-300"
                  >
                    <span className="text-lg">👤</span>
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:text-red-700 hover:bg-red-50 font-medium transition-all duration-300 text-left"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Top Bar */}
        <div className="hidden md:block bg-gradient-to-r from-green-700 to-emerald-700 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <span className="flex items-center space-x-2">
                  {/* <span>📞</span> */}
                  {/* <span>+91 98765 43210</span> */}
                </span>
                <span className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>info@ayurvedanearme.ae</span>
                </span>
              </div>
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <span>Welcome, {user?.name}!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;