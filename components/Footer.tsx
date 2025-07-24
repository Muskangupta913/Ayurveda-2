import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    // { name: 'About Us', href: '/about' },
    // { name: 'Our Services', href: '/services' },
    { name: 'Register Doctor', href: '/' },
    // { name: 'Login', href: '/Login' },
    { name: 'Search Doctor', href: '/doctor/search' },
    { name: 'Search Clinic', href: '/' },
  ];

  // const treatments = [
  //   { name: 'Ayurvedic Hairfall Treatment', href: '/treatments/panchakarma' },
  //   { name: 'Panchakarma Treatment', href: '/treatments/abhyanga' },
  //   { name: 'Gastric Disorders Treatment', href: '/treatments/shirodhara' },
  //   { name: 'PCOS Treatment', href: '/treatments/yoga' },
  //   { name: 'Ayurvedic Diet Plan', href: '/treatments/herbal' },
  //   { name: 'Skin Diseases Treatment', href: '/consultation' },
  // ];
  const treatments = [
    { name: 'Ayurvedic Hairfall Treatment'},
    { name: 'Panchakarma Treatment'},
    { name: 'Gastric Disorders Treatment'},
    { name: 'PCOS Treatment'},
    { name: 'Ayurvedic Diet Plan'},
    { name: 'Skin Diseases Treatment'},
  ];

  // const socialLinks = [
  //   { name: 'Facebook', href: '#', icon: '📘', color: 'hover:text-blue-600' },
  //   { name: 'Instagram', href: '#', icon: '📷', color: 'hover:text-pink-600' },
  //   { name: 'Twitter', href: '#', icon: '🐦', color: 'hover:text-blue-400' },
  //   { name: 'YouTube', href: '#', icon: '📹', color: 'hover:text-red-600' },
  //   { name: 'LinkedIn', href: '#', icon: '💼', color: 'hover:text-blue-700' },
  // ];

  return (
    <footer className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-6xl">🌿</div>
        <div className="absolute top-20 right-20 text-4xl">🪷</div>
        <div className="absolute bottom-20 left-1/4 text-5xl">🕉️</div>
        <div className="absolute bottom-10 right-10 text-3xl">🌱</div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl text-white">🌿</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                    AyurVeda
                  </h3>
                  <p className="text-green-300 text-sm">Natural Healing</p>
                </div>
              </div>
              <p className="text-green-100 mb-6 leading-relaxed">
                Experience the ancient wisdom of Ayurveda with modern healthcare standards. 
                Your journey to natural wellness starts here.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                {/* <div className="flex items-center space-x-3 text-green-200">
                  <span className="text-lg">📍</span>
                  <span className="text-sm">123 Wellness Street, Green City, India</span>
                </div> */}
                {/* <div className="flex items-center space-x-3 text-green-200">
                  <span className="text-lg">📞</span>
                  <span className="text-sm">+91 98765 43210</span>
                </div> */}
                <div className="flex items-center space-x-3 text-green-200">
                  <span className="text-lg">✉️</span>
                  <span className="text-sm">info@ayurvedanearme.ae</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">🔗</span>
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} legacyBehavior>
                      <a className="text-green-200 hover:text-white transition-colors duration-300 flex items-center group">
                        <span className="mr-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                        {link.name}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Treatments */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">🌿</span>
                Treatments
              </h4>
              <ul className="space-y-3">
                {treatments.map((treatment) => (
                  <li key={treatment.name}>
                    {/* <Link href={treatment.href} legacyBehavior> */}
                      <a className="text-green-200 hover:text-white transition-colors duration-300 flex items-center group">
                        <span className="mr-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                        {treatment.name}
                      </a>
                    {/* </Link> */}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Social */}
         
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-green-300 text-sm">
                © {currentYear} AyurVeda Clinic. All rights reserved.
              </div>

              {/* <div className="flex items-center space-x-6 text-sm">
                <Link href="/privacy" legacyBehavior>
                  <a className="text-green-300 hover:text-white transition-colors duration-300">
                    Privacy Policy
                  </a>
                </Link>
                <Link href="/terms" legacyBehavior>
                  <a className="text-green-300 hover:text-white transition-colors duration-300">
                    Terms of Service
                  </a>
                </Link>
                <Link href="/disclaimer" legacyBehavior>
                  <a className="text-green-300 hover:text-white transition-colors duration-300">
                    Medical Disclaimer
                  </a>
                </Link>
              </div> */}

              <div className="flex items-center space-x-2 text-green-300 text-sm">
                <span>Made with</span>
                <span className="text-red-400 animate-pulse">💚</span>
                <span>for your wellness</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
         {/* <div className="fixed bottom-6 right-6 z-50">
          <Link href="/clinic/register-clinic" legacyBehavior>
            <a className="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
              <span className="text-lg">🏥</span>
              <span className="font-semibold">Register your clinic</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </a>
          </Link>
        </div>  */}
      </div>
    </footer>
  );
};

export default Footer;
