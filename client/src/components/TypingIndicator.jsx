import React from 'react';

const TypingIndicator = () => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            width: 'fit-content'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'typingDots 1.4s ease-in-out infinite',
                animationDelay: '0s'
            }} />
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'typingDots 1.4s ease-in-out infinite',
                animationDelay: '0.2s'
            }} />
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'typingDots 1.4s ease-in-out infinite',
                animationDelay: '0.4s'
            }} />
        </div>
    );
};

export default TypingIndicator;
