import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, Trophy, Clock, Star, CheckCircle, XCircle, RotateCcw, Play, Shield, Zap, Brain } from 'lucide-react';

interface Symptom {
    id: string;
    text: string;
    category: 'respiratory' | 'digestive' | 'general' | 'pain' | 'fever' | 'neurological' | 'cardiovascular' | 'dermatological';
    severity: 'mild' | 'moderate' | 'severe';
    complexity: number;
}

interface Action {
    id: string;
    text: string;
    category: 'respiratory' | 'digestive' | 'general' | 'pain' | 'fever' | 'neurological' | 'cardiovascular' | 'dermatological';
    icon: string;
    effectiveness: number;
    complexity: number;
}

interface Match {
    symptomId: string;
    actionId: string;
    timeToMatch: number;
    accuracy: number;
}

interface GameLevel {
    level: number;
    timeLimit: number;
    requiredMatches: number;
    maxWrongAttempts: number;
    complexityRange: [number, number];
    categoryCount: number;
    decoyCount: number;
}

function SymptomMatcherGame() {
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [score, setScore] = useState<number>(0);
    const [lives, setLives] = useState<number>(3);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'completed' | 'failed'>('menu');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
    const [streak, setStreak] = useState<number>(0);
    const [totalScore, setTotalScore] = useState<number>(0);
    const [wrongAttempts, setWrongAttempts] = useState<number>(0);
    const [currentSymptoms, setCurrentSymptoms] = useState<Symptom[]>([]);
    const [currentActions, setCurrentActions] = useState<Action[]>([]);
    const [startTime, setStartTime] = useState<number>(0);
    const [powerUps, setPowerUps] = useState<{ timeFreeze: number; hint: number; shield: number }>({ timeFreeze: 1, hint: 2, shield: 1 });
    const [multiplier, setMultiplier] = useState<number>(1);
    const [comboCounter, setComboCounter] = useState<number>(0);

    // Massive symptom database with different complexities
    const symptomDatabase: Symptom[] = [
        // Level 1-2 (Basic)
        { id: 's1', text: 'Persistent cough', category: 'respiratory', severity: 'mild', complexity: 1 },
        { id: 's2', text: 'Stomach pain', category: 'digestive', severity: 'mild', complexity: 1 },
        { id: 's3', text: 'Fatigue', category: 'general', severity: 'mild', complexity: 1 },
        { id: 's4', text: 'High fever', category: 'fever', severity: 'moderate', complexity: 1 },
        { id: 's5', text: 'Shortness of breath', category: 'respiratory', severity: 'moderate', complexity: 2 },
        { id: 's6', text: 'Nausea', category: 'digestive', severity: 'mild', complexity: 1 },

        // Level 3-4 (Intermediate)
        { id: 's7', text: 'Migraine with aura', category: 'neurological', severity: 'severe', complexity: 3 },
        { id: 's8', text: 'Chest palpitations', category: 'cardiovascular', severity: 'moderate', complexity: 3 },
        { id: 's9', text: 'Chronic joint stiffness', category: 'pain', severity: 'moderate', complexity: 3 },
        { id: 's10', text: 'Vertigo episodes', category: 'neurological', severity: 'moderate', complexity: 3 },
        { id: 's11', text: 'Persistent skin rash', category: 'dermatological', severity: 'mild', complexity: 2 },
        { id: 's12', text: 'Abdominal bloating', category: 'digestive', severity: 'mild', complexity: 2 },
        { id: 's13', text: 'Night sweats', category: 'fever', severity: 'moderate', complexity: 2 },
        { id: 's14', text: 'Muscle cramps', category: 'pain', severity: 'mild', complexity: 2 },

        // Level 5-6 (Advanced)
        { id: 's15', text: 'Tinnitus with hearing loss', category: 'neurological', severity: 'moderate', complexity: 4 },
        { id: 's16', text: 'Orthostatic hypotension', category: 'cardiovascular', severity: 'moderate', complexity: 4 },
        { id: 's17', text: 'Photophobia with eye strain', category: 'neurological', severity: 'moderate', complexity: 4 },
        { id: 's18', text: 'Dysphagia with regurgitation', category: 'digestive', severity: 'severe', complexity: 4 },
        { id: 's19', text: 'Paresthesia in extremities', category: 'neurological', severity: 'moderate', complexity: 4 },
        { id: 's20', text: 'Syncope episodes', category: 'cardiovascular', severity: 'severe', complexity: 4 },

        // Level 7-8 (Expert)
        { id: 's21', text: 'Hemoptysis with dyspnea', category: 'respiratory', severity: 'severe', complexity: 5 },
        { id: 's22', text: 'Melena with epigastric pain', category: 'digestive', severity: 'severe', complexity: 5 },
        { id: 's23', text: 'Aphasia with motor weakness', category: 'neurological', severity: 'severe', complexity: 5 },
        { id: 's24', text: 'Petechial rash with fever', category: 'dermatological', severity: 'severe', complexity: 5 },
        { id: 's25', text: 'Bradycardia with chest pain', category: 'cardiovascular', severity: 'severe', complexity: 5 },
        { id: 's26', text: 'Ataxia with diplopia', category: 'neurological', severity: 'severe', complexity: 5 },

        // Level 9-10 (Master)
        { id: 's27', text: 'Oliguria with peripheral edema', category: 'general', severity: 'severe', complexity: 6 },
        { id: 's28', text: 'Hematemesis with jaundice', category: 'digestive', severity: 'severe', complexity: 6 },
        { id: 's29', text: 'Myoclonus with cognitive decline', category: 'neurological', severity: 'severe', complexity: 6 },
        { id: 's30', text: 'Cyanosis with clubbing', category: 'respiratory', severity: 'severe', complexity: 6 },
        { id: 's31', text: 'Ascites with splenomegaly', category: 'digestive', severity: 'severe', complexity: 6 },
        { id: 's32', text: 'Lymphadenopathy with B symptoms', category: 'general', severity: 'severe', complexity: 6 }
    ];

    const actionDatabase: Action[] = [
        // Basic actions
        { id: 'a1', text: 'Stay hydrated with warm fluids', category: 'respiratory', icon: '💧', effectiveness: 80, complexity: 1 },
        { id: 'a2', text: 'Eat bland, easy-to-digest foods', category: 'digestive', icon: '🍞', effectiveness: 75, complexity: 1 },
        { id: 'a3', text: 'Get adequate rest and sleep', category: 'general', icon: '😴', effectiveness: 85, complexity: 1 },
        { id: 'a4', text: 'Monitor temperature regularly', category: 'fever', icon: '🌡️', effectiveness: 70, complexity: 1 },
        { id: 'a5', text: 'Practice controlled breathing', category: 'respiratory', icon: '🫁', effectiveness: 80, complexity: 2 },
        { id: 'a6', text: 'Avoid strong odors and triggers', category: 'digestive', icon: '🚫', effectiveness: 70, complexity: 1 },

        // Intermediate actions
        { id: 'a7', text: 'Apply targeted pressure therapy', category: 'neurological', icon: '🎯', effectiveness: 75, complexity: 3 },
        { id: 'a8', text: 'Perform cardiac monitoring', category: 'cardiovascular', icon: '💓', effectiveness: 85, complexity: 3 },
        { id: 'a9', text: 'Use heat/cold therapy alternately', category: 'pain', icon: '🔥', effectiveness: 70, complexity: 3 },
        { id: 'a10', text: 'Practice vestibular exercises', category: 'neurological', icon: '🌀', effectiveness: 80, complexity: 3 },
        { id: 'a11', text: 'Apply topical anti-inflammatory', category: 'dermatological', icon: '🧴', effectiveness: 75, complexity: 2 },
        { id: 'a12', text: 'Use probiotics and enzymes', category: 'digestive', icon: '💊', effectiveness: 70, complexity: 2 },

        // Advanced actions
        { id: 'a13', text: 'Implement tinnitus masking therapy', category: 'neurological', icon: '🎧', effectiveness: 70, complexity: 4 },
        { id: 'a14', text: 'Practice orthostatic conditioning', category: 'cardiovascular', icon: '📈', effectiveness: 75, complexity: 4 },
        { id: 'a15', text: 'Use photosensitivity protection', category: 'neurological', icon: '🕶️', effectiveness: 80, complexity: 4 },
        { id: 'a16', text: 'Perform swallowing therapy', category: 'digestive', icon: '🗣️', effectiveness: 75, complexity: 4 },
        { id: 'a17', text: 'Apply neurological stimulation', category: 'neurological', icon: '⚡', effectiveness: 70, complexity: 4 },
        { id: 'a18', text: 'Monitor cardiac rhythm closely', category: 'cardiovascular', icon: '📊', effectiveness: 85, complexity: 4 },

        // Expert actions
        { id: 'a19', text: 'Implement respiratory support', category: 'respiratory', icon: '🫁', effectiveness: 90, complexity: 5 },
        { id: 'a20', text: 'Perform gastric decompression', category: 'digestive', icon: '🔄', effectiveness: 85, complexity: 5 },
        { id: 'a21', text: 'Initiate neuroprotective measures', category: 'neurological', icon: '🧠', effectiveness: 80, complexity: 5 },
        { id: 'a22', text: 'Apply hemostatic protocols', category: 'dermatological', icon: '🩹', effectiveness: 85, complexity: 5 },
        { id: 'a23', text: 'Perform cardiac resuscitation', category: 'cardiovascular', icon: '💝', effectiveness: 95, complexity: 5 },
        { id: 'a24', text: 'Implement cerebellar therapy', category: 'neurological', icon: '🎭', effectiveness: 75, complexity: 5 },

        // Master actions
        { id: 'a25', text: 'Initiate renal replacement therapy', category: 'general', icon: '🏥', effectiveness: 90, complexity: 6 },
        { id: 'a26', text: 'Perform endoscopic intervention', category: 'digestive', icon: '🔬', effectiveness: 95, complexity: 6 },
        { id: 'a27', text: 'Apply advanced neuroprotection', category: 'neurological', icon: '🛡️', effectiveness: 85, complexity: 6 },
        { id: 'a28', text: 'Implement ECMO support', category: 'respiratory', icon: '⚕️', effectiveness: 95, complexity: 6 },
        { id: 'a29', text: 'Perform hepatic detoxification', category: 'digestive', icon: '🧪', effectiveness: 90, complexity: 6 },
        { id: 'a30', text: 'Initiate oncological protocols', category: 'general', icon: '🎗️', effectiveness: 85, complexity: 6 },

        // Decoy actions (wrong but plausible)
        { id: 'd1', text: 'Apply ice directly to skin', category: 'pain', icon: '❄️', effectiveness: 20, complexity: 1 },
        { id: 'd2', text: 'Eat spicy foods for circulation', category: 'cardiovascular', icon: '🌶️', effectiveness: 10, complexity: 2 },
        { id: 'd3', text: 'Exercise vigorously during fever', category: 'fever', icon: '🏃', effectiveness: 5, complexity: 1 },
        { id: 'd4', text: 'Hold breath to stop coughing', category: 'respiratory', icon: '🫁', effectiveness: 15, complexity: 1 },
        { id: 'd5', text: 'Drink alcohol for pain relief', category: 'pain', icon: '🍷', effectiveness: 10, complexity: 2 },
        { id: 'd6', text: 'Stay in bright lights for headache', category: 'neurological', icon: '💡', effectiveness: 5, complexity: 3 }
    ];

    const gameLevels: GameLevel[] = [
        { level: 1, timeLimit: 90, requiredMatches: 4, maxWrongAttempts: 3, complexityRange: [1, 1], categoryCount: 4, decoyCount: 1 },
        { level: 2, timeLimit: 85, requiredMatches: 5, maxWrongAttempts: 3, complexityRange: [1, 2], categoryCount: 5, decoyCount: 2 },
        { level: 3, timeLimit: 80, requiredMatches: 6, maxWrongAttempts: 2, complexityRange: [2, 3], categoryCount: 6, decoyCount: 2 },
        { level: 4, timeLimit: 75, requiredMatches: 7, maxWrongAttempts: 2, complexityRange: [2, 3], categoryCount: 6, decoyCount: 3 },
        { level: 5, timeLimit: 70, requiredMatches: 8, maxWrongAttempts: 2, complexityRange: [3, 4], categoryCount: 7, decoyCount: 3 },
        { level: 6, timeLimit: 65, requiredMatches: 9, maxWrongAttempts: 2, complexityRange: [3, 4], categoryCount: 7, decoyCount: 4 },
        { level: 7, timeLimit: 60, requiredMatches: 10, maxWrongAttempts: 1, complexityRange: [4, 5], categoryCount: 8, decoyCount: 4 },
        { level: 8, timeLimit: 55, requiredMatches: 11, maxWrongAttempts: 1, complexityRange: [4, 5], categoryCount: 8, decoyCount: 5 },
        { level: 9, timeLimit: 50, requiredMatches: 12, maxWrongAttempts: 1, complexityRange: [5, 6], categoryCount: 8, decoyCount: 5 },
        { level: 10, timeLimit: 45, requiredMatches: 15, maxWrongAttempts: 1, complexityRange: [5, 6], categoryCount: 8, decoyCount: 6 }
    ];

    const currentGameLevel = gameLevels[currentLevel - 1];

    // Generate random questions for each level
    const generateLevelContent = useCallback((level: GameLevel) => {
        const availableSymptoms = symptomDatabase.filter(s =>
            s.complexity >= level.complexityRange[0] && s.complexity <= level.complexityRange[1]
        );

        const availableActions = actionDatabase.filter(a =>
            a.complexity >= level.complexityRange[0] && a.complexity <= level.complexityRange[1]
        );

        const decoyActions = actionDatabase.filter(a => a.id.startsWith('d')).slice(0, level.decoyCount);

        // Randomly select symptoms
        const selectedSymptoms = [...availableSymptoms]
            .sort(() => Math.random() - 0.5)
            .slice(0, level.requiredMatches);

        // Get matching actions + some extra + decoys
        const matchingActions = selectedSymptoms.map(symptom =>
            availableActions.find(action => action.category === symptom.category)
        ).filter(Boolean) as Action[];

        const extraActions = availableActions
            .filter(action => !matchingActions.find(ma => ma.id === action.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.max(2, level.requiredMatches - matchingActions.length));

        const allActions = [...matchingActions, ...extraActions, ...decoyActions]
            .sort(() => Math.random() - 0.5);

        return {
            symptoms: selectedSymptoms,
            actions: allActions
        };
    }, []);

    const startGame = useCallback(() => {
        const content = generateLevelContent(currentGameLevel);
        setCurrentSymptoms(content.symptoms);
        setCurrentActions(content.actions);
        setGameState('playing');
        setTimeLeft(currentGameLevel.timeLimit);
        setMatches([]);
        setSelectedSymptom(null);
        setFeedback(null);
        setWrongAttempts(0);
        setStartTime(Date.now());
        setComboCounter(0);
        setMultiplier(1);
    }, [currentGameLevel, generateLevelContent]);

    const resetGame = useCallback(() => {
        setCurrentLevel(1);
        setScore(0);
        setLives(3);
        setStreak(0);
        setTotalScore(0);
        setGameState('menu');
        setPowerUps({ timeFreeze: 1, hint: 2, shield: 1 });
        setMultiplier(1);
    }, []);

    const usePowerUp = useCallback((type: 'timeFreeze' | 'hint' | 'shield') => {
        if (powerUps[type] <= 0) return;

        setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

        switch (type) {
            case 'timeFreeze':
                setTimeLeft(prev => prev + 15);
                setFeedback({ type: 'success', message: '+15 seconds added!' });
                break;
            case 'hint':
                if (selectedSymptom) {
                    const symptom = currentSymptoms.find(s => s.id === selectedSymptom);
                    if (symptom) {
                        const correctAction = currentActions.find(a => a.category === symptom.category);
                        if (correctAction) {
                            setFeedback({ type: 'warning', message: `Hint: Look for ${correctAction.icon} ${correctAction.text.substring(0, 15)}...` });
                        }
                    }
                } else {
                    setFeedback({ type: 'warning', message: 'Select a symptom first!' });
                }
                break;
            case 'shield':
                setFeedback({ type: 'success', message: 'Shield activated! Next wrong answer protected.' });
                break;
        }

        setTimeout(() => setFeedback(null), 3000);
    }, [powerUps, selectedSymptom, currentSymptoms, currentActions]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('failed');
        }
        return () => clearTimeout(timer);
    }, [timeLeft, gameState]);

    const handleSymptomSelect = (symptomId: string) => {
        if (gameState !== 'playing') return;
        setSelectedSymptom(symptomId);
    };

    const handleActionSelect = (actionId: string) => {
        if (gameState !== 'playing' || !selectedSymptom) return;

        const symptom = currentSymptoms.find(s => s.id === selectedSymptom);
        const action = currentActions.find(a => a.id === actionId);

        if (!symptom || !action) return;

        const isCorrect = symptom.category === action.category;
        const timeToMatch = Date.now() - startTime;
        const speedBonus = Math.max(0, 50 - Math.floor(timeToMatch / 1000));

        if (isCorrect) {
            const basePoints = 100 * symptom.complexity * action.effectiveness / 100;
            const comboBonus = comboCounter * 25;
            const streakBonus = streak * 20;
            const totalPoints = Math.floor((basePoints + speedBonus + comboBonus + streakBonus) * multiplier);

            const newMatch: Match = {
                symptomId: selectedSymptom,
                actionId,
                timeToMatch,
                accuracy: action.effectiveness
            };

            setMatches(prev => [...prev, newMatch]);
            setScore(prev => prev + totalPoints);
            setStreak(prev => prev + 1);
            setComboCounter(prev => prev + 1);

            if (comboCounter >= 3) {
                setMultiplier(prev => Math.min(prev + 0.5, 3));
                setFeedback({ type: 'success', message: `COMBO! +${totalPoints} points (${multiplier.toFixed(1)}x multiplier)` });
            } else {
                setFeedback({ type: 'success', message: `Correct! +${totalPoints} points` });
            }

            if (matches.length + 1 >= currentGameLevel.requiredMatches) {
                const timeBonus = timeLeft * 10 * currentLevel;
                const accuracyBonus = Math.floor([...matches, newMatch].reduce((sum, m) => sum + m.accuracy, 0) / (matches.length + 1) * 5);
                const levelBonus = 500 * currentLevel;
                const finalScore = score + totalPoints + timeBonus + accuracyBonus + levelBonus;

                setTotalScore(prev => prev + finalScore);

                if (currentLevel < gameLevels.length) {
                    setTimeout(() => {
                        setCurrentLevel(prev => prev + 1);
                        setGameState('menu');
                        if (currentLevel % 2 === 0) {
                            setPowerUps(prev => ({
                                timeFreeze: prev.timeFreeze + 1,
                                hint: prev.hint + 1,
                                shield: prev.shield + 1
                            }));
                        }
                    }, 2000);
                } else {
                    setGameState('completed');
                }
            }
        } else {
            setWrongAttempts(prev => prev + 1);
            setStreak(0);
            setComboCounter(0);
            setMultiplier(1);

            if (powerUps.shield > 0 && action.id.startsWith('d')) {
                setPowerUps(prev => ({ ...prev, shield: prev.shield - 1 }));
                setFeedback({ type: 'warning', message: 'Shield protected you from decoy action!' });
            } else {
                setLives(prev => prev - 1);
                setFeedback({ type: 'error', message: `Wrong! ${action.text} doesn't match ${symptom.text}` });

                if (lives <= 1 || wrongAttempts >= currentGameLevel.maxWrongAttempts) {
                    setGameState('failed');
                }
            }
        }

        setSelectedSymptom(null);
        setTimeout(() => setFeedback(null), 3000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 5000) return 'text-purple-400';
        if (score >= 2000) return 'text-yellow-400';
        if (score >= 1000) return 'text-orange-400';
        return 'text-white';
    };

    const getDifficultyBadge = (level: number) => {
        if (level <= 2) return { text: 'BEGINNER', color: 'bg-green-500' };
        if (level <= 4) return { text: 'INTERMEDIATE', color: 'bg-yellow-500' };
        if (level <= 6) return { text: 'ADVANCED', color: 'bg-orange-500' };
        if (level <= 8) return { text: 'EXPERT', color: 'bg-red-500' };
        return { text: 'MASTER', color: 'bg-purple-500' };
    };

    if (gameState === 'menu') {
        const difficulty = getDifficultyBadge(currentLevel);

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
                <div className="max-w-lg w-full bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 shadow-2xl border border-slate-600">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Heart className="w-12 h-12 text-[#2D9AA5] mr-2" />
                            <h1 className="text-3xl font-bold text-white">Symptom Matcher</h1>
                        </div>
                        <div className={`inline-block px-4 py-2 rounded-full text-white font-bold text-sm mb-4 ${difficulty.color}`}>
                            {difficulty.text}
                        </div>

                        <div className="bg-slate-600 rounded-xl p-6 mb-6">
                            <h2 className="text-[#2D9AA5] font-bold text-2xl mb-4">Level {currentLevel}</h2>
                            <div className="grid grid-cols-2 gap-4 text-slate-300">
                                <div className="text-center">
                                    <div className="text-2xl mb-1">⏰</div>
                                    <div className="font-semibold">{formatTime(currentGameLevel.timeLimit)}</div>
                                    <div className="text-xs">Time Limit</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl mb-1">🎯</div>
                                    <div className="font-semibold">{currentGameLevel.requiredMatches}</div>
                                    <div className="text-xs">Required Matches</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl mb-1">❤️</div>
                                    <div className="font-semibold">{lives}</div>
                                    <div className="text-xs">Lives</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl mb-1">🧩</div>
                                    <div className="font-semibold">{currentGameLevel.complexityRange[0]}-{currentGameLevel.complexityRange[1]}</div>
                                    <div className="text-xs">Complexity</div>
                                </div>
                            </div>
                        </div>

                        {totalScore > 0 && (
                            <div className="bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] rounded-xl p-4 mb-6">
                                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                <p className="text-white font-bold text-xl">Total Score: {totalScore.toLocaleString()}</p>
                                <p className="text-slate-200 text-sm">Multiplier: {multiplier.toFixed(1)}x</p>
                            </div>
                        )}

                        <div className="flex justify-center space-x-2 mb-6">
                            {Object.entries(powerUps).map(([key, count]) => (
                                <div key={key} className="bg-slate-600 rounded-lg p-2 text-center min-w-[60px]">
                                    <div className="text-lg mb-1">
                                        {key === 'timeFreeze' ? '❄️' : key === 'hint' ? '💡' : '🛡️'}
                                    </div>
                                    <div className="text-white font-bold text-sm">{count}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] hover:from-[#1E6B73] hover:to-[#2D9AA5] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center mb-4"
                        >
                            <Play className="w-6 h-6 mr-2" />
                            Start Level {currentLevel}
                        </button>

                        {currentLevel > 1 && (
                            <button
                                onClick={resetGame}
                                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Reset Game
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'completed') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
                <div className="max-w-lg w-full bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 shadow-2xl border border-slate-600 text-center">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
                    <h1 className="text-4xl font-bold text-white mb-2">MASTER ACHIEVED!</h1>
                    <p className="text-slate-300 text-lg mb-8">You've conquered all 10 levels!</p>

                    <div className="space-y-4 mb-8">
                        <div className="bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] rounded-xl p-6">
                            <h2 className="text-white font-bold text-xl mb-2">Final Score</h2>
                            <p className="text-yellow-400 font-bold text-4xl">{totalScore.toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-600 rounded-xl p-4">
                                <div className="text-2xl mb-1">🔥</div>
                                <div className="text-white font-bold">Max Streak</div>
                                <div className="text-[#2D9AA5] font-bold text-xl">{Math.max(...matches.map(() => streak))}</div>
                            </div>
                            <div className="bg-slate-600 rounded-xl p-4">
                                <div className="text-2xl mb-1">⚡</div>
                                <div className="text-white font-bold">Accuracy</div>
                                <div className="text-[#2D9AA5] font-bold text-xl">
                                    {matches.length > 0 ? Math.floor(matches.reduce((sum, m) => sum + m.accuracy, 0) / matches.length) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={resetGame}
                        className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] hover:from-[#1E6B73] hover:to-[#2D9AA5] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'failed') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
                <div className="max-w-lg w-full bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 shadow-2xl border border-slate-600 text-center">
                    <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-4">Mission Failed</h1>
                    <p className="text-slate-300 text-lg mb-6">The symptoms were too complex this time!</p>

                    <div className="bg-slate-600 rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-white font-semibold text-xl">{score.toLocaleString()}</p>
                                <p className="text-slate-300">Score</p>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-xl">{currentLevel}</p>
                                <p className="text-slate-300">Level Reached</p>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-xl">{matches.length}</p>
                                <p className="text-slate-300">Correct Matches</p>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-xl">{wrongAttempts}</p>
                                <p className="text-slate-300">Wrong Attempts</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={resetGame}
                        className="w-full bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] hover:from-[#1E6B73] hover:to-[#2D9AA5] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-6 shadow-xl border border-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                                <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
                                <span className={`font-bold text-xl ${getScoreColor(score)}`}>{score.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center">
                                <Star className="w-6 h-6 text-[#2D9AA5] mr-2" />
                                <span className="text-white font-bold">Level {currentLevel}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-6 h-6 text-orange-400 mr-2" />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                {[...Array(3)].map((_, i) => (
                                    <Heart
                                        key={i}
                                        className={`w-6 h-6 ${i < lives ? 'text-red-500' : 'text-slate-600'}`}
                                        fill={i < lives ? 'currentColor' : 'none'}
                                    />
                                ))}
                            </div>
                            {streak > 0 && (
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                    🔥 {streak}x
                                </div>
                            )}
                            {multiplier > 1 && (
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    ⚡ {multiplier.toFixed(1)}x
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Power-ups */}
                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={() => usePowerUp('timeFreeze')}
                            disabled={powerUps.timeFreeze <= 0}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${powerUps.timeFreeze > 0
                                    ? 'bg-blue-500 hover:bg-blue-400 text-white transform hover:scale-105'
                                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            ❄️ Freeze ({powerUps.timeFreeze})
                        </button>
                        <button
                            onClick={() => usePowerUp('hint')}
                            disabled={powerUps.hint <= 0}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${powerUps.hint > 0
                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-white transform hover:scale-105'
                                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            💡 Hint ({powerUps.hint})
                        </button>
                        <button
                            onClick={() => usePowerUp('shield')}
                            disabled={powerUps.shield <= 0}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${powerUps.shield > 0
                                    ? 'bg-green-500 hover:bg-green-400 text-white transform hover:scale-105'
                                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            🛡️ Shield ({powerUps.shield})
                        </button>
                    </div>
                </div>

                {/* Enhanced Feedback */}
                {feedback && (
                    <div className={`mb-6 p-6 rounded-xl text-center font-bold text-lg transition-all duration-500 transform ${feedback.type === 'success'
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-105'
                            : feedback.type === 'error'
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white scale-105'
                                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white scale-105'
                        }`}>
                        <div className="flex items-center justify-center">
                            {feedback.type === 'success' ? (
                                <CheckCircle className="w-8 h-8 mr-2" />
                            ) : feedback.type === 'error' ? (
                                <XCircle className="w-8 h-8 mr-2" />
                            ) : (
                                <Brain className="w-8 h-8 mr-2" />
                            )}
                            {feedback.message}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Enhanced Symptoms - COMPACT VERSION */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 shadow-xl border border-slate-600">
                        <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
                            <Zap className="w-6 h-6 mr-2 text-[#2D9AA5]" />
                            Symptoms
                        </h2>
                        <div className="space-y-2 h-80 overflow-y-auto">
                            {currentSymptoms.map((symptom) => {
                                const isMatched = matches.some(m => m.symptomId === symptom.id);
                                const isSelected = selectedSymptom === symptom.id;

                                return (
                                    <button
                                        key={symptom.id}
                                        onClick={() => handleSymptomSelect(symptom.id)}
                                        disabled={isMatched}
                                        className={`w-full p-2 rounded-lg font-semibold text-left transition-all duration-300 transform hover:scale-102 ${isMatched
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white cursor-default'
                                                : isSelected
                                                    ? 'bg-gradient-to-r from-[#2D9AA5] to-[#1E6B73] text-white shadow-lg scale-102'
                                                    : 'bg-slate-600 hover:bg-slate-500 text-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm">{symptom.text}</span>
                                                <div className="flex items-center mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${symptom.severity === 'severe' ? 'bg-red-500' :
                                                            symptom.severity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}>
                                                        {symptom.severity.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-slate-300">
                                                        Level: {symptom.complexity}
                                                    </span>
                                                </div>
                                            </div>
                                            {isMatched && <CheckCircle className="w-5 h-5 text-green-300" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enhanced Actions - COMPACT VERSION */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 shadow-xl border border-slate-600">
                        <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
                            <Shield className="w-6 h-6 mr-2 text-[#2D9AA5]" />
                            Actions
                        </h2>
                        <div className="space-y-2 h-80 overflow-y-auto">
                            {currentActions.map((action) => {
                                const isMatched = matches.some(m => m.actionId === action.id);
                                const isDecoy = action.id.startsWith('d');

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleActionSelect(action.id)}
                                        disabled={isMatched || !selectedSymptom}
                                        className={`w-full p-2 rounded-lg font-semibold text-left transition-all duration-300 transform hover:scale-102 ${isMatched
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white cursor-default'
                                                : selectedSymptom
                                                    ? isDecoy
                                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-lg'
                                                        : 'bg-slate-600 hover:bg-gradient-to-r hover:from-[#2D9AA5] hover:to-[#1E6B73] text-white hover:shadow-lg'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-lg mr-2">{action.icon}</span>
                                                    <span className="text-sm">{action.text}</span>
                                                </div>
                                                <div className="flex items-center ml-6">
                                                    <span className="text-xs text-slate-300 mr-2">
                                                        Effectiveness: {action.effectiveness}%
                                                    </span>
                                                    <span className="text-xs text-slate-300">
                                                        Level: {action.complexity}
                                                    </span>
                                                    {isDecoy && (
                                                        <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded ml-2">
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isMatched && <CheckCircle className="w-5 h-5 text-green-300" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Enhanced Progress */}
                <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl border border-slate-600">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Brain className="w-6 h-6 text-[#2D9AA5] mr-2" />
                            <span className="text-white font-bold text-lg">Mission Progress</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-[#2D9AA5] font-bold text-xl">
                                {matches.length} / {currentGameLevel.requiredMatches}
                            </span>
                            <span className="text-slate-300 text-sm">
                                Wrong: {wrongAttempts}/{currentGameLevel.maxWrongAttempts}
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-[#2D9AA5] via-[#1E6B73] to-[#2D9AA5] h-4 rounded-full transition-all duration-500 relative"
                            style={{ width: `${(matches.length / currentGameLevel.requiredMatches) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                        </div>
                    </div>

                    {comboCounter >= 2 && (
                        <div className="mt-4 text-center">
                            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full font-bold animate-bounce">
                                🔥 COMBO STREAK: {comboCounter} 🔥
                            </span>
                        </div>
                    )}
                </div>

                {/* Level Info */}
                <div className="mt-4 text-center">
                    <div className="inline-block bg-slate-800 rounded-xl px-6 py-3 border border-slate-600">
                        <span className="text-slate-300 text-sm">
                            Complexity Range: {currentGameLevel.complexityRange[0]}-{currentGameLevel.complexityRange[1]} |
                            Categories: {currentGameLevel.categoryCount} |
                            Decoys: {currentGameLevel.decoyCount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SymptomMatcherGame;


SymptomMatcherGame.getLayout = function PageLayout(page: React.ReactNode) {
    return page; // No layout
};