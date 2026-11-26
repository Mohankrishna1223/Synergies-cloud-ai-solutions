import { useState, useRef, useEffect } from 'react';

const FAQ = {
  'What internships are open?': 'We have 8 sample roles open across AI, Backend, Frontend, Cloud, Analytics and Quality. Use the filters in the Internship Portal section.',
  'What BFSI solutions do you offer?': 'Loan origination AI, fraud detection, claims automation, underwriting assistant, portfolio insights and a regulatory monitor.',
  'Which tech stack do you use?': 'React frontends, Python FastAPI services, and AWS cloud. The database layer is configured per deployment.',
  'How do I apply?': 'Pick a role in the Internship Portal and press Apply. Submissions connect to the FastAPI backend.',
};

export default function ChatBot({ open, onClose }) {
  const [msgs, setMsgs] = useState([{ t: "Hi there, I'm Synergy AI. How can I help you today?", c: 'bot' }]);
  const [input, setInput] = useState('');
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const ask = async (q) => {
    setMsgs(m => [...m, { t: q, c: 'me' }]);
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTimeout(() => setMsgs(m => [...m, { t: data?.reply || FAQ[q] || 'Thanks for your message! A Synergy team member will follow up.', c: 'bot' }]), 400);
    } catch {
      const reply = FAQ[q] || 'Thanks for your message! A Synergy team member will follow up.';
      setTimeout(() => setMsgs(m => [...m, { t: reply, c: 'bot' }]), 400);
    }
  };

  const send = () => {
    if (input.trim()) { ask(input.trim()); setInput(''); }
  };

  return (
    <>
      <button id="fab" className="fab" aria-label="Open chat" onClick={onClose}>💬</button>
      <div id="chat" className={`chat-panel${open ? ' open' : ''}`} role="dialog" aria-label="Synergy AI chat">
        <div className="ch">
          <span>Synergy AI</span>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="msgs" ref={msgsRef}>
          {msgs.map((m, i) => <div key={i} className={`msg ${m.c}`}>{m.t}</div>)}
        </div>
        <div className="qs-list">
          {Object.keys(FAQ).map(q => (
            <button key={q} onClick={() => ask(q)}>{q}</button>
          ))}
        </div>
        <div className="cin">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask me anything"
          />
          <button onClick={send} aria-label="Send">➤</button>
        </div>
      </div>
    </>
  );
}
