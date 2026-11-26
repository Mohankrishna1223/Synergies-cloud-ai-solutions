import { useState, useEffect } from 'react';

const BFSI_DATA = [
  { c: 'Banking',        i: '🏦', t: 'Loan Origination AI',    d: 'Automates document intake, KYC checks and credit pre-scoring.' },
  { c: 'Banking',        i: '💳', t: 'Fraud Detection',         d: 'Real-time anomaly detection on card and UPI transactions.' },
  { c: 'Insurance',      i: '📄', t: 'Claims Automation',       d: 'Extracts, validates and routes claims with human-in-the-loop review.' },
  { c: 'Insurance',      i: '📈', t: 'Underwriting Assistant',  d: 'Risk summaries from policy documents using RAG.' },
  { c: 'Capital Markets',i: '📊', t: 'Portfolio Insights',      d: 'Explainable analytics dashboards for advisors.' },
  { c: 'Compliance',     i: '🛡️', t: 'Regulatory Monitor',      d: 'Tracks circulars and maps them to internal controls.' },
];

const CATEGORIES = ['All', ...new Set(BFSI_DATA.map(x => x.c))];

export default function BFSISection() {
  const [active, setActive] = useState('All');
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Try backend; fall back to static data
    fetch('http://localhost:8000/api/bfsi')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setItems(Array.isArray(data) ? data : BFSI_DATA))
      .catch(() => setItems(BFSI_DATA));
  }, []);

  const safeItems = Array.isArray(items) && items.length > 0 ? items : BFSI_DATA;
  const filtered = active === 'All' ? safeItems : safeItems.filter(x => x && x.c === active);

  return (
    <section id="bfsi">
      <h2 className="reveal">BFSI Solutions</h2>
      <p className="sub reveal">Production-grade AI for banking, financial services and insurance.</p>
      <div className="filters reveal">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`chip${active === cat ? ' on' : ''}`} onClick={() => setActive(cat)}>
            {cat}
          </button>
        ))}
      </div>
      <div className="bfsi-flex">
        {filtered.map((x, i) => (
          <div className="card bfsi-card" key={i} style={{ animationDelay: `${i * 60}ms` }}>
            <div>
              <div className="ico">{x.i}</div>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </div>
            <span className="tag">{x.c}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
