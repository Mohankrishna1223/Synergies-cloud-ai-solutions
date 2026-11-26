import { useState, useEffect, useRef } from 'react';

const SLIDES = [
  {
    img: '/slides/slide1.jpg',
    tag: 'AI · Finance · Future',
    title: 'Building an AI-native future for finance and talent',
    quote: '"Intelligence embedded in every transaction, every decision, every workflow."',
  },
  {
    img: '/slides/slide2.jpg',
    tag: 'AI · Banking · BFSI',
    title: 'Transforming BFSI with production-grade AI systems',
    quote: '"The future of banking is not digital — it is intelligent."',
  },
  {
    img: '/slides/slide3.jpg',
    tag: 'AI · Talent · Growth',
    title: 'Growing the next generation of AI engineers',
    quote: '"Every intern we grow becomes an engineer we trust."',
  },
  {
    img: '/slides/slide4.jpg',
    tag: 'AI · Automation · Scale',
    title: 'Automating enterprise workflows at unprecedented scale',
    quote: '"Build systems that learn, and teams that do too."',
  },
  {
    img: '/slides/slide5.jpg',
    tag: 'AI · Community · Impact',
    title: 'Community-first AI for a more equitable future',
    quote: '"Opportunity should never depend on a fee."',
  },
];

const INTERVAL = 4000;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const goTo = (idx) => {
    setCurrent(idx);
    setAnimKey(k => k + 1);
    setProgress(0);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
      setAnimKey(k => k + 1);
      setProgress(0);
    }, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / INTERVAL) * 100, 100);
      setProgress(pct);
    }, 50);
    return () => clearInterval(progressRef.current);
  }, [current]);

  const s = SLIDES[current];

  return (
    <div className="hero-slider">
      <div
        className="slides-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div className="slide" key={i}>
            <img src={slide.img} alt={slide.tag} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>

      {/* Overlay with text */}
      <div className="slide-overlay">
        <div className={`slide-content animate`} key={animKey}>
          <div className="slide-tag">{s.tag}</div>
          <h1 className="slide-title">{s.title}</h1>
          <p className="slide-quote">{s.quote}</p>
          <div className="cta">
            <a href="#bfsi"><button className="btn solid">Explore BFSI Solutions</button></a>
            <a href="#internships"><button className="btn" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }}>Find an Internship</button></a>
          </div>
        </div>
      </div>

      {/* Arrow controls */}
      <div className="slider-arrows">
        <button className="arrow-btn" onClick={prev} aria-label="Previous slide">&#8592;</button>
        <button className="arrow-btn" onClick={next} aria-label="Next slide">&#8594;</button>
      </div>

      {/* Dot indicators */}
      <div className="slider-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`dot${current === i ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="slider-progress"
        style={{ width: `${progress}%`, transition: progress === 0 ? 'none' : 'width 0.05s linear' }}
      />
    </div>
  );
}
