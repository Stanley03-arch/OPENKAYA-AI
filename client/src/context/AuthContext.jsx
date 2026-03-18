
import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null);

    const loginWithGoogle = async (credential) => {
        try {
            setLoading(true);
            // Decode the Google JWT credential to get user info
            const decoded = jwtDecode(credential);
            const googleUser = {
                id: decoded.sub,
                email: decoded.email,
                user_metadata: {
                    name: decoded.name,
                    avatar_url: decoded.picture
                }
            };
            setUser(googleUser);
            setSession({ access_token: credential });
            return { user: googleUser };
        } catch (err) {
            console.error('Google auth failed:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setSession(null);
    };

    const value = {
        user,
        session,
        loginWithGoogle,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
