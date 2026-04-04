import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, ArrowUp, Copy, Check, ChevronDown, Plus, Download, FileText, X, Key, LogOut, Volume2, VolumeX, Menu, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TypingIndicator from './TypingIndicator';
import APIKeyModal from './APIKeyModal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [playingAudio, setPlayingAudio] = useState(null);

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
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleExportPDF = async () => {
        if (messages.length === 0) {
            toast.error('No conversation to export');
            return;
        }

        setIsLoading(true);
        toast.loading('Generating PDF...');

        try {
            let markdownContent = "# Conversation Export\n\n";
            messages.forEach(msg => {
                const role = msg.role === 'user' ? 'You' : 'Kaya AI';
                const attachmentInfo = msg.attachmentName ? `\n*(Attached: ${msg.attachmentName})*\n` : '';
                markdownContent += `**${role}:**\n${attachmentInfo}\n${msg.content}\n\n---\n\n`;
            });

            const response = await fetch(`${API_BASE_URL}/api/markdown-to-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            setPlayingAudio(null);
            return;
        }

        const toastId = toast.loading('Generating voice...');
        try {
            const cleanText = text.replace(/[#*`_~\[\]()]/g, '');
            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, languageCode: 'en-IN' })
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

        if (file.type === 'application/pdf') {
            const formData = new FormData();
            formData.append('file', file);
            const toastId = toast.loading('Processing PDF...');

            try {
                const response = await fetch(`${API_BASE_URL}/api/process-file`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error(`Server returned ${response.status} ${response.statusText}`);
                const data = await response.json();

                if (data.status === 'success') {
                    setAttachment({ name: file.name, type: 'application/pdf', content: data.text });
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

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachment({ name: file.name, type: file.type, content: e.target.result, isImage: true });
                toast.success(`Attached ${file.name}`);
            };
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setAttachment({ name: file.name, type: file.type, content: e.target.result });
            toast.success(`Attached ${file.name}`);
        };
        reader.readAsText(file);
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !attachment) || isLoading) return;

        const triggers = ['generate', 'draw', 'create', 'imagine', 'paint'];
        const lowerInput = input.toLowerCase().trim();
        const triggerWord = triggers.find(t => lowerInput.startsWith(t));
        
        // INTERCEPT Image Generation (Pollinations.ai)
        if (triggerWord && !attachment) {
            const prompt = input.substring(triggerWord.length).trim();
            if (prompt) {
                const userMessage = { role: 'user', content: input };
                const seed = Math.floor(Math.random() * 1000000);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
                
                const assistantMessage = {
                    role: 'assistant',
                    content: `Generating your image: "${prompt}"...`,
                    isPollinations: true,
                    isGeneratingImage: true,
                    imageUrl: imageUrl,
                    prompt: prompt
                };

                setMessages(prev => [...prev, userMessage, assistantMessage]);
                setInput('');
                return; // Skip backend call
            }
        }

        let fullContent = input;
        if (attachment && !attachment.isImage) {
            fullContent = `${input}\n\n---\n**Attached Document: ${attachment.name}**\n\n\`\`\`\n${attachment.content}\n\`\`\`\n---`;
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
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply,
                    pdfUrl: data.pdfUrl,
                    imageUrl: data.imageUrl,
                    previewUrl: data.previewUrl,
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server. Is it running?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (action) => {
        if (action === 'Create slides') setInput('Create a slide deck about ');
        else if (action === 'Design') setInput('Design a user interface for ');
        else if (action === 'Generate PDF') setInput('Generate a PDF about ');
        else if (action === 'Build Website') setInput('Build a modern responsive website for ');
        
        document.querySelector('textarea')?.focus();
    };

    return (
        <div className="flex h-screen bg-kaya-dark text-white font-sans overflow-hidden">
            
            {/* Desktop Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-kaya-card border-r border-white/5 flex flex-col transition-transform duration-300 transform",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                "md:relative md:translate-x-0"
            )}>
                <div className="flex items-center justify-between p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <img src="/kaya-logo.png" alt="Open Kaya Logo" className="w-8 h-8 rounded-full border border-white/10" />
                        <span className="font-semibold text-lg">Kaya AI</span>
                    </div>
                    <button className="md:hidden text-white/50" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="px-4 space-y-2">
                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 p-3 bg-kaya-teal/10 text-kaya-teal hover:bg-kaya-teal/20 transition-colors rounded-xl font-medium"
                    >
                        <Plus size={18} /> New Chat
                    </button>
                    
                    <button 
                        onClick={() => setShowAPIKey(true)}
                        className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl font-medium"
                    >
                        <Key size={18} /> Kaya API
                    </button>

                    {messages.length > 0 && (
                        <button 
                            onClick={handleExportPDF}
                            disabled={isLoading}
                            className="w-full flex items-center gap-2 p-3 bg-kaya-purple/20 text-kaya-purple hover:bg-kaya-purple/30 transition-colors rounded-xl font-medium disabled:opacity-50"
                        >
                            <FileText size={18} /> Export PDF
                        </button>
                    )}
                </div>

                <div className="mt-8 px-4 flex-1 overflow-y-auto hidden md:block">
                    <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Recent</div>
                    {/* Placeholder for actual history */}
                    <div className="flex items-center gap-3 p-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                        <MessageSquare size={16} /> Current Session
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/5">
                    <div className="w-full px-3 py-2 mb-3 text-sm text-center bg-white/5 border border-white/10 rounded-lg text-white/60 font-medium">
                        Model: Kaya 1.6 Lite
                    </div>
                    <button 
                        onClick={() => {
                            logout();
                            toast.success('Logged out successfully');
                            navigate('/');
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors rounded-xl font-medium"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col w-full h-full relative relative z-0">
                
                {/* Mobile Header */}
                <header className="flex md:hidden items-center justify-between p-4 bg-kaya-card border-b border-white/5 sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/70">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold px-3 py-1 bg-white/5 rounded-full text-sm">Kaya 1.6 Lite</span>
                    <button onClick={handleNewChat} className="p-2 text-white/70">
                        <Plus size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full text-center">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-kaya-teal to-kaya-purple mb-8">
                                How can I help you today?
                            </h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                {[
                                    { label: 'Create slides', icon: '📊', desc: 'about AI future' },
                                    { label: 'Design', icon: '🎨', desc: 'a modern landing page' },
                                    { label: 'Generate PDF', icon: '📄', desc: 'from my notes' },
                                    { label: 'Build Website', icon: '🌐', desc: 'for a cafe' },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => handleActionClick(action.label)}
                                        className="flex flex-col items-start p-4 bg-kaya-card border border-white/5 hover:border-kaya-teal/50 rounded-2xl transition-all hover:bg-white/[0.03] text-left group"
                                    >
                                        <div className="flex items-center gap-2 font-medium mb-1 group-hover:text-kaya-teal transition-colors">
                                            <span>{action.icon}</span> {action.label}
                                        </div>
                                        <div className="text-sm text-white/40">{action.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-8">
                            {messages.map((msg, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={index}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[85%] md:max-w-[75%] rounded-[1.5rem] p-4 md:p-5",
                                        msg.role === 'user' 
                                            ? "bg-gradient-to-br from-kaya-teal to-[rgb(0,180,150)] text-काया-dark rounded-br-sm shadow-lg text-black font-medium" 
                                            : "bg-kaya-card border border-white/5 rounded-bl-sm shadow-md text-white/90"
                                    )}>
                                        {msg.attachmentName && (
                                            <div className="flex items-center gap-2 mb-3 p-2 bg-black/10 rounded-lg text-sm bg-blend-darken">
                                                <Paperclip size={14} />
                                                <span className="truncate">{msg.attachmentName}</span>
                                            </div>
                                        )}
                                        
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none">
                                                {msg.isPollinations ? (
                                                    <div className="flex flex-col gap-4">
                                                        <p className="text-white/70 italic mb-2">{msg.content}</p>
                                                        <div className="relative min-h-[300px] bg-black/20 rounded-xl overflow-hidden group">
                                                            <img 
                                                                src={msg.imageUrl} 
                                                                alt={msg.prompt}
                                                                className={cn(
                                                                    "w-full h-auto rounded-xl transition-opacity duration-700",
                                                                    msg.isGeneratingImage ? "opacity-0" : "opacity-100"
                                                                )}
                                                                onLoad={() => {
                                                                    setMessages(prev => prev.map((m, i) => i === index ? { ...m, isGeneratingImage: false } : m));
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    setMessages(prev => prev.map((m, i) => i === index ? { ...m, isGeneratingImage: false, error: true } : m));
                                                                }}
                                                            />
                                                            {msg.isGeneratingImage && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-kaya-card/50 backdrop-blur-sm">
                                                                    <div className="w-12 h-12 border-4 border-kaya-teal/30 border-t-kaya-teal rounded-full animate-spin" />
                                                                    <span className="text-sm font-medium text-kaya-teal animate-pulse">Painting your imagination...</span>
                                                                </div>
                                                            )}
                                                            {msg.error && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                                                                    <X className="w-10 h-10 text-red-500 mb-2" />
                                                                    <span className="text-white font-medium">Failed to generate image</span>
                                                                    <span className="text-sm text-white/50">Pollinations services might be temporarily unavailable.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!msg.isGeneratingImage && !msg.error && (
                                                            <div className="flex gap-2 mt-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(msg.imageUrl);
                                                                        toast.success('Image URL copied!');
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors border border-white/10"
                                                                >
                                                                    <Copy size={14} /> Copy URL
                                                                </button>
                                                                <a 
                                                                    href={msg.imageUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-kaya-teal text-kaya-dark rounded-lg text-sm font-bold transition-all hover:scale-105"
                                                                >
                                                                    <Download size={14} /> Download
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                )}
                                                
                                                {/* Assistant Actions (Normal AI) */}
                                                {!msg.isPollinations && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                                        {msg.pdfUrl && (
                                                            <a href={msg.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-kaya-purple text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all">
                                                                <Download size={14} /> PDF
                                                            </a>
                                                        )}
                                                        {msg.previewUrl && (
                                                            <a href={msg.previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all">
                                                                🌐 Preview
                                                            </a>
                                                        )}
                                                        
                                                        <button onClick={() => handleTTS(msg.content, index)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium rounded-lg transition-colors">
                                                            {playingAudio === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                            {playingAudio === index ? 'Stop' : 'Listen'}
                                                        </button>
                                                        <button onClick={() => copyToClipboard(msg.content, index)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium rounded-lg transition-colors">
                                                            {copiedIndex === index ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                                                            {copiedIndex === index ? 'Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{msg.displayContent || msg.content}</div>
                                        )}

                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="Generated" className="mt-3 rounded-xl max-w-full border border-black/10 shadow-md" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-kaya-card border border-white/5 rounded-[1.5rem] p-5 rounded-bl-sm flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-kaya-teal animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Container */}
                <div className="p-4 md:p-6 bg-gradient-to-t from-kaya-dark via-kaya-dark to-transparent pb-20 md:pb-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex flex-col bg-kaya-card border border-white/10 rounded-3xl shadow-xl focus-within:border-kaya-teal/50 focus-within:shadow-[0_0_20px_rgba(0,212,170,0.15)] transition-all">
                            
                            {/* Attachment Preview */}
                            {attachment && (
                                <div className="flex items-center gap-3 p-3 mx-3 mt-3 bg-white/5 border border-white/10 rounded-xl">
                                    {attachment.isImage ? (
                                        <img src={attachment.content} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg"><FileText size={20} className="text-kaya-teal" /></div>
                                    )}
                                    <span className="text-sm font-medium text-white/80 truncate max-w-[200px]">{attachment.name}</span>
                                    <button onClick={removeAttachment} className="ml-auto p-1.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-end gap-2 p-3">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all shrink-0">
                                    <Paperclip size={20} />
                                </button>
                                
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit();
                                        }
                                    }}
                                    placeholder="Message Kaya..."
                                    className="flex-1 max-h-48 min-h-[44px] py-3 bg-transparent border-none outline-none resize-none text-white placeholder:text-white/30"
                                    rows={1}
                                />
                                
                                <button 
                                    onClick={handleSubmit}
                                    disabled={(!input.trim() && !attachment) || isLoading}
                                    className="p-3 bg-white text-black hover:bg-kaya-teal rounded-full shrink-0 transition-all shadow-md disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
                                >
                                    <ArrowUp size={20} className={(!input.trim() && !attachment) || isLoading ? "" : "font-bold"} />
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-3 text-xs text-white/30 font-medium tracking-wide hidden md:block">
                            Kaya AI can make mistakes. Consider verifying important information.
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-kaya-card/90 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
                        <Menu size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
                    </button>
                    <button onClick={handleNewChat} className="flex flex-col items-center gap-1 text-kaya-teal">
                        <div className="p-2 bg-kaya-teal/10 rounded-lg">
                            <Plus size={20} />
                        </div>
                    </button>
                    <button onClick={() => setShowAPIKey(true)} className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
                        <Key size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">API</span>
                    </button>
                    <button onClick={handleExportPDF} className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
                        <Download size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">PDF</span>
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }} className="flex flex-col items-center gap-1 text-red-400/70 hover:text-red-400 transition-colors">
                        <LogOut size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Exit</span>
                    </button>
                </div>
            </main>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.java,.c,.cpp,.h,.pdf,.png,.jpg,.jpeg,.webp"
            />

            {/* Install Prompt Button */}
            <AnimatePresence>
                {deferredPrompt && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50"
                    >
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center gap-2 px-5 py-3 font-semibold text-white bg-green-500 rounded-full shadow-xl hover:bg-green-400 hover:scale-105 transition-all"
                        >
                            <Download size={18} /> Install App
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {showAPIKey && <APIKeyModal onClose={() => setShowAPIKey(false)} />}
        </div>
    );
};

export default ChatInterface;
