import { useEffect, useRef } from 'react';

const FLOW_DATA = [
  ['1950s–80s', 'Rules & Expert Systems', 'Hand-coded logic and statistics'],
  ['1990s–2000s', 'Machine Learning', 'Models learn patterns from data'],
  ['2012', 'Deep Learning', 'Neural networks excel at images and speech'],
  ['2017', 'Transformers', 'Attention makes language modelling scale'],
  ['2020+', 'Large Language Models', 'General models that follow instructions'],
  ['2023+', 'RAG & Agents', 'Models grounded in private data, using tools'],
  ['Today', 'Applied AI at Synergy', 'Production systems for BFSI workflows'],
];

const JOURNEY_DATA = [
  ['Step 1', 'Apply free', 'Open to students at no cost'],
  ['Step 2', 'Learn', 'Mentor-led structured tracks'],
  ['Step 3', 'Build', 'Work on real company projects'],
  ['Step 4', 'Intern', 'Join Synergy delivery teams'],
  ['Step 5', 'Grow', 'Lead, mentor and give back'],
];

function FlowChart({ id, data, cols }) {
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { ref.current?.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id={id}
      className="flow reveal"
      ref={ref}
      style={{ '--cols': cols }}
    >
      {data.map(([era, title, desc], i) => (
        <div
          key={i}
          className={`fn${i === data.length - 1 ? ' last' : ''}`}
          style={{ '--i': i }}
        >
          <div className="dot">{i + 1}</div>
          <small>{era}</small>
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      ))}
    </div>
  );
}

export function AIEvolution() {
  return (
    <section id="evolution" className="alt">
      <h2 className="reveal">How modern AI systems came to be</h2>
      <p className="sub reveal">From hand-written rules to systems that reason over your business data.</p>
      <FlowChart id="flow" data={FLOW_DATA} cols={7} />
    </section>
  );
}

export function StudentJourney() {
  return (
    <>
      <h3 className="reveal" style={{ margin: '44px 0 18px', padding: '0 5vw' }}>The student journey</h3>
      <div style={{ padding: '0 5vw 20px' }}>
        <FlowChart id="journey" data={JOURNEY_DATA} cols={5} />
      </div>
    </>
  );
}
