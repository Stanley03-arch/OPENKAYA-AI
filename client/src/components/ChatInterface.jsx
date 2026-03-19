import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, ArrowUp, Copy, Check, ChevronDown, Plus, Download, FileText, X, Key, LogOut, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TypingIndicator from './TypingIndicator';
import APIKeyModal from './APIKeyModal';


const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

const ChatInterface = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [selectedModel, setSelectedModel] = useState('groq');
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [showAPIKey, setShowAPIKey] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            toast.success('Installing Kaya AI...');
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setInput('');
        toast.success('New chat started');
    };

    const [playingAudio, setPlayingAudio] = useState(null);

    const handleExportPDF = async () => {
        if (messages.length === 0) {
            toast.error('No conversation to export');
            return;
        }

        setIsLoading(true);
        toast.loading('Generating PDF...');

        try {
            // 1. Convert conversation to Markdown
            let markdownContent = "# Conversation Export\n\n";
            messages.forEach(msg => {
                const role = msg.role === 'user' ? 'You' : 'Kaya AI';
                // If there's an attachment, mention it
                const attachmentInfo = msg.attachmentName ? `\n*(Attached: ${msg.attachmentName})*\n` : '';
                markdownContent += `**${role}:**\n${attachmentInfo}\n${msg.content}\n\n---\n\n`;
            });

            // 2. Send to dedicated PDF endpoint
            const response = await fetch(`${API_BASE_URL}/api/markdown-to-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Kaya Conversation Export',
                    content: markdownContent
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.pdfUrl) {
                toast.dismiss();
                toast.success('PDF generated successfully!');
                window.open(data.pdfUrl, '_blank');
            } else {
                throw new Error('No PDF URL returned');
            }
        } catch (error) {
            toast.dismiss();
            toast.error(`Export failed: ${error.message}`);
            console.error('Export error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text, index) => {
        try {
            // Remove markdown formatting for plain text copy
            const plainText = text.replace(/[#*`_~\[\]()]/g, '');
            await navigator.clipboard.writeText(plainText);
            setCopiedIndex(index);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const handleTTS = async (text, index) => {
        if (playingAudio === index) {
            // Stop logic if already playing (simplified to just clearing state)
            setPlayingAudio(null);
            return;
        }

        const toastId = toast.loading('Generating voice...');
        try {
            // Remove markdown for better TTS
            const cleanText = text.replace(/[#*`_~\[\]()]/g, '');

            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, languageCode: 'en-IN' }) // Default to Indian English
            });

            if (!response.ok) throw new Error('TTS request failed');

            const data = await response.json();
            if (data.audios && data.audios.length > 0) {
                const audioSrc = `data:audio/wav;base64,${data.audios[0]}`;
                const audio = new Audio(audioSrc);
                audio.play();
                setPlayingAudio(index);
                audio.onended = () => setPlayingAudio(null);
                toast.success('Playing audio', { id: toastId });
            }
        } catch (error) {
            console.error('TTS Error:', error);
            toast.error('Failed to generate voice', { id: toastId });
        }
    };


    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Handle PDF files
        if (file.type === 'application/pdf') {
            const formData = new FormData();
            formData.append('file', file);

            const toastId = toast.loading('Processing PDF...');

            try {
                const response = await fetch(`${API_BASE_URL}/api/process-file`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.status === 'success') {
                    setAttachment({
                        name: file.name,
                        type: 'application/pdf',
                        content: data.text
                    });
                    toast.success(`Attached ${file.name}`, { id: toastId });
                } else {
                    toast.error(`Failed to process PDF: ${data.error}`, { id: toastId });
                }
            } catch (error) {
                console.error('PDF processing error:', error);
                toast.error(`Failed to upload PDF: ${error.message}`, { id: toastId });
            }
            return;
        }

        // Handle Image files
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result; // Data URL
                setAttachment({
                    name: file.name,
                    type: file.type,
                    content: content, // Base64 Data URL
                    isImage: true
                });
                toast.success(`Attached ${file.name}`);
            };
            reader.readAsDataURL(file);
            return;
        }

        // Handle text/code files
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            setAttachment({
                name: file.name,
                type: file.type,
                content: content
            });
            toast.success(`Attached ${file.name}`);
        };
        reader.readAsText(file);
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !attachment) || isLoading) return;

        let fullContent = input;

        // Append attachment if present
        if (attachment) {
            if (attachment.isImage) {
                // For images, we don't append to text content, we send it separately
                // But we can add a placeholder in text for display
                // fullContent = `${input} [Image Attached: ${attachment.name}]`; // Optional
            } else {
                fullContent = `${input}\n\n---\n**Attached Document: ${attachment.name}**\n\n\`\`\`\n${attachment.content}\n\`\`\`\n---`;
            }
        }

        const userMessage = {
            role: 'user',
            content: fullContent,
            displayContent: input,
            attachmentName: attachment?.name,
            image: attachment?.isImage ? attachment.content : null
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsLoading(true);

        try {
            // Call backend without auth token
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: fullContent }].map(m => ({ role: m.role, content: m.content })),
                    provider: selectedModel,
                    image: attachment?.isImage ? attachment.content : null
                }),
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
            } else {
                // Create assistant message with all metadata
                const assistantMessage = {
                    role: 'assistant',
                    content: data.reply,
                    pdfUrl: data.pdfUrl,
                    imageUrl: data.imageUrl,
                    previewUrl: data.previewUrl,
                    isPdfGeneration: data.isPdfGeneration,
                    isImageGeneration: data.isImageGeneration,
                    isWebsiteGeneration: data.isWebsiteGeneration,
                    isSearchResult: data.isSearchResult,
                    isWeatherResult: data.isWeatherResult
                };
                setMessages(prev => [...prev, assistantMessage]);
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server. Is it running?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (action) => {
        if (action === 'Create slides') {
            setInput('Create a slide deck about ');
        } else if (action === 'Design') {
            setInput('Design a user interface for ');
        } else if (action === 'Generate PDF') {
            setInput('Generate a PDF about ');
        } else if (action === 'Build Website') {
            setInput('Build a modern responsive website for ');

        }
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
    };

    return (
        <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(20px)'
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>🤖</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>KAYA AI</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                        {/* New Chat Button */}
                        <button
                            onClick={handleNewChat}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            <Plus size={16} />
                            New Chat
                        </button>

                        {/* API Key Button */}
                        <button
                            onClick={() => setShowAPIKey(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Key size={16} />
                            Kaya API
                        </button>

                        {/* Export PDF Button */}
                        {messages.length > 0 && (
                            <button
                                onClick={handleExportPDF}
                                disabled={isLoading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: isLoading ? 'default' : 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                    opacity: isLoading ? 0.6 : 1
                                }}
                                onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
                                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <FileText size={16} />
                                Export PDF
                            </button>
                        )}

                        {/* Version Badge */}
                        <div style={{
                            fontSize: '0.85rem',
                            color: '#999',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Kaya 1.6 Lite
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => {
                                logout();
                                toast.success('Logged out successfully');
                                navigate('/');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255, 50, 50, 0.1)',
                                border: '1px solid rgba(255, 50, 50, 0.2)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: '#ff6666',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20%', display: 'flex', flexDirection: 'column' }}>
                    {messages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                            <h1 style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '2rem' }}>What can I do for you?</h1>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className="fade-in"
                                    style={{
                                        marginBottom: '24px',
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%',
                                        animationDelay: `${index * 0.1}s`
                                    }}>
                                    <div style={{
                                        background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'transparent',
                                        padding: msg.role === 'user' ? '12px 16px' : '0',
                                        borderRadius: '12px',
                                        lineHeight: '1.5',
                                        position: 'relative'
                                    }}>
                                        {msg.attachmentName && (
                                            <div style={{
                                                marginBottom: '8px',
                                                padding: '8px',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.85rem',
                                                color: '#e0e0e0'
                                            }}>
                                                <Paperclip size={14} />
                                                {msg.attachmentName}
                                            </div>
                                        )}
                                        {msg.role === 'assistant' ? (
                                            <>
                                                <div style={{ position: 'relative' }}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>

                                                    {/* PDF Download Button */}
                                                    {msg.pdfUrl && (
                                                        <a
                                                            href={msg.pdfUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                marginTop: '12px',
                                                                padding: '10px 20px',
                                                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                                color: 'white',
                                                                borderRadius: '8px',
                                                                textDecoration: 'none',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                                e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                                            }}
                                                        >
                                                            <Download size={18} />
                                                            Download PDF
                                                        </a>
                                                    )}

                                                    {/* Image Display */}
                                                    {msg.imageUrl && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <img
                                                                src={msg.imageUrl}
                                                                alt="Generated"
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    borderRadius: '8px',
                                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Website Preview Link */}
                                                    {msg.previewUrl && (
                                                        <a
                                                            href={msg.previewUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                marginTop: '12px',
                                                                padding: '10px 20px',
                                                                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                                                                color: 'white',
                                                                borderRadius: '8px',
                                                                textDecoration: 'none',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                                e.currentTarget.style.boxShadow = '0 6px 25px rgba(79, 172, 254, 0.6)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
                                                            }}
                                                        >
                                                            🌐 Preview Website
                                                        </a>
                                                    )}

                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        marginTop: '12px',
                                                        justifyContent: 'flex-start'
                                                    }}>
                                                        <button
                                                            onClick={() => handleTTS(msg.content, index)}
                                                            style={{
                                                                background: 'rgba(255, 255, 255, 0.1)',
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                borderRadius: '8px',
                                                                padding: '6px 12px',
                                                                cursor: 'pointer',
                                                                color: playingAudio === index ? '#4facfe' : '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            {playingAudio === index ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                                            <span>{playingAudio === index ? 'Stop' : 'Speak'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(msg.content, index)}
                                                            style={{
                                                                background: 'rgba(255, 255, 255, 0.1)',
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                borderRadius: '8px',
                                                                padding: '6px 12px',
                                                                cursor: 'pointer',
                                                                color: copiedIndex === index ? '#4CAF50' : '#999',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                if (copiedIndex !== index) {
                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                                                    e.currentTarget.style.color = '#fff';
                                                                }
                                                            }}
                                                            onMouseOut={(e) => {
                                                                if (copiedIndex !== index) {
                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                                    e.currentTarget.style.color = '#999';
                                                                }
                                                            }}
                                                        >
                                                            {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                                                            <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            msg.displayContent || msg.content // Show displayContent if available (clean user input), otherwise full content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <TypingIndicator />}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '24px 20%', paddingBottom: '48px' }}>
                    {/* Action Chips */}
                    {messages.length === 0 && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
                            {[
                                { label: 'Create slides', icon: '📊' },
                                { label: 'Design', icon: '🎨' },
                                { label: 'Generate PDF', icon: '📄' },
                                { label: 'Build Website', icon: '🌐' },

                            ].map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => handleActionClick(action.label)}
                                    style={{
                                        background: '#222',
                                        border: '1px solid #444',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        color: '#eee',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#222'}
                                >
                                    <span>{action.icon}</span> {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="glass-panel" style={{
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Assign a task or ask anything"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                resize: 'none',
                                outline: 'none',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                minHeight: '24px'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        {/* Attachment Preview */}
                        {attachment && (
                            <div style={{
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                alignSelf: 'flex-start'
                            }}>
                                {attachment.isImage ? (
                                    <img src={attachment.content} alt="Preview" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} />
                                ) : (
                                    <FileText size={16} color="#aaa" />
                                )}
                                <span style={{ fontSize: '0.9rem', color: '#eee' }}>{attachment.name}</span>
                                <button
                                    onClick={removeAttachment}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.java,.c,.cpp,.h,.pdf,.png,.jpg,.jpeg,.webp"
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: attachment ? '0' : '12px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ background: 'transparent', border: 'none', color: attachment ? '#667eea' : '#888', cursor: 'pointer' }}
                                >
                                    <Paperclip size={20} />
                                </button>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={(!input.trim() && !attachment) || isLoading}
                                style={{
                                    background: (input.trim() || attachment) && !isLoading ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.1)',
                                    color: (input.trim() || attachment) && !isLoading ? 'white' : '#666',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: (input.trim() || attachment) && !isLoading ? 'pointer' : 'default',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                    boxShadow: (input.trim() || attachment) && !isLoading ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if ((input.trim() || attachment) && !isLoading) {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = (input.trim() || attachment) && !isLoading ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none';
                                }}
                            >
                                <ArrowUp size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Install Prompt Button */}
                {
                    deferredPrompt && (
                        <div style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 1000
                        }}>
                            <button
                                onClick={handleInstallClick}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '30px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.5)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
                                }}
                            >
                                <Download size={20} />
                                Install App
                            </button>
                        </div>
                    )
                }

            </div >
            {showAPIKey && <APIKeyModal onClose={() => setShowAPIKey(false)} />}
        </>
    );
};

export default ChatInterface;

