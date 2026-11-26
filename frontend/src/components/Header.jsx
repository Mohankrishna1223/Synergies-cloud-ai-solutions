export default function Header({ theme, toggleTheme, onChat }) {
  return (
    <header className="header">
      <a className="logo" href="#top">
        <svg width="42" height="32" viewBox="0 0 84 64" aria-hidden="true">
          <path d="M20 58h44a14 14 0 0 0 2-28 20 20 0 0 0-38-6A17 17 0 0 0 20 58z"
            fill="none" stroke="#00aeef" strokeWidth="6"/>
          <circle cx="30" cy="30" r="4" fill="#777"/>
          <circle cx="42" cy="27" r="4" fill="#777"/>
          <circle cx="54" cy="30" r="4" fill="#777"/>
          <rect x="26" y="36" width="8" height="22" fill="#00aeef"/>
          <rect x="38" y="33" width="8" height="25" fill="#00aeef"/>
          <rect x="50" y="36" width="8" height="22" fill="#00aeef"/>
        </svg>
        <span>Synergy Cloud<small>AI SOLUTIONS</small></span>
      </a>
      <nav className="nav">
        <a href="#bfsi">BFSI</a>
        <a href="#internships">Internships</a>
        <a href="#certificates">Verify Certificate</a>
        <a href="#evolution">AI Journey</a>
        <a href="#community">Community</a>
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="btn" onClick={onChat}>Let's Connect</button>
      </nav>
    </header>
  );
}
