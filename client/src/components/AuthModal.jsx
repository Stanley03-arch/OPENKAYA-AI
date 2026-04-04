import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';

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
        <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[90%] max-w-[450px] p-10 bg-gradient-to-b from-kaya-card to-kaya-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center text-center"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-3xl font-semibold mb-2 text-white">
                    Welcome to Kaya
                </h2>
                <p className="text-white/50 mb-8 text-sm">
                    Sign in with Google to continue
                </p>

                {loading ? (
                    <div className="py-5 text-white/50 animate-pulse">Please wait...</div>
                ) : (
                    <div className="w-full flex justify-center">
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
            </motion.div>
        </div>
    );
};

export default AuthModal;
