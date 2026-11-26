import { useState } from 'react';

export default function CertificateValidation() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const trimmedId = studentId.trim();
    const trimmedName = name.trim();

    if (!trimmedId || !trimmedName) {
      setError('Please provide both Student ID and Full Name.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/certificates/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: trimmedId,
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'User with the provided student ID and name is not present in our portal.'
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to certificate validation service.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentId('');
    setName('');
    setResult(null);
    setError('');
  };

  return (
    <section id="certificates" className="alt">
      <h2 className="reveal">Certificate Validation</h2>
      <p className="sub reveal">
        Real-time, authentic verification of internship and training certificates issued by Synergy Cloud AI Solutions.
      </p>

      <div className="connect-wrapper reveal" style={{ marginTop: '30px' }}>
        <div className="connect-card" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Left Column: Information & Trust Badges */}
          <div className="connect-info">
            <span className="connect-badge">SECURE CREDENTIAL VERIFIER</span>
            <h3>Instant Authenticity Check</h3>
            <p className="connect-desc">
              All credentials issued by Synergy Cloud AI Solutions are cryptographically recorded in our cloud registry.
              Employers, academic institutions, and students can instantly verify certificate validity here.
            </p>

            <div className="company-details">
              <div className="detail-item">
                <span className="detail-icon">🛡️</span>
                <div>
                  <strong>Tamper-Proof Registry</strong>
                  <p>Direct query against our AWS cloud certificate database.</p>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon">📋</span>
                <div>
                  <strong>Required Information</strong>
                  <p>Enter the exact Student ID (e.g. STU-1001) and Full Name as printed on the certificate.</p>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon">⚡</span>
                <div>
                  <strong>Real-time API Status</strong>
                  <p>Powered by our FastAPI Certificate Automation Backend.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Verification Form / Result */}
          <div className="mail-drafter-box" style={{ justifyContent: 'center' }}>
            {!result ? (
              <>
                <h4>Enter Certificate Details</h4>
                <p className="mail-drafter-subtitle">
                  Verify certificate validity and view registered course role.
                </p>

                <form className="mail-form" onSubmit={handleVerify}>
                  <div className="form-group">
                    <label htmlFor="verify-student-id-input">Student ID</label>
                    <input
                      id="verify-student-id-input"
                      type="text"
                      placeholder="e.g. STU-1001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="verify-student-name-input">Student Full Name</label>
                    <input
                      id="verify-student-name-input"
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '13px',
                        lineHeight: '1.4',
                      }}
                      role="alert"
                    >
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="mail-form-actions">
                    <button
                      type="submit"
                      className="btn solid btn-draft"
                      disabled={loading}
                    >
                      {loading ? 'Verifying with Portal...' : 'Verify Certificate'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>✅</span> {result.message}
                </div>

                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--mute)', fontSize: '12px', display: 'block' }}>STUDENT NAME</span>
                    <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{result.name}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--mute)', fontSize: '12px', display: 'block' }}>STUDENT ID</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.student_id}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--mute)', fontSize: '12px', display: 'block' }}>INTERNSHIP / COURSE ROLE</span>
                    <strong>{result.course_name}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--mute)', fontSize: '12px', display: 'block' }}>STATUS</span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#10b981',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {result.status}
                      </span>
                    </div>

                    {result.certificate_id && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--mute)', fontSize: '12px', display: 'block' }}>CERTIFICATE ID</span>
                        <code style={{ fontSize: '11px', color: 'var(--brand)' }}>{result.certificate_id}</code>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn"
                  onClick={handleReset}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Verify Another Certificate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
