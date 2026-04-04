import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import ParticleBackground from './ParticleBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Sparkles, LayoutPanelLeft, FileText, Zap, 
  CheckCircle2, ArrowRight, Video, Presentation, MonitorSmartphone, Brush, MessageSquarePlus
} from 'lucide-react';
import { cn } from '../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const LandingPage = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAnnual, setIsAnnual] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/chat');
        }
    }, [isAuthenticated, navigate]);

    const handleSignIn = () => setShowAuthModal(true);
    const handleSignUp = () => setShowAuthModal(true);
    const handleActionClick = (action) => {
        setSearchInput(action + ' ');
        document.querySelector('.landing-search')?.focus();
    };

    const handleSearchSubmit = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        }
    };

    const features = [
        { icon: <Sparkles className="w-8 h-8" />, title: 'Image Generation', desc: 'Create stunning images from text descriptions with pixel-perfect coherence.' },
        { icon: <LayoutPanelLeft className="w-8 h-8" />, title: 'Website Builder', desc: 'Build complete websites with a single prompt. Export to React instantly.' },
        { icon: <FileText className="w-8 h-8" />, title: 'PDF Creation', desc: 'Generate professional reports and PDF documents automatically.' },
        { icon: <Zap className="w-8 h-8" />, title: 'Lightning Fast', desc: 'Powered by cutting-edge AI models for ultra-low latency responses.' }
    ];

    return (
        <div className="relative min-h-screen bg-kaya-dark text-white font-sans overflow-x-hidden selection:bg-kaya-teal/30">
            <ParticleBackground />
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-kaya-dark/40 backdrop-blur-xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                    <img src="/kaya-logo.png" alt="Open Kaya Logo" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">OPEN KAYA</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
                    <a href="#resources" className="text-white/60 hover:text-white transition-colors">Resources</a>
                    <a href="#events" className="text-white/60 hover:text-white transition-colors">Events</a>
                    <a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <button 
                        onClick={handleSignIn}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors border rounded-full border-white/10 hover:bg-white/5"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={handleSignUp}
                        className="px-4 py-2 text-sm font-medium text-kaya-dark bg-white rounded-full transition-transform hover:scale-105 active:scale-95"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="p-2 -mr-2 text-white/70 hover:text-white md:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 px-6 pt-24 pb-6 bg-kaya-dark/95 backdrop-blur-2xl md:hidden flex flex-col"
                    >
                        <nav className="flex flex-col gap-6 text-2xl font-semibold">
                            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white">Features</a>
                            <a href="#resources" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white">Resources</a>
                            <a href="#events" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white">Events</a>
                            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white">Pricing</a>
                        </nav>
                        <div className="flex flex-col gap-3 mt-auto">
                            <button onClick={handleSignIn} className="w-full py-3 border rounded-xl border-white/10 hover:bg-white/5">Sign In</button>
                            <button onClick={handleSignUp} className="w-full py-3 text-kaya-dark bg-white rounded-xl">Get Started</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-20 mx-auto max-w-7xl">
                
                {/* Hero Section */}
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={fadeIn}
                    className="w-full max-w-3xl text-center"
                >
                    <motion.div 
                        className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium border rounded-full border-kaya-teal/30 bg-kaya-teal/10 text-kaya-teal"
                        variants={fadeIn}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Kaya 1.6 Lite is now available</span>
                    </motion.div>
                    
                    <motion.h1 
                        variants={fadeIn}
                        className="mb-8 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
                    >
                        What can I{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-kaya-teal via-kaya-purple to-kaya-amber animate-gradient-x">
                            do for you?
                        </span>
                    </motion.h1>

                    {/* Search Input Bar */}
                    <motion.div 
                        variants={fadeIn}
                        className={cn(
                            "relative flex items-center w-full max-w-2xl mx-auto p-2 mb-8 transition-all duration-300 rounded-2xl md:rounded-[2rem]",
                            "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
                            isFocused && "border-kaya-teal/50 shadow-[0_0_30px_rgba(0,212,170,0.2)] ring-1 ring-kaya-teal/50"
                        )}
                    >
                        <input
                            className="w-full px-4 py-3 text-lg bg-transparent border-none outline-none text-white placeholder:text-white/40 md:pl-6"
                            type="text"
                            placeholder="Assign a task or ask anything..."
                            value={searchInput}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        />
                        <button
                            onClick={handleSearchSubmit}
                            className={cn(
                                "flex items-center justify-center p-3 transition-all duration-300 rounded-xl md:rounded-[1.5rem]",
                                searchInput ? "bg-kaya-teal text-kaya-dark hover:scale-105 shadow-[0_0_20px_rgba(0,212,170,0.4)]" : "bg-white/10 text-white/50"
                            )}
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </motion.div>

                    {/* Action Chips */}
                    <motion.div 
                        variants={staggerChildren}
                        className="flex flex-wrap justify-center gap-3 mb-24"
                    >
                        {[
                            { icon: <Presentation className="w-4 h-4 text-pink-400" />, label: 'Create slides' },
                            { icon: <MonitorSmartphone className="w-4 h-4 text-blue-400" />, label: 'Build website' },
                            { icon: <Video className="w-4 h-4 text-purple-400" />, label: 'Develop apps' },
                            { icon: <Brush className="w-4 h-4 text-amber-400" />, label: 'Design' },
                            { icon: <MessageSquarePlus className="w-4 h-4 text-white" />, label: 'More' }
                        ].map((action, idx) => (
                            <motion.button
                                key={idx}
                                variants={fadeIn}
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleActionClick(action.label)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-full bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/20"
                            >
                                {action.icon}
                                {action.label}
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Features Section */}
                <div id="features" className="w-full pt-24 mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 mb-4">Unleash Your Creativity</h2>
                        <p className="text-white/50 text-lg max-w-2xl mx-auto">Access a suite of advanced AI models trained to help you build, design, and create faster than ever before.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-kaya-teal/0 via-kaya-teal/0 to-kaya-teal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="mb-6 text-kaya-teal">{feature.icon}</div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-white/60 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Section */}
                <div id="pricing" className="w-full pt-24 pb-12">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
                        <div className="flex items-center justify-center gap-4">
                            <span className={cn("text-sm font-medium", !isAnnual ? "text-white" : "text-white/50")}>Monthly</span>
                            <button 
                                onClick={() => setIsAnnual(!isAnnual)}
                                className="relative inline-flex h-7 w-14 items-center rounded-full bg-white/10 transition-colors focus:outline-none"
                            >
                                <span className={cn(
                                    "inline-block h-5 w-5 transform rounded-full bg-kaya-teal transition-transform duration-300",
                                    isAnnual ? "translate-x-8" : "translate-x-1"
                                )} />
                            </button>
                            <span className={cn("text-sm font-medium", isAnnual ? "text-white" : "text-white/50")}>
                                Annually <span className="text-kaya-teal ml-1 text-xs px-2 py-0.5 rounded-full bg-kaya-teal/10">Save 20%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
                        {/* Free Tier */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10">
                            <h3 className="text-2xl font-bold mb-2">Basic</h3>
                            <p className="text-white/50 mb-6">For individuals starting with AI.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-extrabold">$0</span>
                                <span className="text-white/50">/month</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-8">
                                {['Access to Kaya 1.6 Lite', '100 queries per day', 'Standard response speed'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-kaya-teal" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={handleSignUp} className="w-full py-4 rounded-xl font-medium border border-white/20 hover:bg-white/5 transition-colors">
                                Get Started Free
                            </button>
                        </div>

                        {/* Pro Tier */}
                        <div className="relative p-8 rounded-[2rem] bg-gradient-to-b from-kaya-teal/10 to-kaya-dark border border-kaya-teal/30">
                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-4">
                                <span className="bg-kaya-teal text-kaya-dark text-xs font-bold px-3 py-1 rounded-full shadow-lg">RECOMMENDED</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-kaya-teal">Pro</h3>
                            <p className="text-white/50 mb-6">For professionals and heavy users.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-extrabold">${isAnnual ? '16' : '20'}</span>
                                <span className="text-white/50">/month</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-8">
                                {['Access to all Kaya models', 'Unlimited queries', 'Priority response speed', 'Early access to new features'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-kaya-teal" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={handleSignUp} className="w-full py-4 rounded-xl font-medium bg-kaya-teal text-kaya-dark hover:bg-kaya-teal/90 transition-colors shadow-[0_0_20px_rgba(0,212,170,0.3)]">
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            {showAuthModal && (
                <div className="fixed z-[100]">
                    <AuthModal onClose={() => setShowAuthModal(false)} />
                </div>
            )}
        </div>
    );
};

export default LandingPage;
