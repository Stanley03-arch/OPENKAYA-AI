import React from 'react';

const TypingIndicator = () => {
    return (
        <div className="flex justify-start">
            <div className="bg-kaya-card border border-white/5 rounded-[1.5rem] p-4 rounded-bl-sm flex items-center gap-1.5 shadow-md">
                <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
};

export default TypingIndicator;
