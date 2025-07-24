// components/AuthModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: ''
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone);
      }
      setFormData({ name: '', email: '', password: '', phone: '' });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ name: '', email: '', password: '', phone: '' });
  };

  const handleClose = () => {
    setError('');
    setFormData({ name: '', email: '', password: '', phone: '' });
    onClose();
  };

  const handleCloseButtonClick = (e: React.MouseEvent) => {
    // console.log('Close button clicked!'); // Debug log
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto relative scrollbar-hide mx-auto overflow-x-hidden">
        {/* Custom scrollbar styles */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* Internet Explorer 10+ */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar { 
            display: none;  /* Safari and Chrome */
          }
        `}</style>

        {/* Decorative Elements - Contained within modal */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full -translate-y-10 translate-x-10 sm:-translate-y-16 sm:translate-x-16 overflow-hidden"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-lime-400/20 to-green-400/20 rounded-full translate-y-8 -translate-x-8 sm:translate-y-12 sm:-translate-x-12 overflow-hidden"></div>

        {/* Close Button - Touch friendly */}
        <button
          type="button"
          onClick={handleCloseButtonClick}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 sm:p-2 transition-all duration-200 z-50 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        {/* Header - Responsive padding and text */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white p-4 pb-6 sm:p-6 sm:pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 pr-12 sm:pr-0">
              {mode === 'login' ? '🌿 Welcome Back!' : '🌱 Join Our Wellness Journey!'}
            </h2>
            <p className="text-green-100 opacity-90 text-sm sm:text-base pr-12 sm:pr-0">
              {mode === 'login' ? 'Sign in to access your natural wellness account' : 'Create your account for holistic health solutions'}
            </p>
          </div>
        </div>

        {/* Form - Responsive padding and inputs */}
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text" name="name" value={formData.name} onChange={handleInputChange} required
                    className="text-black w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base min-h-[48px]"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className="text-black w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base min-h-[48px]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                    className="text-black w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base min-h-[48px]"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} required
                  className="text-black w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base min-h-[48px]"
                  placeholder="Enter your password"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> 
                <span className="break-words">{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm sm:text-base">
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </span>
                </div>
              ) : (
                <span className="text-sm sm:text-base">
                  {mode === 'login' ? '🌿 Sign In' : '🌱 Create Account'}
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold min-h-[44px] inline-flex items-center"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;