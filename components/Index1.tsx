import React, { useState, useRef, useEffect } from 'react';
// import Link from 'next/link';
import {
    Thermometer,
    Shield,
    Activity,
    Pill,
    Droplets,
    Heart,
    Zap,
    CircleEllipsis,
    AlertTriangle,
    Bone,
    Scale,
    Flame,
    Target,
    TrendingUp,
    Eye,
    Brain,
    Wind,
} from 'lucide-react';

import CalculatorGames from '../components/CalculatorGames';
import LatestJobs from '../components/LatestJobs';

interface HealthCondition {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

const HealthRiskComponent: React.FC = () => {
    const [selectedCondition, setSelectedCondition] = useState<string>('joints');
    const [activePage, setActivePage] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const healthConditions: HealthCondition[] = [
        {
            id: 'fever',
            name: 'Fever',
            icon: <Thermometer className="w-8 h-8" />,
            description: 'Can signal infection or serious illness.'
        },
        {
            id: 'std',
            name: 'STD',
            icon: <Shield className="w-8 h-8" />,
            description: 'May cause infertility or long-term health damage.'
        },
        {
            id: 'liver',
            name: 'Liver',
            icon: <Activity className="w-8 h-8" />,
            description: 'Poor function can lead to liver failure.'
        },
        {
            id: 'vitamins',
            name: 'Vitamins',
            icon: <Pill className="w-8 h-8" />,
            description: 'Deficiency weakens immunity and energy.'
        },
        {
            id: 'diabetes',
            name: 'Diabetes',
            icon: <Droplets className="w-8 h-8" />,
            description: 'Can damage heart, kidneys, eyes, and nerves.'
        },
        {
            id: 'heart',
            name: 'Heart',
            icon: <Heart className="w-8 h-8" />,
            description: 'Increases risk of heart attack and stroke.'
        },
        {
            id: 'thyroid',
            name: 'Thyroid',
            icon: <Zap className="w-8 h-8" />,
            description: 'Can cause fatigue, weight changes, and mood issues.'
        },
        {
            id: 'kidney',
            name: 'Kidney',
            icon: <CircleEllipsis className="w-8 h-8" />,
            description: 'Failure can cause toxin buildup and serious illness.'
        },
        {
            id: 'allergy',
            name: 'Allergy',
            icon: <AlertTriangle className="w-8 h-8" />,
            description: 'May trigger asthma or severe reactions.'
        },
        {
            id: 'bone',
            name: 'Bone',
            icon: <Bone className="w-8 h-8" />,
            description: 'Weak bones raise fracture and disability risk.'
        },
        {
            id: 'acidity',
            name: 'Acidity',
            icon: <Flame className="w-8 h-8" />,
            description: 'Can damage the esophagus and cause ulcers.'
        },
        {
            id: 'cancer',
            name: 'Cancer',
            icon: <Target className="w-8 h-8" />,
            description: 'Uncontrolled growth can be life-threatening.'
        },
        {
            id: 'anemia',
            name: 'Anemia',
            icon: <Droplets className="w-8 h-8" />,
            description: 'Causes fatigue, weakness, and poor focus.'
        },
        {
            id: 'obesity',
            name: 'Obesity',
            icon: <Scale className="w-8 h-8" />,
            description: 'Increases diabetes, heart disease, and cancer risk.'
        },
        {
            id: 'hypertension',
            name: 'Hypertension',
            icon: <TrendingUp className="w-8 h-8" />,
            description: 'Raises risk of stroke, heart, and kidney disease.'
        },
        {
            id: 'vision',
            name: 'Vision',
            icon: <Eye className="w-8 h-8" />,
            description: 'Poor vision can cause accidents and blindness.'
        },
        {
            id: 'mental-health',
            name: 'Mental Health',
            icon: <Brain className="w-8 h-8" />,
            description: 'Can lead to stress, anxiety, or depression.'
        },
        {
            id: 'respiratory',
            name: 'Respiratory',
            icon: <Wind className="w-8 h-8" />,
            description: 'Can cause breathlessness and lung damage.'
        },
    ];

    const cardsPerPage = 3;
    const totalPages = Math.ceil(healthConditions.length / cardsPerPage);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollPosition = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.firstChild
                    ? (scrollRef.current.firstChild as HTMLElement).offsetWidth + 16
                    : 0;
                const page = Math.round(scrollPosition / (cardWidth * cardsPerPage));
                setActivePage(page);
            }
        };

        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (el) el.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (

        <div className="w-full bg-white py-8 px-4">

            <div className="max-w-6xl mx-auto">
                {/* ==================== HEALTH RISK SECTION ==================== */}
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                        Health Risk
                    </h1>

                </div>

                {/* Horizontal Scrollable Bar */}
                {/* Scroll Section */}
                <div className="relative mb-8">
                    {/* Left Fade */}
                    <div
                        onClick={scrollLeft}
                        className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 cursor-pointer hover:opacity-80 transition-opacity"
                    />

                    {/* Scrollable Container */}
                    <div
                        ref={scrollRef}
                        id="health-conditions-bar"
                        className="flex overflow-x-auto scrollbar-hide space-x-4 px-4 py-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {healthConditions.map((condition) => (
                            <div
                                key={condition.id}
                                onClick={() => setSelectedCondition(condition.id)}
                                className={`flex-shrink-0 w-64 cursor-pointer transition-all duration-300 ${selectedCondition === condition.id ? 'transform scale-105' : ''
                                    }`}
                            >
                                <div
                                    className={`p-6 rounded-lg text-center h-55 flex flex-col justify-between ${selectedCondition === condition.id
                                        ? 'bg-white shadow-lg border-2'
                                        : 'bg-white hover:shadow-md'
                                        }`}
                                    style={{
                                        borderColor:
                                            selectedCondition === condition.id ? '#2D9AA5' : 'transparent',
                                    }}
                                >
                                    <div
                                        className="mb-4 p-4 rounded-full w-fit mx-auto"
                                        style={{ backgroundColor: '#2D9AA5', color: 'white' }}
                                    >
                                        {condition.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#2D9AA5' }}>
                                        {condition.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                                        {condition.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Fade */}
                    <div
                        onClick={scrollRight}
                        className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                </div>

                {/* Dots Pagination */}
                <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (scrollRef.current) {
                                    const cardWidth = scrollRef.current.firstChild
                                        ? (scrollRef.current.firstChild as HTMLElement).offsetWidth + 16
                                        : 0;
                                    scrollRef.current.scrollTo({
                                        left: i * cardWidth * cardsPerPage,
                                        behavior: 'smooth',
                                    });
                                }
                            }}
                            className={`w-3 h-3 rounded-full transition-colors ${i === activePage ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
                <p className="text-xl font-semibold text-center text-black mt-7">
                    Your <span style={{ color: '#2D9AA5' }}>health</span> matters — avoid risks. Use <span style={{ color: '#2D9AA5' }}>ZEVA</span> to find nearby clinics and book your appointment today.
                </p>

                {/* Calculator and games */}

                <CalculatorGames />
                <div className="w-full">
                    <LatestJobs />
                </div>

                {/* ==================== WHY CHOOSE US ==================== */}
                <div className="mt-16 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
                            Why Choose ZEVA
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Complete healthcare platform for modern medical needs
                        </p>
                    </div>

                    {/* First Row - Main Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Find Healthcare Providers */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Healthcare Providers</h3>
                            <p className="text-sm text-gray-600">Discover qualified doctors and trusted clinics near you with advanced filtering.</p>
                        </div>

                        {/* Provider Registration */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Registration</h3>
                            <p className="text-sm text-gray-600">Join our platform as a medical professional or facility with easy onboarding.</p>
                        </div>

                        {/* Health Tools */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Tools & Games</h3>
                            <p className="text-sm text-gray-600">Interactive calculators for BMI, calories, and health metrics with gamification.</p>
                        </div>

                        {/* Location Search */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location-Based Search</h3>
                            <p className="text-sm text-gray-600">Find nearby hospitals, pharmacies, and emergency services instantly.</p>
                        </div>
                    </div>

                    {/* Second Row - Additional Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* Telemedicine */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Telemedicine</h3>
                            <p className="text-sm text-gray-600">Connect with doctors via secure video calls from the comfort of your home.</p>
                        </div>

                        {/* Digital Records */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Health Records</h3>
                            <p className="text-sm text-gray-600">Securely store medical records and manage prescriptions digitally.</p>
                        </div>

                        {/* Career Opportunities */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Opportunities</h3>
                            <p className="text-sm text-gray-600">Browse medical jobs and healthcare positions nationwide.</p>
                        </div>

                        {/* Knowledge Hub */}
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Hub & Blog</h3>
                            <p className="text-sm text-gray-600">Access expert health articles and contribute insights.</p>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="group relative px-10 py-4 text-white font-bold text-lg rounded-xl transition-all duration-500 transform hover:scale-110 overflow-hidden shadow-2xl hover:shadow-cyan-500/25 active:scale-95"
                            style={{ backgroundColor: '#2D9AA5' }}
                        >
                            {/* Main gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>

                            {/* Animated gradient border glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-xl blur-sm opacity-0 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                            {/* Button content */}
                            <span className="relative z-10 flex items-center gap-3">
                                <span className="tracking-wide">Try ZEVA</span>
                                <svg
                                    className="w-6 h-6 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300 ease-out"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </span>

                           
                            <div className="absolute inset-0 rounded-xl shadow-inner opacity-20"></div>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
export default HealthRiskComponent;