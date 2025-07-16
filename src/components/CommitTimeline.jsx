import React, { useEffect, useState } from "react";

const TimelineButton = ({ onClick, disabled }) => (
  <button
    className={`fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition group ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    title={disabled ? "Generate Evolution Summary to enable timeline" : "Open Interactive Timeline"}
    onClick={() => {
      if (!disabled) onClick();
    }}
    aria-label="Open Interactive Timeline"
    disabled={disabled}
  >
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
    <span className="absolute left-16 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded px-2 py-1 ml-2 transition-opacity pointer-events-none whitespace-nowrap">
      {disabled ? "Generate Evolution Summary" : "Open Interactive Timeline"}
    </span>
  </button>
);

const EvolutionTimeline = ({ repoUrl, branch, onClose }) => {
  const [eras, setEras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEra, setSelectedEra] = useState(null);

  useEffect(() => {
    if (!repoUrl || !branch) return;
    setLoading(true);
    setError("");
    fetch(
      `http://localhost:8000/api/evolution-timeline?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(branch)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to generate evolution timeline");
        return res.json();
      })
      .then((data) => setEras(data.eras || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repoUrl, branch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <button
          className="absolute top-8 right-12 text-gray-300 hover:text-white bg-white/10 rounded-full shadow-lg p-2 z-50 border border-gray-400"
          onClick={onClose}
          aria-label="Close Timeline"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-4xl font-extrabold mb-12 text-center text-white drop-shadow-lg tracking-wide">Code Evolution Timeline</h2>
        {loading ? (
          <div className="text-white text-lg animate-pulse">Loading timeline...</div>
        ) : error ? (
          <div className="text-red-300 text-lg">{error}</div>
        ) : eras.length === 0 ? (
          <div className="text-white text-lg">No timeline data found.</div>
        ) : (
          <div className="w-full px-16 flex items-center justify-center">
            <div className="relative w-full flex items-center min-h-[320px]" style={{ maxWidth: '90vw' }}>
              {/* Timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full z-0 shadow-lg" style={{ transform: 'translateY(-50%)' }}></div>
              {/* Timeline points and descriptions */}
              <div className="flex flex-row items-end w-full z-10 justify-between">
                {eras.map((era, idx) => (
                  <div key={idx} className="relative flex flex-col items-center" style={{ minWidth: '120px' }}>
                    {/* Era point clickable */}
                    <div className={`w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-200 ${selectedEra === era ? 'scale-110 ring-4 ring-purple-400' : 'hover:scale-110'}`}
                      onClick={() => setSelectedEra(era)}
                    >
                      <span className="text-white font-extrabold text-2xl drop-shadow-lg">{idx + 1}</span>
                    </div>
                    {/* Era title always visible */}
                    <div className="mt-3 bg-white/90 border border-blue-300 shadow-xl rounded-lg p-2 min-w-[120px] max-w-[180px] text-center text-xs text-blue-700 font-bold truncate">
                      {era.era_title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Era modal for full details */}
        {selectedEra && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-80">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full relative flex flex-col items-center border-2 border-blue-400">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-lg p-2"
                onClick={() => setSelectedEra(null)}
                aria-label="Close Era Details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-2xl font-bold text-blue-700 mb-4 text-center w-full">{selectedEra.era_title}</h3>
              <div className="mb-4 text-gray-700 whitespace-pre-line text-center w-full max-w-lg font-medium">{cleanFullSummary(selectedEra.summary)}</div>
              <div className="mb-2 text-xs text-gray-500">Commits: {selectedEra.commits.length}</div>
              <ul className="space-y-2 w-full max-h-[35vh] overflow-y-auto px-2">
                {selectedEra.commits.map((commit) => (
                  <li key={commit.sha} className="bg-gray-100 rounded p-2 text-xs flex flex-col gap-1 shadow">
                    <div><span className="font-bold">SHA:</span> {commit.sha.slice(0, 7)}</div>
                    <div><span className="font-bold">Author:</span> {commit.author}</div>
                    <div><span className="font-bold">Date:</span> {commit.date}</div>
                    <div><span className="font-bold">Message:</span> {cleanMessage(commit.message)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function cleanSummary(summary, maxLen = 80) {
  // Remove JSON wrapping and code block markers if present, and truncate
  try {
    let s = summary;
    if (s.startsWith('```json')) {
      s = s.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(s);
    s = parsed.summary || s;
    return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
  } catch {
    s = summary.replace(/^```json/, '').replace(/```$/, '').replace(/^[{\[]|[}\]]$/g, '').replace(/"/g, '').replace(/summary:/i, '').trim();
    return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
  }
}
function cleanMessage(msg) {
  return msg.length > 60 ? msg.slice(0, 60) + '...' : msg;
}
function cleanFullSummary(summary) {
  // Remove JSON wrapping and code block markers if present, but do NOT truncate
  try {
    let s = summary;
    if (s.startsWith('```json')) {
      s = s.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(s);
    return parsed.summary || s;
  } catch {
    return summary.replace(/^```json/, '').replace(/```$/, '').replace(/^[{\[]|[}\]]$/g, '').replace(/"/g, '').replace(/summary:/i, '').trim();
  }
}

export { TimelineButton, EvolutionTimeline };
