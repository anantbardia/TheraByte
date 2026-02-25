import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Users, Hash, Send } from 'lucide-react';
import './CommunityGroups.css';

const CommunityGroups = ({ auth }) => {
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputVal, setInputVal] = useState('');
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Fetch available groups on load
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/groups`)
            .then(res => res.json())
            .then(data => setGroups(data))
            .catch(console.error);
    }, []);

    // Handle auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle WebSocket connection when group changes
    useEffect(() => {
        if (!activeGroup) return;

        // Fetch message history first
        fetch(`${import.meta.env.VITE_API_URL}/api/groups/${activeGroup.id}/messages`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(console.error);

        // Establish WebSocket Connection
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsBase = apiUrl.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsBase}/ws/groups/${activeGroup.id}?user_id=${auth.user_id}`);

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "system_alert") {
                // Show system alert in chat
                setMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
            } else if (msg.type === "chat_message") {
                setMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
            }
        };

        wsRef.current = ws;

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [activeGroup, auth.user_id]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputVal.trim() || !wsRef.current) return;

        // WebSockets handle the payload as raw text for simplicity in our backend
        wsRef.current.send(inputVal);
        setInputVal('');
    };

    return (
        <div className="cg-container">
            {/* Sidebar: Group List */}
            <div className="cg-sidebar">
                <div className="cg-sidebar-header">
                    <h2><Users size={18} /> Support Groups</h2>
                    <p>Anonymous AI-moderated spaces</p>
                </div>
                <div className="cg-list">
                    {groups.map(g => (
                        <button
                            key={g.id}
                            className={`cg-list-item ${activeGroup?.id === g.id ? 'active' : ''}`}
                            onClick={() => setActiveGroup(g)}
                        >
                            <Hash size={16} />
                            <div className="cg-li-text">
                                <span className="cg-li-name">{g.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="cg-main">
                {!activeGroup ? (
                    <div className="cg-empty-state">
                        <Users size={48} />
                        <h3>Select a Support Group</h3>
                        <p>Connect anonymously with people navigating similar challenges.</p>
                        <div className="cg-safety-badge">
                            <ShieldAlert size={14} /> AI Moderated for Safety
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cg-chat-header">
                            <div className="cg-ch-info">
                                <h3>{activeGroup.name}</h3>
                                <p>{activeGroup.topic}</p>
                            </div>
                            <div className="cg-safety-badge sm">
                                <ShieldAlert size={12} /> Protected Room
                            </div>
                        </div>

                        <div className="cg-messages">
                            <div className="cg-welcome-alert">
                                <ShieldAlert size={14} />
                                You have joined the room anonymously. The TheraByte moderation AI is active to ensure a safe environment.
                            </div>

                            {messages.map((m, i) => {
                                const isSelf = m.user_id === auth.user_id;
                                const isSystem = m.type === "system_alert";

                                if (isSystem) {
                                    return (
                                        <div key={i} className="cg-msg-system">
                                            <ShieldAlert size={14} /> {m.content}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={i} className={`cg-msg-row ${isSelf ? 'self' : ''}`}>
                                        <div className="cg-msg-bubble-wrap">
                                            {!isSelf && <span className="cg-msg-author">{m.author_name}</span>}
                                            <div className={`cg-msg-bubble ${isSelf ? 'self' : ''}`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="cg-input-area" onSubmit={sendMessage}>
                            <input
                                type="text"
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                placeholder={`Message #${activeGroup.id}...`}
                            />
                            <button type="submit" disabled={!inputVal.trim()}>
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default CommunityGroups;
