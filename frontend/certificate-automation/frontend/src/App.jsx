import { useState, useEffect, useRef } from "react";
import "./App.css";

// -------------------------------------------------------------------
// Hardcoded Demo Credentials (Temporary before AWS Cognito setup)
// -------------------------------------------------------------------
const HARDCODED_USERS = {
  management: [
    {
      username: "admin@synergies.com",
      password: "admin123",
      name: "Management Admin",
      role: "management",
    },
    {
      username: "admin",
      password: "admin123",
      name: "Management Admin",
      role: "management",
    },
  ],
  student: [
    {
      username: "STU-1001",
      password: "student123",
      name: "Jane Doe",
      role: "student",
    },
    {
      username: "student@synergies.com",
      password: "student123",
      name: "Jane Doe",
      role: "student",
    },
  ],
};

const REQUIRED_COLUMNS = [
  { key: "student_id", label: "Student ID", example: "STU-1001" },
  { key: "student_name", label: "Student Name", example: "Jane Doe" },
  { key: "email", label: "Email Address", example: "jane.doe@example.com" },
  { key: "internship_role", label: "Internship Role", example: "AI / GenAI Intern" },
];

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("synergies_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginRole, setLoginRole] = useState("management");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Portal Navigation
  const [managementTab, setManagementTab] = useState("upload");

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState("checking");

  // Excel Upload State
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvPreview, setCsvPreview] = useState(null);

  // Certificate Verification Form State
  const [verifyStudentId, setVerifyStudentId] = useState("");
  const [verifyStudentName, setVerifyStudentName] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Post Internship Form State (DynamoDB: INTERN_LIST)
  const [internId, setInternId] = useState("");
  const [internTitle, setInternTitle] = useState("");
  const [internLocation, setInternLocation] = useState("remote");
  const [internExperience, setInternExperience] = useState("Fresher");
  const [internEmploymentType, setInternEmploymentType] = useState("Intern");
  const [internImage, setInternImage] = useState("");
  const [isPostingIntern, setIsPostingIntern] = useState(false);
  const [internPostError, setInternPostError] = useState("");
  const [internPostResult, setInternPostResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (response.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    }
    checkBackend();
  }, []);

  // -------------------------------------------------------------
  // Authentication Handlers
  // -------------------------------------------------------------
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = usernameInput.trim().toLowerCase();
    const roleUsers = HARDCODED_USERS[loginRole] || [];

    const matchedUser = roleUsers.find(
      (u) =>
        u.username.toLowerCase() === trimmedUser &&
        u.password === passwordInput.trim()
    );

    if (matchedUser) {
      setUser(matchedUser);
      sessionStorage.setItem("synergies_auth_user", JSON.stringify(matchedUser));
      setUsernameInput("");
      setPasswordInput("");
    } else {
      setLoginError(
        `Invalid credentials for ${
          loginRole === "management" ? "Management" : "Student"
        }. Please check your username and password, or use the demo credentials.`
      );
    }
  };

  const handleQuickFill = (role) => {
    setLoginRole(role);
    setLoginError("");
    if (role === "management") {
      setUsernameInput("admin@synergies.com");
      setPasswordInput("admin123");
    } else {
      setUsernameInput("STU-1001");
      setPasswordInput("student123");
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("synergies_auth_user");
    setFile(null);
    setCsvPreview(null);
    setErrorMessage("");
    setSuccessMessage("");
    setVerifyResult(null);
  };

  // -------------------------------------------------------------
  // File Upload Handlers
  // -------------------------------------------------------------
  const validateAndSetFile = (selectedFile) => {
    setErrorMessage("");
    setSuccessMessage("");
    setCsvPreview(null);

    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isExcelOrCsv =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv");

    if (!isExcelOrCsv) {
      setErrorMessage(
        "Invalid file format. Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file."
      );
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds maximum allowed size of 10 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (fileName.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          if (lines.length > 0) {
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().replace(/^["']|["']$/g, ""));

            const normalizedHeaders = headers.map((h) =>
              h.toLowerCase().replace(/[\s-]/g, "_")
            );

            const requiredAliases = {
              student_id: ["student_id", "studentid", "id"],
              student_name: ["student_name", "studentname", "name", "full_name"],
              email: ["email", "email_id", "email_address"],
              internship_role: ["internship_role", "intern_role", "role", "course", "course_name"],
            };

            const missing = Object.keys(requiredAliases).filter(
              (key) =>
                !requiredAliases[key].some((alias) =>
                  normalizedHeaders.includes(alias)
                )
            );

            if (missing.length > 0) {
              setErrorMessage(
                `Validation Failed: The uploaded CSV sheet is missing required intern parameter(s): [${missing.join(
                  ", "
                )}]. Please enter a valid excel sheet containing: student_id, student_name, email, and internship_role.`
              );
              setFile(null);
              return;
            }

            const rows = lines.slice(1, 6).map((line) =>
              line.split(",").map((cell) => cell.trim().replace(/^["']|["']$/g, ""))
            );
            setCsvPreview({
              headers,
              rows,
              totalRecords: Math.max(0, lines.length - 1),
            });
          }
        } catch {
          // Gracefully ignore CSV parsing errors for preview
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvPreview(null);
    setErrorMessage("");
    setSuccessMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "student_id,student_name,email,internship_role\n" +
      "STU-1001,Jane Doe,jane.doe@example.com,AI / GenAI Intern\n" +
      "STU-1002,Alex Smith,alex.smith@example.com,FastAPI Backend Intern\n" +
      "STU-1003,Priya Patel,priya.patel@example.com,React Frontend Intern\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "certificate_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setUploadProgress(25);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(50);
      const response = await fetch("http://localhost:8000/certificates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Validation Failed: Please enter a valid excel sheet.");
      }

      setUploadProgress(100);
      setSuccessMessage(
        `${data.message} (${data.row_count} records validated successfully).`
      );
    } catch (err) {
      setErrorMessage(err.message || "Failed to connect to backend server.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // -------------------------------------------------------------
  // Certificate Validation Form Handler
  // -------------------------------------------------------------
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyResult(null);
    setIsVerifying(true);

    try {
      const response = await fetch("http://localhost:8000/certificates/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: verifyStudentId.trim(),
          name: verifyStudentName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Student record not found in portal.");
      }

      setVerifyResult(data);
    } catch (err) {
      setVerifyError(err.message || "Verification request failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  // -------------------------------------------------------------
  // Post Internship Form Handler (DynamoDB: INTERN_LIST)
  // -------------------------------------------------------------
  const handlePostInternSubmit = async (e) => {
    e.preventDefault();
    setInternPostError("");
    setInternPostResult(null);
    setIsPostingIntern(true);

    try {
      const response = await fetch("http://localhost:8000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intern_id: internId.trim(),
          title: internTitle.trim(),
          location: internLocation.trim(),
          experience_level: internExperience.trim(),
          employment_type: internEmploymentType.trim(),
          image: internImage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to post internship.");
      }

      setInternPostResult(data);
      setInternId("");
      setInternTitle("");
      setInternImage("");
    } catch (err) {
      setInternPostError(err.message || "Failed to connect to backend server.");
    } finally {
      setIsPostingIntern(false);
    }
  };

  const getFileExtension = (name) => {
    const ext = name.split(".").pop().toUpperCase();
    return ext || "FILE";
  };

  // =============================================================
  // 1. LOGIN PAGE VIEW (When user is not authenticated)
  // =============================================================
  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          {/* Logo identical to main frontend */}
          <div className="login-header">
            <svg width="56" height="42" viewBox="0 0 84 64" aria-hidden="true">
              <path
                d="M20 58h44a14 14 0 0 0 2-28 20 20 0 0 0-38-6A17 17 0 0 0 20 58z"
                fill="none"
                stroke="#00aeef"
                strokeWidth="6"
              />
              <circle cx="30" cy="30" r="4" fill="#777" />
              <circle cx="42" cy="27" r="4" fill="#777" />
              <circle cx="54" cy="30" r="4" fill="#777" />
              <rect x="26" y="36" width="8" height="22" fill="#00aeef" />
              <rect x="38" y="33" width="8" height="25" fill="#00aeef" />
              <rect x="50" y="36" width="8" height="22" fill="#00aeef" />
            </svg>
            <h1 className="login-title">Synergy Cloud AI</h1>
            <p className="login-subtitle">
              Certificate Automation &amp; Verification Portal
            </p>
          </div>

          {/* Role Segmented Selector: Management vs Student */}
          <div className="role-segmented-control" role="tablist">
            <button
              type="button"
              id="role-tab-management"
              role="tab"
              aria-selected={loginRole === "management"}
              className={`role-tab-btn ${
                loginRole === "management" ? "active" : ""
              }`}
              onClick={() => {
                setLoginRole("management");
                setLoginError("");
              }}
            >
              <span>👔</span> Management
            </button>
            <button
              type="button"
              id="role-tab-student"
              role="tab"
              aria-selected={loginRole === "student"}
              className={`role-tab-btn ${
                loginRole === "student" ? "active" : ""
              }`}
              onClick={() => {
                setLoginRole("student");
                setLoginError("");
              }}
            >
              <span>🎓</span> Student
            </button>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username-input">
                {loginRole === "management"
                  ? "Management Email / Username"
                  : "Student ID or Email"}
              </label>
              <input
                id="login-username-input"
                type="text"
                className="form-input"
                required
                placeholder={
                  loginRole === "management"
                    ? "admin@synergies.com"
                    : "STU-1001"
                }
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password-input">
                Password
              </label>
              <input
                id="login-password-input"
                type="password"
                className="form-input"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            {loginError && (
              <div className="alert alert-error" role="alert">
                <span>⚠️</span> {loginError}
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              className="btn-submit-login"
            >
              Sign In as {loginRole === "management" ? "Management" : "Student"}
            </button>
          </form>

          {/* Quick-fill Demo Credentials Card */}
          <div className="demo-credentials-box">
            <div className="demo-title">
              <span>Demo Credentials</span>
              <button
                type="button"
                className="btn-quick-fill"
                onClick={() => handleQuickFill(loginRole)}
              >
                Auto-Fill {loginRole === "management" ? "Management" : "Student"}
              </button>
            </div>
            <div className="demo-row">
              <strong>Management:</strong> <code>admin@synergies.com</code> /{" "}
              <code>admin123</code>
            </div>
            <div className="demo-row">
              <strong>Student:</strong> <code>STU-1001</code> /{" "}
              <code>student123</code>
            </div>
          </div>

          {/* Cognito Notice */}
          <div className="cognito-notice">
            <span>🔐</span> Note: Currently using development authentication.
            AWS Cognito user pool will be configured in production.
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // 2. MANAGEMENT PORTAL VIEW (Main Bar + Excel Upload / Tools)
  // =============================================================
  if (user.role === "management") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        {/* Management Portal Main Bar */}
        <header className="portal-main-bar" id="management-main-bar">
          <div className="portal-brand">
            <a href="#portal" className="portal-brand-logo">
              <svg
                width="34"
                height="26"
                viewBox="0 0 84 64"
                aria-hidden="true"
              >
                <path
                  d="M20 58h44a14 14 0 0 0 2-28 20 20 0 0 0-38-6A17 17 0 0 0 20 58z"
                  fill="none"
                  stroke="#00aeef"
                  strokeWidth="6"
                />
                <circle cx="30" cy="30" r="4" fill="#777" />
                <circle cx="42" cy="27" r="4" fill="#777" />
                <circle cx="54" cy="30" r="4" fill="#777" />
                <rect x="26" y="36" width="8" height="22" fill="#00aeef" />
                <rect x="38" y="33" width="8" height="25" fill="#00aeef" />
                <rect x="50" y="36" width="8" height="22" fill="#00aeef" />
              </svg>
              <span>
                Synergy Cloud<small>AI SOLUTIONS</small>
              </span>
            </a>
            <span className="portal-badge" id="management-badge">
              Management Portal
            </span>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="portal-nav-tabs" aria-label="Management Navigation">
            <button
              type="button"
              id="tab-excel-upload"
              className={`portal-nav-btn ${
                managementTab === "upload" ? "active" : ""
              }`}
              onClick={() => setManagementTab("upload")}
            >
              <span>📊</span> Excel Upload
            </button>
            <button
              type="button"
              id="tab-verify-cert"
              className={`portal-nav-btn ${
                managementTab === "verify" ? "active" : ""
              }`}
              onClick={() => setManagementTab("verify")}
            >
              <span>🔍</span> Verify Certificate
            </button>
            <button
              type="button"
              id="tab-post-internship"
              className={`portal-nav-btn ${
                managementTab === "internships" ? "active" : ""
              }`}
              onClick={() => setManagementTab("internships")}
            >
              <span>💼</span> Post Internship
            </button>
            <button
              type="button"
              id="tab-system-health"
              className={`portal-nav-btn ${
                managementTab === "health" ? "active" : ""
              }`}
              onClick={() => setManagementTab("health")}
            >
              <span>⚡</span> System Status
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="portal-user-actions">
            <span className="backend-status" id="backend-status-badge">
              <span
                className={`status-dot ${
                  backendStatus === "online"
                    ? "online"
                    : backendStatus === "offline"
                    ? "offline"
                    : ""
                }`}
              />
              Backend: {backendStatus}
            </span>
            <span className="user-pill" id="current-user-pill">
              <span>👤</span> {user.name}
            </span>
            <button
              type="button"
              id="btn-signout"
              className="btn-signout"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Tab 1: Excel Upload Workflow */}
        {managementTab === "upload" && (
          <main className="excel-upload-page">
            <header className="page-header">
              <h1 className="page-title" id="page-title">
                Bulk Certificate Registration
              </h1>
              <p className="page-description" id="page-description">
                Upload student records in Excel format (.xlsx, .xls) or CSV to
                automate batch certificate registration.
              </p>
            </header>

            {/* Expected Format Requirements Card */}
            <section className="format-card" aria-label="Format requirements">
              <div className="format-card-header">
                <span className="format-card-title">
                  <span>📋</span> Required Parameters for Interns
                </span>
                <button
                  type="button"
                  id="download-template-btn"
                  className="btn-template"
                  onClick={handleDownloadTemplate}
                >
                  <span>📥</span> Download Excel Template
                </button>
              </div>
              <div className="columns-list">
                {REQUIRED_COLUMNS.map((col) => (
                  <div key={col.key} className="col-pill">
                    <code>{col.key}</code>
                    <span className="req">*Required</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Drag & Drop Zone */}
            <div
              id="excel-dropzone"
              className={`dropzone ${isDragOver ? "drag-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="excel-file-input"
                className="file-input-hidden"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleFileInputChange}
              />
              <div className="dropzone-icon" aria-hidden="true">
                📊
              </div>
              <div className="dropzone-text">
                <span className="dropzone-primary-text">
                  Drag &amp; drop your Excel file here, or{" "}
                  <span className="browse-link">browse files</span>
                </span>
                <span className="dropzone-subtext">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV files up to 10 MB
                </span>
              </div>
              <div className="format-tags">
                <span className="format-tag">.XLSX</span>
                <span className="format-tag">.XLS</span>
                <span className="format-tag">.CSV</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                className="alert alert-error"
                id="upload-error-alert"
                role="alert"
              >
                <span>⚠️</span> {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                className="alert alert-success"
                id="upload-success-alert"
                role="status"
              >
                <span>✅</span> {successMessage}
              </div>
            )}

            {/* Selected File Details */}
            {file && (
              <section
                className="selected-file-card"
                id="selected-file-card"
                aria-label="Selected file"
              >
                <div className="file-meta">
                  <div className="file-format-badge">
                    {getFileExtension(file.name)}
                  </div>
                  <div className="file-info">
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-size">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="remove-file-btn"
                  className="btn-remove-file"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  Remove File
                </button>
              </section>
            )}

            {/* CSV Data Preview */}
            {csvPreview && (
              <section
                className="preview-section"
                id="csv-preview-section"
                aria-label="Data preview"
              >
                <div className="preview-header">
                  <span>Data Preview (First 5 Rows)</span>
                  <span className="preview-count">
                    Total detected records: {csvPreview.totalRecords}
                  </span>
                </div>
                <div className="table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {csvPreview.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Upload Action Button & Progress */}
            {file && (
              <section className="action-panel">
                {isUploading && (
                  <div
                    className="progress-container"
                    id="upload-progress-container"
                  >
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="progress-text">
                      <span>Uploading and validating Excel parameters...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  id="submit-excel-upload-btn"
                  className="btn-upload"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <span>📤</span> Upload &amp; Validate Excel Sheet
                    </>
                  )}
                </button>
              </section>
            )}
          </main>
        )}

        {/* Tab 2: Certificate Validation View */}
        {managementTab === "verify" && (
          <div className="subview-card" id="verify-subview">
            <h2>Verify Student Certificate</h2>
            <p className="page-description">
              Search and validate registered certificate records directly from
              the portal database.
            </p>
            <form onSubmit={handleVerifySubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="verify-student-id">
                  Student ID
                </label>
                <input
                  id="verify-student-id"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. STU-1001"
                  value={verifyStudentId}
                  onChange={(e) => setVerifyStudentId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="verify-student-name">
                  Student Name
                </label>
                <input
                  id="verify-student-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Jane Doe"
                  value={verifyStudentName}
                  onChange={(e) => setVerifyStudentName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-upload"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Check Certificate Status"}
              </button>
            </form>

            {verifyError && (
              <div className="alert alert-error">
                <span>⚠️</span> {verifyError}
              </div>
            )}

            {verifyResult && (
              <div className="verify-result-card">
                <h3>{verifyResult.message}</h3>
                <div className="verify-field">
                  <strong>Student ID:</strong> {verifyResult.student_id}
                </div>
                <div className="verify-field">
                  <strong>Student Name:</strong> {verifyResult.name}
                </div>
                <div className="verify-field">
                  <strong>Internship Role:</strong> {verifyResult.course_name}
                </div>
                <div className="verify-field">
                  <strong>Status:</strong> {verifyResult.status}
                </div>
                <div className="verify-field">
                  <strong>Certificate ID:</strong> {verifyResult.certificate_id}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Post Internship View */}
        {managementTab === "internships" && (
          <div className="subview-card" id="internships-subview">
            <h2>Post New Internship</h2>
            <p className="page-description">
              Publish a new internship role directly to the DynamoDB{" "}
              <code>INTERN_LIST</code> table.
            </p>
            <form onSubmit={handlePostInternSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="intern-id-input">
                  Intern ID (Primary Key)
                </label>
                <input
                  id="intern-id-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. INTERN_003"
                  value={internId}
                  onChange={(e) => setInternId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="intern-title-input">
                  Title
                </label>
                <input
                  id="intern-title-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. GEN AI DEVELOPER"
                  value={internTitle}
                  onChange={(e) => setInternTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="intern-location-input">
                  Location
                </label>
                <select
                  id="intern-location-input"
                  className="form-input"
                  required
                  value={internLocation}
                  onChange={(e) => setInternLocation(e.target.value)}
                >
                  <option value="remote">remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="intern-experience-input">
                  Experience Level
                </label>
                <input
                  id="intern-experience-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Fresher"
                  value={internExperience}
                  onChange={(e) => setInternExperience(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="intern-employment-input">
                  Employment Type
                </label>
                <input
                  id="intern-employment-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Intern"
                  value={internEmploymentType}
                  onChange={(e) => setInternEmploymentType(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="intern-image-input">
                  Image Path / URL
                </label>
                <input
                  id="intern-image-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. /genai.jpg or https://..."
                  value={internImage}
                  onChange={(e) => setInternImage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                id="btn-post-internship"
                className="btn-upload"
                disabled={isPostingIntern}
              >
                {isPostingIntern ? "Posting..." : "Post Internship to DynamoDB"}
              </button>
            </form>

            {internPostError && (
              <div className="alert alert-error" role="alert">
                <span>⚠️</span> {internPostError}
              </div>
            )}

            {internPostResult && (
              <div className="verify-result-card">
                <h3>✅ {internPostResult.message}</h3>
                <div className="verify-field">
                  <strong>Intern ID:</strong> {internPostResult.intern.intern_id}
                </div>
                <div className="verify-field">
                  <strong>Title:</strong> {internPostResult.intern.title}
                </div>
                <div className="verify-field">
                  <strong>Location:</strong> {internPostResult.intern.location}
                </div>
                <div className="verify-field">
                  <strong>Experience Level:</strong>{" "}
                  {internPostResult.intern.experience_level}
                </div>
                <div className="verify-field">
                  <strong>Employment Type:</strong>{" "}
                  {internPostResult.intern.employment_type}
                </div>
                <div className="verify-field">
                  <strong>Image:</strong>{" "}
                  {internPostResult.intern.image || "(none)"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: System Health View */}
        {managementTab === "health" && (
          <div className="subview-card" id="health-subview">
            <h2>Backend System Status</h2>
            <p className="page-description">
              Health check monitoring for Synergy Cloud API.
            </p>
            <div className="verify-result-card">
              <div className="verify-field">
                <strong>API Server:</strong> http://localhost:8000
              </div>
              <div className="verify-field">
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: backendStatus === "online" ? "#10b981" : "#ef4444",
                    fontWeight: 700,
                  }}
                >
                  {backendStatus.toUpperCase()}
                </span>
              </div>
              <div className="verify-field">
                <strong>DynamoDB Table:</strong> certificate-jobs-dev
              </div>
              <div className="verify-field">
                <strong>AWS Region:</strong> ap-south-2
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================================================
  // 3. STUDENT PORTAL VIEW
  // =============================================================
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Student Portal Main Bar */}
      <header className="portal-main-bar" id="student-main-bar">
        <div className="portal-brand">
          <a href="#portal" className="portal-brand-logo">
            <svg
              width="34"
              height="26"
              viewBox="0 0 84 64"
              aria-hidden="true"
            >
              <path
                d="M20 58h44a14 14 0 0 0 2-28 20 20 0 0 0-38-6A17 17 0 0 0 20 58z"
                fill="none"
                stroke="#00aeef"
                strokeWidth="6"
              />
              <circle cx="30" cy="30" r="4" fill="#777" />
              <circle cx="42" cy="27" r="4" fill="#777" />
              <circle cx="54" cy="30" r="4" fill="#777" />
              <rect x="26" y="36" width="8" height="22" fill="#00aeef" />
              <rect x="38" y="33" width="8" height="25" fill="#00aeef" />
              <rect x="50" y="36" width="8" height="22" fill="#00aeef" />
            </svg>
            <span>
              Synergy Cloud<small>AI SOLUTIONS</small>
            </span>
          </a>
          <span className="portal-badge student" id="student-badge">
            Student Portal
          </span>
        </div>

        <div className="portal-user-actions">
          <span className="user-pill" id="student-user-pill">
            <span>🎓</span> {user.name} ({user.username})
          </span>
          <button
            type="button"
            id="btn-signout"
            className="btn-signout"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Student Portal Body */}
      <main className="excel-upload-page">
        <header className="page-header">
          <h1 className="page-title">Welcome, {user.name}</h1>
          <p className="page-description">
            View your certificate status and verify your internship certificate
            credentials.
          </p>
        </header>

        <section className="format-card">
          <span className="format-card-title">
            <span>🎓</span> Your Student Profile
          </span>
          <div className="columns-list">
            <div className="col-pill">
              <code>ID: {user.username}</code>
            </div>
            <div className="col-pill">
              <code>Role: Student Intern</code>
            </div>
          </div>
        </section>

        {/* Certificate Verification for Student */}
        <section className="subview-card" style={{ margin: 0, maxWidth: "100%" }}>
          <h3>Verify Your Certificate</h3>
          <p className="page-description">
            Enter your student details to confirm and view your certificate
            status.
          </p>
          <form onSubmit={handleVerifySubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="student-verify-id">
                Student ID
              </label>
              <input
                id="student-verify-id"
                type="text"
                className="form-input"
                required
                value={verifyStudentId}
                onChange={(e) => setVerifyStudentId(e.target.value)}
                placeholder="e.g. STU-1001"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="student-verify-name">
                Full Name
              </label>
              <input
                id="student-verify-name"
                type="text"
                className="form-input"
                required
                value={verifyStudentName}
                onChange={(e) => setVerifyStudentName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <button
              type="submit"
              className="btn-upload"
              disabled={isVerifying}
            >
              {isVerifying ? "Checking..." : "Verify Certificate"}
            </button>
          </form>

          {verifyError && (
            <div className="alert alert-error">
              <span>⚠️</span> {verifyError}
            </div>
          )}

          {verifyResult && (
            <div className="verify-result-card">
              <h3>{verifyResult.message}</h3>
              <div className="verify-field">
                <strong>Student ID:</strong> {verifyResult.student_id}
              </div>
              <div className="verify-field">
                <strong>Name:</strong> {verifyResult.name}
              </div>
              <div className="verify-field">
                <strong>Course / Role:</strong> {verifyResult.course_name}
              </div>
              <div className="verify-field">
                <strong>Status:</strong> {verifyResult.status}
              </div>
              <div className="verify-field">
                <strong>Certificate ID:</strong> {verifyResult.certificate_id}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
