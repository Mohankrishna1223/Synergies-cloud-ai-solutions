const QUOTES = [
  'Technology should strengthen businesses and the communities around them.',
  'Every intern we grow becomes an engineer we trust.',
  'Build systems that learn, and teams that do too.',
  'Opportunity should never depend on a fee.',
  'Production-grade AI starts with production-grade people.',
  'Great software is built by communities, not just companies.',
  'Learn in the open, ship with care.',
  'From classroom to client delivery.',
];

function Row({ quotes, reverse }) {
  const repeated = [...quotes, ...quotes, ...quotes, ...quotes];
  return (
    <div className={`mt${reverse ? ' rev' : ''}`}>
      {repeated.map((t, i) => <span className="q" key={i}>{t}</span>)}
    </div>
  );
}

export default function MarqueeQuotes() {
  return (
    <div className="mq" aria-label="Our beliefs">
      <Row quotes={QUOTES.slice(0, 4)} reverse={false} />
      <Row quotes={QUOTES.slice(4)} reverse={true} />
    </div>
  );
}
