import { useState, useEffect } from 'react';

export default function InternshipPortal() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('All');
  const [mode, setMode] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/jobs')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setJobs([]);
        setLoading(false);
      });
  }, []);

  // Dynamically compute domains and modes from database items
  const domains = ['All', ...new Set(jobs.map(x => (x.domain || x.d || '').trim()).filter(Boolean))];
  const modes = ['All', ...new Set(jobs.map(x => {
    const raw = (x.location || x.mode || x.m || '').trim();
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : '';
  }).filter(Boolean))];

  const filtered = jobs.filter(x => {
    const itemDomain = (x.domain || x.d || '').toLowerCase();
    const itemMode = (x.location || x.mode || x.m || '').toLowerCase();
    const title = (x.title || x.t || '').toLowerCase();
    const internId = (x.intern_id || '').toLowerCase();
    const expLevel = (x.experience_level || '').toLowerCase();
    const empType = (x.employment_type || '').toLowerCase();

    let skillsStr = '';
    if (Array.isArray(x.skills)) skillsStr = x.skills.join(' ');
    else if (Array.isArray(x.s)) skillsStr = x.s.join(' ');
    else if (typeof x.skills === 'string') skillsStr = x.skills;

    const matchesDomain = domain === 'All' || itemDomain === domain.toLowerCase();
    const matchesMode = mode === 'All' || itemMode === mode.toLowerCase();
    const qLower = query.toLowerCase().trim();
    const matchesQuery = !qLower ||
      title.includes(qLower) ||
      internId.includes(qLower) ||
      itemMode.includes(qLower) ||
      expLevel.includes(qLower) ||
      empType.includes(qLower) ||
      skillsStr.toLowerCase().includes(qLower);

    return matchesDomain && matchesMode && matchesQuery;
  });

  return (
    <section id="internships" className="alt">
      <h2 className="reveal">Internship Portal</h2>
      <p className="sub reveal">Search and filter open roles across domains, modes and durations.</p>

      <div className="filters reveal">
        <input
          id="q"
          className="search-input"
          placeholder="Search roles, skills, intern ID…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {domains.length > 1 && (
          <span>
            {domains.map(d => (
              <button key={d} className={`chip${domain === d ? ' on' : ''}`} onClick={() => setDomain(d)}>{d}</button>
            ))}
          </span>
        )}
        {modes.length > 1 && (
          <span>
            {modes.map(m => (
              <button key={m} className={`chip${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>{m}</button>
            ))}
          </span>
        )}
      </div>

      <div className="grid">
        {loading ? (
          <div className="empty">Loading internships from database…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No internships match your filters.</div>
        ) : (
          filtered.map((x, i) => {
            const title = x.title || x.t || 'Internship Role';
            const rawLoc = (x.location || x.mode || x.m || '').trim();
            const location = rawLoc ? rawLoc.charAt(0).toUpperCase() + rawLoc.slice(1).toLowerCase() : '';
            const expLevel = x.experience_level || '';
            const empType = x.employment_type || '';
            const duration = x.duration || x.w || '';
            const internId = x.intern_id || '';
            const imageSrc = typeof x.image === 'string' ? x.image.trim() : '';

            let skillsList = [];
            if (Array.isArray(x.skills)) skillsList = x.skills;
            else if (Array.isArray(x.s)) skillsList = x.s;
            else if (typeof x.skills === 'string' && x.skills) skillsList = x.skills.split(',').map(s => s.trim());

            // If skills list is empty, display experience level and employment type as tags
            const tags = skillsList.length > 0 ? skillsList : [expLevel, empType].filter(Boolean);

            const metaParts = [location, empType, expLevel, duration].filter(Boolean);

            return (
              <div className="card job" key={internId || i} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="job-img-box">
                  {imageSrc ? (
                    <img
                      className="job-img"
                      src={imageSrc}
                      alt={title}
                    />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--mute)', fontSize: '13px' }}>
                      No image in DB
                    </div>
                  )}
                  {internId && (
                    <span
                      className="tag"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        margin: 0,
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(15, 23, 42, 0.82)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {internId}
                    </span>
                  )}
                </div>

                <div className="job-body">
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
                    {metaParts.length > 0 && (
                      <p style={{ margin: '0 0 10px', color: 'var(--mute)', fontSize: '13px' }}>
                        {metaParts.join(' · ')}
                      </p>
                    )}
                    <div>
                      {tags.map((tag, tagIdx) => (
                        <span className="tag" key={`${tag}-${tagIdx}`}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="row" style={{ marginTop: '16px', paddingTop: '8px' }}>
                    <span className="tag" style={{ margin: 0 }}>Free to apply</span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        window.location.href = 'http://localhost:5173';
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
