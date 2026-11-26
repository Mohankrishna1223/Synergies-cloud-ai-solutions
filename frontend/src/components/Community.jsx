import { StudentJourney } from './FlowCharts';

const CARDS = [
  { i: '🛠️', t: 'AI services',          d: 'Enterprise AI, RAG platforms and cloud engineering for BFSI clients.' },
  { i: '🌱', t: 'Our own talent pipeline', d: 'Interns learn on live delivery work and grow into our teams.' },
  { i: '🎓', t: 'Free to apply',          d: 'Students can apply to any internship at no cost.' },
  { i: '🤝', t: 'Community building',     d: 'Mentoring, study circles and shared learning that lift everyone.' },
];

export default function Community() {
  return (
    <section id="community">
      <h2 className="reveal">Built with the community</h2>
      <p className="sub reveal">
        Synergy Cloud AI Solutions delivers AI services to enterprises and grows its own engineers
        through an internship program that is free to apply for.
      </p>
      <div className="grid reveal">
        {CARDS.map((c, i) => (
          <div className="card" key={i}>
            <div className="ico">{c.i}</div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
      <StudentJourney />
    </section>
  );
}
