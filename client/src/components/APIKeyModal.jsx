import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001';

const APIKeyModal = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');

                const response = await fetch(`${API_BASE_URL}/api/auth/api-key`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.apiKey) {
                    setApiKey(data.apiKey);
                } else {
                    throw new Error(data.error || 'Failed to fetch API key');
                }
            } catch (error) {
                console.error('API Key error:', error);
                toast.error(error.message);
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchApiKey();
    }, [onClose]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            toast.success('API Key copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const curlExample = `curl -X POST ${API_BASE_URL}/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello Kaya!"}],
    "provider": "groq"
  }'`;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '32px',
                    width: '100%',
                    maxWidth: '600px',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        padding: '10px',
                        borderRadius: '12px',
                        color: 'white'
                    }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', margin: 0 }}>Kaya AI API Key</h2>
                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0' }}>Your personal access key for developer integration</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        Generating your key...
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', fontWeight: '500' }}>
                                Secret Key
                            </label>
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                background: '#050505',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #333'
                            }}>
                                <code style={{
                                    flex: 1,
                                    color: '#4facfe',
                                    fontSize: '14px',
                                    wordBreak: 'break-all',
                                    fontFamily: 'monospace',
                                    userSelect: 'all'
                                }}>
                                    {apiKey}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    style={{
                                        background: copied ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                                ⚠️ Never share your API key. It provides full access to your account.
                            </p>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Terminal size={16} color="#888" />
                                <span style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Quick Start Example</span>
                            </div>
                            <pre style={{
                                background: '#050505',
                                padding: '16px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: '#aaa',
                                overflowX: 'auto',
                                border: '1px solid #222',
                                margin: 0
                            }}>
                                {curlExample}
                            </pre>
                        </div>
                    </>
                )}

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        marginTop: '32px',
                        padding: '14px',
                        background: 'transparent',
                        border: '1px solid #333',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default APIKeyModal;
