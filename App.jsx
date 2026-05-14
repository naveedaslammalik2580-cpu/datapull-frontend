import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const platforms = [
  { id: "youtube", label: "YouTube Channels", icon: "▶" },
  { id: "google", label: "Google Businesses", icon: "◈" },
];

export default function App() {
  const [platform, setPlatform] = useState("youtube");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!dateFrom || !dateTo) {
      setError("Date from aur date to dono daalo.");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/${platform}/search?date_from=${dateFrom}&date_to=${dateTo}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setError("Server se connection nahi hua. Backend check karo.");
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

  return (
    <div className="app">
      <header>
        <div className="logo">
          <span className="logo-mark">⬡</span>
          <span className="logo-text">DataPull</span>
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
                onClick={() => setPlatform(p.id)}
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
            <div className="filter-group">
              <label>Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
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
                {results.length > 0
                  ? `${results.length} results mile`
                  : "Koi result nahi mila"}
              </h2>
              {results.length > 0 && (
                <button className="export-btn" onClick={exportCSV}>
                  CSV Export
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(results[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{val || "—"}</td>
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
