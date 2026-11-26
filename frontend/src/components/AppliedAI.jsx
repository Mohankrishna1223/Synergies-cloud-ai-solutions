const CARDS = [
  { i: '🧠', t: 'RAG Platforms',      d: 'Retrieval-augmented assistants grounded in policy and product documents.' },
  { i: '☁️', t: 'Cloud Engineering',  d: 'Secure, scalable AWS-based architectures for regulated industries.' },
  { i: '🛡️', t: 'Responsible AI',     d: 'Audit trails, explainability and governance built in from day one.' },
];

export default function AppliedAI() {
  return (
    <section id="insights">
      <h2 className="reveal">Applied AI</h2>
      <p className="sub reveal">Systems that learn. Outcomes that compound.</p>
      <div className="grid reveal">
        {CARDS.map((c, i) => (
          <div className="card" key={i}>
            <div className="ico">{c.i}</div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
