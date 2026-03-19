import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import ParticleBackground from './ParticleBackground';

const LandingPage = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // If already authenticated, redirect to chat
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/chat');
        }
    }, [isAuthenticated, navigate]);

    const handleSignIn = () => {
        setShowAuthModal(true);
    };

    const handleSignUp = () => {
        setShowAuthModal(true);
    };

    const handleActionClick = (action) => {
        setSearchInput(action + ' ');
        document.querySelector('.landing-search')?.focus();
    };

    const handleSearchSubmit = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            position: 'relative',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <ParticleBackground />
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 48px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/kaya-logo.png" alt="Open Kaya Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>OPEN KAYA AI</span>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', gap: '32px', fontSize: '14px' }}>
                    <a href="#features" style={{ color: '#999', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = '#999'}>
                        Features
                    </a>
                    <a href="#resources" style={{ color: '#999', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = '#999'}>
                        Resources
                    </a>
                    <a href="#events" style={{ color: '#999', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = '#999'}>
                        Events
                    </a>
                    <a href="#pricing" style={{ color: '#999', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = '#999'}>
                        Pricing
                    </a>
                </nav>

                {/* Auth Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleSignIn}
                        style={{
                            background: '#000',
                            color: 'white',
                            border: '1px solid #333',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#1a1a1a';
                            e.currentTarget.style.borderColor = '#555';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#000';
                            e.currentTarget.style.borderColor = '#333';
                        }}
                    >
                        Sign in
                    </button>
                    <button
                        onClick={handleSignUp}
                        style={{
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                        Sign up
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: '120px 24px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 5
            }}>
                <h1 style={{
                    fontSize: '56px',
                    fontWeight: '300',
                    marginBottom: '60px',
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #667eea 50%, #f093fb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'fadeIn 1s ease-out'
                }}>
                    What can I do for you?
                </h1>

                {/* Search Input */}
                <div
                    className="search-container"
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '18px 24px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(102, 126, 234, 0.5)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.3)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                    }}
                >
                    <input
                        className="landing-search"
                        type="text"
                        placeholder="Assign a task or ask anything"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearchSubmit();
                            }
                        }}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'white',
                            fontSize: '16px',
                            fontFamily: 'inherit'
                        }}
                    />
                    <button
                        onClick={handleSearchSubmit}
                        style={{
                            background: searchInput
                                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                : 'rgba(255, 255, 255, 0.1)',
                            color: searchInput ? 'white' : '#666',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: searchInput ? 'pointer' : 'default',
                            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            boxShadow: searchInput ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                        }}
                        onMouseOver={(e) => {
                            if (searchInput) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = searchInput ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none';
                        }}
                    >
                        ↑
                    </button>
                </div>

                {/* Action Chips */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '40px'
                }}>
                    {[
                        { icon: '📊', label: 'Create slides' },
                        { icon: '🌐', label: 'Build website' },
                        { icon: '📱', label: 'Develop apps' },
                        { icon: '🎨', label: 'Design' },
                        { icon: '➕', label: 'More' }
                    ].map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleActionClick(action.label)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '24px',
                                padding: '10px 18px',
                                color: '#ccc',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <span>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>

                {/* Features Showcase */}
                <div style={{
                    marginTop: '60px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    {[
                        { icon: '🎨', title: 'Image Generation', desc: 'Create stunning images from text descriptions' },
                        { icon: '🌐', title: 'Website Builder', desc: 'Build complete websites with a single prompt' },
                        { icon: '📄', title: 'PDF Creation', desc: 'Generate professional PDFs instantly' },
                        { icon: '⚡', title: 'Lightning Fast', desc: 'Powered by cutting-edge AI models' }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="fade-in"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                cursor: 'pointer',
                                animationDelay: `${idx * 0.1}s`
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{feature.icon}</div>
                            <h3 style={{
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #ffffff, #667eea)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </div>
    );
};

export default LandingPage;
