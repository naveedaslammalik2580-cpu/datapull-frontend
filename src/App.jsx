import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const platforms = [
  { id: "youtube", label: "YouTube Channels", icon: "▶" },
  { id: "google", label: "Google Businesses", icon: "◈" },
];

function isEmpty(val) {
  return val === null || val === undefined || val === "" || val === "—";
}

const COL_LABELS = {
  video_count: "VIDEOS",
  email:       "EMAIL",
};

function colLabel(key) {
  return COL_LABELS[key] || key;
}

export default function App() {
  const [platform, setPlatform] = useState("youtube");
  const [dateFrom, setDateFrom] = useState("");
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [location, setLocation] = useState("Pakistan");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [emailOnly, setEmailOnly] = useState(false);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [strugglingOnly, setStrugglingOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") !== "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function switchPlatform(id) {
    setPlatform(id);
    setResults([]);
    setSearched(false);
    setError("");
    setEmailOnly(false);
    setNoWebsiteOnly(false);
    setStrugglingOnly(false);
  }

  async function handleSearch() {
    if (!dateFrom) {
      setError("Please select a start date.");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(true);
    try {
      const url =
        platform === "youtube"
          ? `${API_URL}/youtube/search?date_from=${dateFrom}&q=${encodeURIComponent(keyword)}${region ? `&region=${region}` : ""}${strugglingOnly ? "&struggling_only=true" : ""}`
          : `${API_URL}/google/search?date_from=${dateFrom}&location=${encodeURIComponent(location)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");
      setResults(data.results || []);
    } catch (e) {
      setError("Could not connect to the server. Check that the backend is running.");
      setResults([]);
    }
    setLoading(false);
  }

  function exportCSV() {
    if (!results.length) return;
    const headers = Object.keys(results[0]).join(",");
    const rows = results.map((r) =>
      Object.values(r)
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}_results.csv`;
    a.click();
  }

  const filteredResults = results.filter((row) => {
    if (platform === "youtube" && emailOnly && isEmpty(row.email)) return false;
    if (platform === "google" && noWebsiteOnly && !isEmpty(row.website)) return false;
    return true;
  });

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <div className="logo">
            <span className="logo-mark">⬡</span>
            <span className="logo-text">DataPull</span>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
          >
            {darkMode ? "☀" : "🌙"}
          </button>
        </div>
        <p className="tagline">New businesses & channels — extracted instantly</p>
      </header>

      <main>
        <section className="control-panel">
          <div className="platform-toggle">
            {platforms.map((p) => (
              <button
                key={p.id}
                className={`platform-btn ${platform === p.id ? "active" : ""}`}
                onClick={() => switchPlatform(p.id)}
              >
                <span className="platform-icon">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="filter-divider">→</div>
            {platform === "youtube" ? (
              <>
                <div className="filter-group">
                  <label>Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. tech"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div className="filter-divider">→</div>
                <div className="filter-group">
                  <label>Country</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">Worldwide</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="filter-divider">→</div>
                <div className="filter-group">
                  <label>&nbsp;</label>
                  <label className="toggle-filter" style={{ marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      checked={strugglingOnly}
                      onChange={(e) => setStrugglingOnly(e.target.checked)}
                    />
                    <span>Struggling Channels (videos but low subscribers)</span>
                  </label>
                </div>
              </>
            ) : (
              <div className="filter-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. US, Pakistan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner">Fetching data...</span>
            ) : (
              <>Extract Data</>
            )}
          </button>
        </section>

        {searched && !loading && (
          <section className="results-section">
            <div className="results-header">
              <h2>
                {filteredResults.length > 0
                  ? `${filteredResults.length} results found`
                  : "No results found"}
              </h2>
              <div className="results-actions">
                {platform === "youtube" && results.length > 0 && (
                  <label className="toggle-filter">
                    <input
                      type="checkbox"
                      checked={emailOnly}
                      onChange={(e) => setEmailOnly(e.target.checked)}
                    />
                    <span>Channels with email only</span>
                  </label>
                )}
                {platform === "google" && results.length > 0 && (
                  <label className="toggle-filter">
                    <input
                      type="checkbox"
                      checked={noWebsiteOnly}
                      onChange={(e) => setNoWebsiteOnly(e.target.checked)}
                    />
                    <span>No website only</span>
                  </label>
                )}
                {results.length > 0 && (
                  <button className="export-btn" onClick={exportCSV}>
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {filteredResults.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(filteredResults[0]).map((key) => (
                        <th key={key}>{colLabel(key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(row).map((key, j) => (
                          <td key={j}>
                            {platform === "youtube" && key === "name" && row.channel_url ? (
                              <a
                                href={row.channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="channel-link"
                              >
                                {row[key] || "—"}
                              </a>
                            ) : platform === "google" && key === "email" ? (
                              row.email ? (
                                row.email
                              ) : !row.website ? (
                                <span className="social-links">
                                  <a
                                    href={`https://www.facebook.com/search/top?q=${encodeURIComponent(row.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-btn social-fb"
                                  >🔵 Facebook</a>
                                  <a
                                    href={`https://www.instagram.com/explore/search/?q=${encodeURIComponent(row.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-btn social-ig"
                                  >📷 Instagram</a>
                                </span>
                              ) : "—"
                            ) : (
                              row[key] || "—"
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
