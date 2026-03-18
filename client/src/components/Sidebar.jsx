import React from 'react';
import { Plus, Search, Library, Settings, LayoutGrid, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{
            width: '260px',
            height: '100%',
            backgroundColor: 'var(--bg-primary)', // Matches body but distinct via border usually
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                fontWeight: 'bold',
                fontSize: '1.3rem',
                background: 'linear-gradient(135deg, #667eea, #f093fb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
            }}>
                <MessageSquare size={24} style={{ marginRight: '8px', color: '#667eea' }} />
                <span>Kaya AI</span>
            </div>

            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', width: '100%' }}>
                <Plus size={18} style={{ marginRight: '8px' }} />
                New task
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarItem icon={<Search size={18} />} label="Search" />
                <SidebarItem icon={<Library size={18} />} label="Library" />
            </div>

            <div style={{ marginTop: '32px', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Projects
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Plus size={16} style={{ marginRight: '8px' }} /> New project
            </div>

            <div style={{ flex: 1 }} />

            {/* User Info */}
            {user && (
                <div style={{
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    marginBottom: '12px'
                }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>
                        {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {user.email}
                    </div>
                </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <SidebarItem icon={<Settings size={18} />} label="Settings" />
                <div onClick={handleLogout}>
                    <SidebarItem icon={<LogOut size={18} />} label="Logout" />
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, label }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'background-color 0.2s, color 0.2s'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
        }}
    >
        <span style={{ marginRight: '12px' }}>{icon}</span>
        {label}
    </div>
);

export default Sidebar;
