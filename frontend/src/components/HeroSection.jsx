import { useEffect, useRef } from 'react';

/* petal SVG builder */
function buildPetals() {
  let h = '';
  for (let i = 0; i < 28; i++) {
    const a = (i * 360) / 28;
    const rx = 18 + (i % 7) * 2;
    const op = (0.35 + (i / 28) * 0.6).toFixed(2);
    h += `<ellipse cx="200" cy="105" rx="${rx}" ry="62" fill="url(#g)" opacity="${op}" transform="rotate(${a} 200 200)"/>`;
  }
  return h;
}

export default function HeroSection() {
  const petalRef = useRef(null);

  useEffect(() => {
    if (petalRef.current) {
      petalRef.current.innerHTML = buildPetals();
    }
  }, []);

  return (
    <div id="top" className="hero">
      <div className="blob" style={{ width: 380, height: 380, background: '#00aeef', top: -80, left: -80 }} />
      <div className="blob" style={{ width: 320, height: 320, background: '#ff7a3d', bottom: -60, right: '10%', animationDelay: '-5s' }} />

      <div className="hero-text reveal in">
        <h1>Building an <span>AI-native</span> future for finance and talent</h1>
        <p>
          Synergy Cloud AI Solutions embeds AI into banking, financial services and insurance workflows,
          and grows the next generation of engineers through a structured internship program.
        </p>
        <div className="cta">
          <a href="#bfsi"><button className="btn solid">Explore BFSI Solutions</button></a>
          <a href="#internships"><button className="btn">Find an Internship</button></a>
        </div>
      </div>

      <svg className="orb" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#ffb347"/>
            <stop offset=".5" stopColor="#ff4d8d"/>
            <stop offset="1" stopColor="#7b2ff7"/>
          </linearGradient>
        </defs>
        <g className="petal" ref={petalRef}/>
        <circle cx="200" cy="200" r="14" fill="#ffd36b"/>
        <g className="ring">
          <circle cx="200" cy="200" r="188" fill="none" stroke="#00aeef" strokeWidth="1.5" strokeDasharray="3 9"/>
          <circle cx="200" cy="12" r="7" fill="#00aeef"/>
        </g>
        <g className="ring2">
          <circle cx="200" cy="200" r="172" fill="none" stroke="#ff7a3d" strokeWidth="1" strokeDasharray="14 10" opacity=".7"/>
          <circle cx="200" cy="372" r="5" fill="#ff7a3d"/>
        </g>
      </svg>
    </div>
  );
}
