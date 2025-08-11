import React, { useState } from 'react';
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
    CircleDot,
    TrendingUp,
    Eye,
    Brain,
    Wind,
    ChevronLeft,
    ChevronRight,
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

    const healthConditions: HealthCondition[] = [
        {
            id: 'fever',
            name: 'Fever',
            icon: <Thermometer className="w-8 h-8" />,
            description: 'Monitor your body temperature and identify potential infections or illnesses early.'
        },
        {
            id: 'std',
            name: 'STD',
            icon: <Shield className="w-8 h-8" />,
            description: 'Regular screening for sexually transmitted diseases is crucial for sexual health.'
        },
        {
            id: 'liver',
            name: 'Liver',
            icon: <Activity className="w-8 h-8" />,
            description: 'Liver function tests help detect liver damage and monitor overall liver health.'
        },
        {
            id: 'vitamins',
            name: 'Vitamins',
            icon: <Pill className="w-8 h-8" />,
            description: 'Vitamin deficiencies can affect immunity, energy levels, and overall wellbeing.'
        },
        {
            id: 'diabetes',
            name: 'Diabetes',
            icon: <Droplets className="w-8 h-8" />,
            description: 'Blood sugar monitoring is essential for preventing diabetes complications.'
        },
        {
            id: 'heart',
            name: 'Heart',
            icon: <Heart className="w-8 h-8" />,
            description: 'Cardiovascular health screening helps prevent heart disease and stroke.'
        },
        {
            id: 'thyroid',
            name: 'Thyroid',
            icon: <Zap className="w-8 h-8" />,
            description: 'Thyroid function affects metabolism, energy, and hormonal balance.'
        },
        {
            id: 'kidney',
            name: 'Kidney',
            icon: <CircleEllipsis className="w-8 h-8" />,
            description: 'Kidney function tests help detect early signs of kidney disease.'
        },
        {
            id: 'allergy',
            name: 'Allergy',
            icon: <AlertTriangle className="w-8 h-8" />,
            description: 'Identify allergens that may cause reactions and affect quality of life.'
        },
        {
            id: 'joints',
            name: 'Joints',
            icon: <CircleDot className="w-8 h-8" />,
            description: 'Most of us relate joint pain with age, but that is not true. It does not just affect elderly people...'
        },
        {
            id: 'bone',
            name: 'Bone',
            icon: <Bone className="w-8 h-8" />,
            description: 'Strong bones are key to staying active, mobile, and independent as we age. However, bone health often...'
        },
        {
            id: 'acidity',
            name: 'Acidity',
            icon: <Flame className="w-8 h-8" />,
            description: 'Monitor acid levels to prevent digestive issues and maintain gut health.'
        },
        {
            id: 'cancer',
            name: 'Cancer',
            icon: <Target className="w-8 h-8" />,
            description: 'Early cancer screening can significantly improve treatment outcomes.'
        },
        {
            id: 'anemia',
            name: 'Anemia',
            icon: <Droplets className="w-8 h-8" />,
            description: 'Iron deficiency and low hemoglobin levels can cause fatigue and weakness.'
        },
        {
            id: 'obesity',
            name: 'Obesity',
            icon: <Scale className="w-8 h-8" />,
            description: 'Weight management is crucial for preventing various chronic diseases.'
        },
        {
            id: 'hypertension',
            name: 'Hypertension',
            icon: <TrendingUp className="w-8 h-8" />,
            description: 'High blood pressure monitoring helps prevent cardiovascular complications.'
        },
        {
            id: 'vision',
            name: 'Vision',
            icon: <Eye className="w-8 h-8" />,
            description: 'Regular eye exams help detect vision problems and eye diseases early.'
        },
        {
            id: 'mental-health',
            name: 'Mental Health',
            icon: <Brain className="w-8 h-8" />,
            description: 'Mental wellness screening helps maintain emotional and psychological health.'
        },
        {
            id: 'respiratory',
            name: 'Respiratory',
            icon: <Wind className="w-8 h-8" />,
            description: 'Lung function tests help detect breathing disorders and respiratory diseases.'
        }
    ];

    const selectedConditionData = healthConditions.find(condition => condition.id === selectedCondition);

    const scrollLeft = () => {
        const container = document.getElementById('health-conditions-bar');
        if (container) {
            container.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        const container = document.getElementById('health-conditions-bar');
        if (container) {
            container.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* ==================== HEALTH RISK SECTION ==================== */}
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                        Health Risk
                    </h1>
                </div>

                {/* Horizontal Scrollable Bar */}
                <div className="relative mb-8">
                    {/* Left Arrow */}
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-orange-500 text-white rounded-full p-2 shadow-lg hover:bg-orange-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Scrollable Container */}
                    <div
                        id="health-conditions-bar"
                        className="flex overflow-x-auto scrollbar-hide space-x-4 px-12 py-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {healthConditions.map((condition) => (
                            <div
                                key={condition.id}
                                onClick={() => setSelectedCondition(condition.id)}
                                className={`flex-shrink-0 w-64 cursor-pointer transition-all duration-300 ${selectedCondition === condition.id ? 'transform scale-105' : ''
                                    }`}
                            >
                                <div className={`p-6 rounded-lg text-center h-80 flex flex-col justify-between ${selectedCondition === condition.id
                                    ? 'bg-white shadow-lg border-2'
                                    : 'bg-white hover:shadow-md'
                                    }`}
                                    style={{
                                        borderColor: selectedCondition === condition.id ? '#2D9AA5' : 'transparent'
                                    }}
                                >
                                    {/* Icon */}
                                    <div
                                        className="mb-4 p-4 rounded-full w-fit mx-auto"
                                        style={{ backgroundColor: '#2D9AA5', color: 'white' }}
                                    >
                                        {condition.icon}
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#2D9AA5' }}>
                                        {condition.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                                        {condition.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-orange-500 text-white rounded-full p-2 shadow-lg hover:bg-orange-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>


                <div>
                    <CalculatorGames />
                </div>



                {/* ==================== WHY CHOOSE US ==================== */}
               <div className="mt-16 mb-16">
    <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
            Why to Choose ZEVA
        </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

        {/* Feature 1 - Search Healthcare Services */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    01
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Find Healthcare Providers Online
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Discover qualified doctors and trusted clinics near you. Comprehensive wellness centers and luxury spa services launching soon.
            </p>
        </div>

        {/* Feature 2 - Register Healthcare Services */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4M15,5.9A2.1,2.1 0 0,1 17.1,8A2.1,2.1 0 0,1 15,10.1A2.1,2.1 0 0,1 12.9,8A2.1,2.1 0 0,1 15,5.9M4,7V10H1V12H4V15H6V12H9V10H6V7H4M15,13C12.33,13 7,14.33 7,17V20H23V17C23,14.33 17.67,13 15,13Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    02
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Healthcare Provider Registration
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Join our platform as a medical professional or healthcare facility. Wellness center and spa partner registration coming soon.
            </p>
        </div>

        {/* Feature 3 - Health Games & Calculator */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M16.5,7.5L15.09,8.91L12,5.83L8.91,8.91L7.5,7.5L12,3L16.5,7.5M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    03
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Interactive Health & Wellness Tools
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Access engaging health games and advanced calculators to track BMI, calories, and vital health metrics for better wellness management.
            </p>
        </div>

        {/* Feature 4 - Nearby Search Feature */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    04
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Location-Based Healthcare Search
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Locate nearby hospitals, pharmacies, diagnostic centers, and emergency services with GPS-enabled smart search technology.
            </p>
        </div>

        {/* Feature 5 - Job Applications */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10,2H14A2,2 0 0,1 16,4V6H20A2,2 0 0,1 22,8V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V8A2,2 0 0,1 4,6H8V4A2,2 0 0,1 10,2M14,6V4H10V6H14Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    05
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Healthcare Career Opportunities
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Browse and apply for medical jobs, nursing positions, healthcare administration roles, and clinical opportunities nationwide.
            </p>
        </div>

        {/* Feature 6 - Blog Reading & Writing */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    06
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Health Knowledge Hub & Blog Platform
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Access expert-written health articles, medical news, wellness tips, and contribute your own healthcare insights to our community.
            </p>
        </div>

        {/* Feature 7 - Telemedicine & Virtual Consultations */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5M5,8H15V16H5V8Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    07
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Telemedicine & Virtual Consultations
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Connect with certified doctors through secure video calls, get online prescriptions, and receive medical advice from home.
            </p>
        </div>

        {/* Feature 8 - Health Records & Digital Prescription Management */}
        <div className="text-center">
            <div className="mb-6">
                <div
                    className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#2D9AA5' }}
                >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12H14V17H12V12M10,12H11V17H10V12M8,12H9V17H8V12Z" />
                    </svg>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: '#2D9AA5' }}>
                    08
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D9AA5' }}>
                Digital Health Records & Prescription Management
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                Securely store medical records, track prescriptions, manage lab reports, and maintain comprehensive health history digitally.
            </p>
        </div>

    </div>

    {/* Try ZEVA Button */}
    <div className="text-center mt-12">
        <a 
            href="/" 
            className="inline-block px-8 py-3 text-white font-semibold rounded-lg transition-all duration-300 hover:opacity-90 hover:transform hover:scale-105 shadow-lg"
            style={{ backgroundColor: '#2D9AA5' }}
        >
            Try ZEVA
        </a>
    </div>
</div>

                {/* ==================== CUSTOMER TESTIMONIALS SECTION ==================== */}
                <div className="mt-16 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#2D9AA5' }}>
                            What our customers are saying
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Video Testimonial 1 - Pravita */}
                        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="relative aspect-video bg-gray-200">
                                <video
                                    className="w-full h-full object-cover"
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='0.35em' font-family='Arial, sans-serif' font-size='16' fill='%236b7280'%3EPravita - Pune%3C/text%3E%3C/svg%3E"
                                    controls
                                >
                                    <source src="#" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-300">
                                    <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 transform hover:scale-110">
                                        <svg className="w-6 h-6 ml-1" style={{ color: '#2D9AA5' }} fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-1" style={{ color: '#2D9AA5' }}>
                                    Pravita
                                </h3>
                                <p className="text-gray-500 text-sm">Pune</p>
                            </div>
                        </div>

                        {/* Video Testimonial 2 - Kaushalya */}
                        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="relative aspect-video bg-gray-200">
                                <video
                                    className="w-full h-full object-cover"
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='0.35em' font-family='Arial, sans-serif' font-size='16' fill='%236b7280'%3EKaushalya - Bareilly%3C/text%3E%3C/svg%3E"
                                    controls
                                >
                                    <source src="#" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-300">
                                    <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 transform hover:scale-110">
                                        <svg className="w-6 h-6 ml-1" style={{ color: '#2D9AA5' }} fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-1" style={{ color: '#2D9AA5' }}>
                                    Kaushalya
                                </h3>
                                <p className="text-gray-500 text-sm">Bareilly</p>
                            </div>
                        </div>

                        {/* Video Testimonial 3 - Kamlesh */}
                        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="relative aspect-video bg-gray-200">
                                <video
                                    className="w-full h-full object-cover"
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='0.35em' font-family='Arial, sans-serif' font-size='16' fill='%236b7280'%3EKamlesh - Allahabad%3C/text%3E%3C/svg%3E"
                                    controls
                                >
                                    <source src="#" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-300">
                                    <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 transform hover:scale-110">
                                        <svg className="w-6 h-6 ml-1" style={{ color: '#2D9AA5' }} fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-1" style={{ color: '#2D9AA5' }}>
                                    Kamlesh
                                </h3>
                                <p className="text-gray-500 text-sm">Allahabad</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial Navigation Dots */}
                    <div className="flex justify-center mt-8">
                        <div className="flex space-x-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2D9AA5' }}></div>
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        </div>
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