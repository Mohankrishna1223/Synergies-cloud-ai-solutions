import { useEffect, useRef, useState } from 'react';

function useCounter(target, isVisible) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    let v = 0;
    const t = setInterval(() => {
      v += Math.ceil(target / 40);
      if (v >= target) { v = target; clearInterval(t); }
      setVal(v);
    }, 30);
    return () => clearInterval(t);
  }, [isVisible, target]);
  return val;
}

function StatItem({ n, suffix, label }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const val = useCounter(n, visible);
  return (
    <div className="stat" ref={ref}>
      <b>{val}{suffix}</b>
      <div>{label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="alt">
      <div className="stats">
        <StatItem n={120} suffix="+" label="Enterprise workflows automated" />
        <StatItem n={45}  suffix="+" label="Open internship seats" />
        <StatItem n={98}  suffix="%" label="Platform uptime target" />
        <StatItem n={12}  suffix=""  label="BFSI client programs" />
      </div>
    </section>
  );
}
