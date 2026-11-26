import { useState } from 'react';

export default function Footer() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleDraftMail = (e) => {
    e.preventDefault();
    const mailSubject = subject.trim() || 'Inquiry - Synergy Cloud AI Solutions';
    const mailBody = body.trim() || 'Hello Synergy Cloud AI Solutions Team,\n\nI would like to connect regarding...';
    const mailtoUrl = `mailto:askhr@synergycloudai.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <footer id="connect" className="site-footer">
      {/* ── CONNECT BOX ── */}
      <div className="connect-wrapper reveal in">
        <div className="connect-card">
          <div className="connect-info">
            <span className="connect-badge">CONNECT WITH US</span>
            <h3>Registered Corporate Office</h3>
            <p className="connect-desc">
              Have questions about our enterprise AI solutions, talent pipelines, or open internships? Reach out to our team directly.
            </p>

            <div className="company-details">
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">📍</span>
                <div>
                  <strong>Regd. Office</strong>
                  <p>202, Plot no 526, Sarah Enclave, Gayatri Nagar, Madhapur, Hyderabad - 500018</p>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">📞</span>
                <div>
                  <strong>Phone</strong>
                  <p><a href="tel:+919866856453">+91 9866856453</a></p>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">✉️</span>
                <div>
                  <strong>Email</strong>
                  <p><a href="mailto:askhr@synergycloudai.com">askhr@synergycloudai.com</a></p>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">🌐</span>
                <div>
                  <strong>Website</strong>
                  <p><a href="https://www.synergycloudaisolutions.com" target="_blank" rel="noreferrer">www.synergycloudaisolutions.com</a></p>
                </div>
              </div>
            </div>
          </div>

          {/* ── DRAFT MAIL BOX ── */}
          <div className="mail-drafter-box">
            <h4>Draft an Email</h4>
            <p className="mail-drafter-subtitle">
              Compose your note below to draft an email directly to <strong>askhr@synergycloudai.com</strong>.
            </p>

            <form onSubmit={handleDraftMail} className="mail-form">
              <div className="form-group">
                <label htmlFor="mail-subject">Subject</label>
                <input
                  id="mail-subject"
                  type="text"
                  placeholder="e.g., Application for AI Internship / Project Inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mail-body">Message Body</label>
                <textarea
                  id="mail-body"
                  rows={4}
                  placeholder="Write your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                ></textarea>
              </div>

              <div className="mail-form-actions">
                <button type="submit" className="btn solid btn-draft">
                  ✉️ Draft Mail
                </button>
                <a
                  href="mailto:askhr@synergycloudai.com"
                  className="btn btn-outline"
                >
                  Direct Mail Link
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── FOOTER BOTTOM SECTION ── */}
      <div className="footer-bottom">
        <div className="footer-brand">
          <strong>Synergy Cloud AI Solutions</strong>
        </div>
        <div className="footer-links">
          <a href="#bfsi">BFSI</a>
          <a href="#internships">Internships</a>
          <a href="#evolution">AI Journey</a>
          <a href="#community">Community</a>
          <a href="#connect">Connect</a>
        </div>
        <div className="footer-copy">
          © 2026 Synergy Cloud AI Solutions · AI-native future for finance and talent
        </div>
      </div>
    </footer>
  );
}
