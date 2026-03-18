import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const AuthModal = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            await loginWithGoogle(credentialResponse.credential);
            toast.success('Successfully logged in with Google!');
            navigate('/chat');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Google Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '40px',
                    width: '90%',
                    maxWidth: '450px',
                    position: 'relative',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#222';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#999';
                    }}
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'white'
                }}>
                    Welcome to Kaya
                </h2>
                <p style={{
                    color: '#999',
                    marginBottom: '32px',
                    fontSize: '14px'
                }}>
                    Sign in with Google to continue
                </p>

                {loading ? (
                    <div style={{ color: '#999', padding: '20px 0' }}>Please wait...</div>
                ) : (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                                toast.error('Google Login Failed');
                            }}
                            theme="filled_black"
                            size="large"
                            text="continue_with"
                            width="100%"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
