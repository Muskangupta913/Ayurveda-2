import React, { useState, useRef, useEffect } from 'react';
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
                                // key={condition.id}
                                // onClick={() => setSelectedCondition(condition.id)}
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

                {/* ==================== WHY CHOOSE US ==================== */}
                <div className="mt-16 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
                            Why to Choose ZEVA
                        </h2>
                    </div>

                    {/* Mobile: Single column, Tablet: 2 columns, Desktop: 4 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Feature 1 - Search Healthcare Services */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Find Healthcare Providers</h3>
                                    <p className="text-sm text-gray-600">Discover qualified doctors and trusted clinics near you.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Register Healthcare Services */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Provider Registration</h3>
                                    <p className="text-sm text-gray-600">Join our platform as a medical professional or facility.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 - Health Games & Calculator */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Health Tools & Games</h3>
                                    <p className="text-sm text-gray-600">Interactive calculators for BMI, calories, and health metrics.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4 - Nearby Search Feature */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Location-Based Search</h3>
                                    <p className="text-sm text-gray-600">Find nearby hospitals, pharmacies, and emergency services.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 5 - Job Applications */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Career Opportunities</h3>
                                    <p className="text-sm text-gray-600">Browse medical jobs and healthcare positions nationwide.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 6 - Blog Reading & Writing */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Knowledge Hub & Blog</h3>
                                    <p className="text-sm text-gray-600">Access expert health articles and contribute insights.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 7 - Telemedicine & Virtual Consultations */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Telemedicine Consults</h3>
                                    <p className="text-sm text-gray-600">Connect with doctors via secure video calls from home.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 8 - Health Records & Digital Prescription Management */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m-5-8h.01M9 16h.01M3 16.755V7.245a2 2 0 011.2-1.835l6-2.4a2 2 0 011.6 0l6 2.4A2 2 0 0119 7.245v9.51a2 2 0 01-1.2 1.835l-6 2.4a2 2 0 01-1.6 0l-6-2.4A2 2 0 013 16.755z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Digital Health Records</h3>
                                    <p className="text-sm text-gray-600">Securely store medical records and manage prescriptions.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 9 - User Dashboard */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2m0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">User Dashboard</h3>
                                    <p className="text-sm text-gray-600">Personalized overview of your health journey and activities.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 10 - History Tracking */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">History Tracking</h3>
                                    <p className="text-sm text-gray-600">Track appointments, consultations, and health progress over time.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 11 - Doctor & Healthcare Dashboard */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Doctor & Healthcare Dashboard</h3>
                                    <p className="text-sm text-gray-600">Monitor patient data and track blog analytics for healthcare providers.</p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 12 - Blog Editor */}
                        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Blog Editor</h3>
                                    <p className="text-sm text-gray-600">Create and publish health content with our intuitive editor.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Try ZEVA Button */}
                    <div className="text-center mt-12">
                        <a
                            href="/"
                            className="inline-block px-8 py-3 text-white font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-[0_0_20px_#2D9AA5]"
                            style={{ backgroundColor: '#2D9AA5' }}
                        >
                            Try ZEVA
                        </a>
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