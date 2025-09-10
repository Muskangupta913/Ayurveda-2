import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ Fixed: Missing useState
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  const handleSubmit = async (
    e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem(
          "adminUser",
          JSON.stringify({ name: data.user.name, email: data.user.email })
        );

        // Show success toast
        setToastMessage(data.message || "Login successful!");
        setShowToast(true);

        // Hide toast after 2 seconds and redirect
        setTimeout(() => {
          setShowToast(false);
          router.push("/admin/dashboard-admin");
        }, 2000);
      } else {
        setError(data.message || "Login failed");
      }

    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3" style={{ backgroundColor: '#2D9AA5' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}


      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: `linear-gradient(to bottom right, #2D9AA5, #238B96, #1A7A82)` }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
            <div className="absolute top-32 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-white rounded-full"></div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center items-start p-12 text-white relative z-10">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">ZEVA</h1>
                  <p className="text-teal-200 text-sm uppercase tracking-wider">
                    Admin Portal
                  </p>
                </div>
              </div>

              <h2 className="text-4xl font-bold leading-tight mb-4">
                Welcome Back to
                <br />
                <span className="text-teal-200">Admin Dashboard</span>
              </h2>

              <p className="text-teal-100 text-lg leading-relaxed mb-8">
                ZEVA — the ultimate command center for healthcare networks, doctors, and patient care.
              </p>

              <div className="space-y-4">
                {[
                  "Clinic Management",
                  "Patient Analytics",
                  "Appointment Scheduling",
                ].map((item, index) => (
                  <div className="flex items-center gap-3" key={index}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2D9AA5' }}>
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-teal-100">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-20" style={{ background: `linear-gradient(to top left, #2D9AA5, transparent)` }}></div>
          <div className="absolute top-0 left-0 w-24 h-24 rounded-br-full opacity-20" style={{ background: `linear-gradient(to bottom right, #2D9AA5, transparent)` }}></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, #2D9AA5, #238B96)` }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">ZEVA</h1>
                <p className="text-xs uppercase tracking-wider" style={{ color: '#2D9AA5' }}>
                  Admin Portal
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Admin Login
                </h2>
                <p className="text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                  <div className="w-5 h-5 text-red-500">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-red-700 text-sm font-medium">
                    {error}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-black w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl"
                      placeholder="admin@.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-black w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      <svg
                        className="w-5 h-5 text-gray-400 hover:text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {showPassword ? (
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        )}
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-3 px-4 rounded-xl font-semibold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:opacity-90"
                  style={{
                    background: `linear-gradient(to right, #2D9AA5, #238B96)`,
                    boxShadow: '0 10px 15px -3px rgba(45, 154, 165, 0.3), 0 4px 6px -2px rgba(45, 154, 165, 0.05)'
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>



              {/* Footer Links */}
              <div className="mt-8 text-center">
                <p className="text-sm text-right mt-1">
                  <button
                    onClick={() => router.push('/admin/AdminForgotPassword')}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </p>
              </div>
            </div>

            {/* Additional Links */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <Link href="/" className="text-blue-600 hover:text-grey-500 font-medium ml-1">Back to Home</Link>
              {/* <span>•</span>
              <a
                href="#"
                className="hover:text-green-600 transition duration-200 ml-4"
              >
                Privacy Policy
              </a> */}
            </div>
          </div>
        </div>
      </div>
      {/* <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style> */}
    </>
  );
}

// ❌ Do NOT put this inside the return above
AdminLogin.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};
