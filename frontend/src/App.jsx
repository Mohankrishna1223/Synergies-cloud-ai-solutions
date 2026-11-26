import { useState, useEffect } from 'react';
import './index.css';

import Header          from './components/Header';
import HeroSlider      from './components/HeroSlider';
import HeroSection     from './components/HeroSection';
import Stats           from './components/Stats';
import MarqueeQuotes   from './components/MarqueeQuotes';
import BFSISection     from './components/BFSISection';
import InternshipPortal from './components/InternshipPortal';
import CertificateValidation from './components/CertificateValidation';
import AppliedAI       from './components/AppliedAI';
import { AIEvolution } from './components/FlowCharts';
import Community       from './components/Community';
import Footer          from './components/Footer';
import ChatBot         from './components/ChatBot';

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [chatOpen, setChatOpen] = useState(false);

  useReveal();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <>
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onChat={() => setChatOpen(o => !o)}
      />

      {/* ── HERO SLIDER: first thing visible on load ── */}
      <HeroSlider />

      {/* ── HERO TEXT with animated SVG orb ── */}
      <HeroSection />

      {/* ── STATS COUNTER ── */}
      <Stats />

      {/* ── SCROLLING QUOTES ── */}
      <MarqueeQuotes />

      {/* ── BFSI SOLUTIONS ── */}
      <BFSISection />

      {/* ── INTERNSHIP PORTAL ── */}
      <InternshipPortal />

      {/* ── CERTIFICATE VALIDATION ── */}
      <CertificateValidation />

      {/* ── APPLIED AI ── */}
      <AppliedAI />

      {/* ── AI EVOLUTION TIMELINE ── */}
      <AIEvolution />

      {/* ── COMMUNITY ── */}
      <Community />

      {/* ── CONNECT BOX & FOOTER SECTION ── */}
      <Footer />

      {/* ── CHAT WIDGET ── */}
      <ChatBot open={chatOpen} onClose={() => setChatOpen(o => !o)} />
    </>
  );
}
