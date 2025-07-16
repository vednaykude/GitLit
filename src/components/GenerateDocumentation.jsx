import React, { useState, useEffect } from 'react';

const GenerateDocumentation = ({ repoUrl, selectedBranch, onDocumentationGenerated, onLoadingChange }) => {
  const [generateUsageLoading, setGenerateUsageLoading] = useState(false);
  const [generateChangelogLoading, setGenerateChangelogLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastGenerated, setLastGenerated] = useState(null);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      if (generateUsageLoading || generateChangelogLoading) {
        onLoadingChange(true);
      } else {
        onLoadingChange(false);
      }
    }
  }, [generateUsageLoading, generateChangelogLoading, onLoadingChange]);

  const handleGenerateUsageGuide = async () => {
    if (!repoUrl || !selectedBranch) {
      setError('Please enter a repository URL and select a branch first');
      return;
    }

    setGenerateUsageLoading(true);
    setError('');

    try {
      setLastGenerated(null);
      const response = await fetch(
        `http://localhost:8000/api/usage-guide?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(selectedBranch)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate usage guide');
      }

      const data = await response.json();
      onDocumentationGenerated(data, 'usage-guide');
      setLastGenerated({ type: 'Usage Guide', time: new Date() });

    } catch (err) {
      setError(err.message);
    } finally {
      setGenerateUsageLoading(false);
    }
  };

  const handleGenerateEvolutionSummary = async () => {
    if (!repoUrl || !selectedBranch) {
      setError('Please enter a repository URL and select a branch first');
      return;
    }

    setGenerateChangelogLoading(true);
    setError('');

    try {
      setLastGenerated(null);
      const response = await fetch(
        `http://localhost:8000/api/evolution-summary?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(selectedBranch)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate evolution summary');
      }

      const data = await response.json();
      onDocumentationGenerated(data, 'evolution-summary');
      setLastGenerated({ type: 'Evolution Summary', time: new Date() });

    } catch (err) {
      setError(err.message);
    } finally {
      setGenerateChangelogLoading(false);
    }
  };

  const isReady = repoUrl && selectedBranch;

  return (
    <div className="card h-full">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
              <path d="M6 8h8M6 10h8M6 12h5" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
              Step 3: Generate Documentation
            </h3>
            <p className="text-sm text-gray-500">Create AI-powered documentation</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="space-y-4">
          {error && (
            <div className="error-state">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {lastGenerated && (
            <div className="success-state">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {lastGenerated.type} generated at {lastGenerated.time.toLocaleTimeString()}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleGenerateUsageGuide}
              disabled={generateUsageLoading || generateChangelogLoading || !isReady}
              className="btn-primary w-full relative"
            >
              {generateUsageLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white absolute left-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
                {generateUsageLoading ? "Generating..." : "Generate Usage Guide"}
              </div>
            </button>
            
            <button
              onClick={handleGenerateEvolutionSummary}
              disabled={generateUsageLoading || generateChangelogLoading || !isReady}
              className="btn-primary w-full relative"
            >
              {generateChangelogLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white absolute left-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {generateChangelogLoading ? "Generating..." : "Generate Changelog Summary"}
              </div>
            </button>
          </div>
          
          {!isReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-800">
                  Complete Steps 1 & 2 to enable documentation generation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateDocumentation;