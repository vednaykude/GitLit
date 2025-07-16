import React, { useState, useEffect, useCallback } from 'react';

const Dashboard = ({ repoUrl, selectedBranch }) => {
  const [collaboratorData, setCollaboratorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCollaboratorAnalysis = useCallback(async () => {
    if (!repoUrl || !selectedBranch) {
      setError('Please select a repository and branch first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/collaborator-analysis?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(selectedBranch)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch collaborator analysis');
      }

      const data = await response.json();
      setCollaboratorData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [repoUrl, selectedBranch]);

  useEffect(() => {
    if (repoUrl && selectedBranch) {
      fetchCollaboratorAnalysis();
    }
  }, [repoUrl, selectedBranch, fetchCollaboratorAnalysis]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getContributionLevel = (commitCount, totalCommits) => {
    const percentage = (commitCount / totalCommits) * 100;
    if (percentage >= 50) return { level: 'Major', color: 'bg-green-500', textColor: 'text-green-800' };
    if (percentage >= 20) return { level: 'Significant', color: 'bg-blue-500', textColor: 'text-blue-800' };
    if (percentage >= 5) return { level: 'Regular', color: 'bg-yellow-500', textColor: 'text-yellow-800' };
    return { level: 'Minor', color: 'bg-gray-500', textColor: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="card-header">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--prudential-blue)' }}>
              Team Dashboard
            </h2>
            <p className="text-gray-600">Loading collaborator analysis...</p>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-center h-32">
              <div className="loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              <span className="ml-3 text-gray-600">Analyzing collaborators and contributions...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--prudential-blue)' }}>
              Team Dashboard
            </h2>
          </div>
          <div className="card-body">
            <div className="error-state">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchCollaboratorAnalysis}
                      className="btn-primary"
                    >
                      Retry Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!collaboratorData) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--prudential-blue)' }}>
              Team Dashboard
            </h2>
            <p className="text-gray-600">Select a repository and branch to view team analytics</p>
          </div>
          <div className="card-body">
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Team Analytics Ready</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Once you select a repository and branch, this dashboard will show detailed collaborator analysis including contributions, expertise areas, and team dynamics.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCommits = collaboratorData.collaborators.reduce((sum, collab) => sum + collab.commit_count, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold" style={{ color: 'var(--prudential-blue)' }}>
              {collaboratorData.total_collaborators}
            </div>
            <div className="text-sm text-gray-600">Total Contributors</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold" style={{ color: 'var(--prudential-orange)' }}>
              {totalCommits}
            </div>
            <div className="text-sm text-gray-600">Total Commits</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold" style={{ color: 'var(--prudential-green)' }}>
              {collaboratorData.collaborators.reduce((sum, collab) => sum + collab.lines_added, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Lines Added</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(collaboratorData.processing_time_seconds * 100) / 100}s
            </div>
            <div className="text-sm text-gray-600">Processing Time</div>
          </div>
        </div>
      </div>

      {/* Collaborators Grid */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
            Individual Contributors
          </h3>
          <div className="text-sm text-gray-500">
            Ordered by commit count
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {collaboratorData.collaborators.map((collaborator, index) => {
              const contribution = getContributionLevel(collaborator.commit_count, totalCommits);
              const contributionPercentage = Math.round((collaborator.commit_count / totalCommits) * 100);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Collaborator Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{collaborator.name}</h4>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${contribution.color} text-white`}>
                      {contribution.level}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold" style={{ color: 'var(--prudential-blue)' }}>
                        {collaborator.commit_count}
                      </div>
                      <div className="text-xs text-gray-600">Commits ({contributionPercentage}%)</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold" style={{ color: 'var(--prudential-green)' }}>
                        +{collaborator.lines_added.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Lines Added</div>
                    </div>
                  </div>

                  {/* Key Areas */}
                  {collaborator.key_areas && collaborator.key_areas.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Key Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {collaborator.key_areas.slice(0, 4).map((area, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Primary Languages:</div>
                    <div className="flex flex-wrap gap-1">
                      {collaborator.primary_languages.slice(0, 4).map((lang, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Functionality Summary */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Key Contributions:</div>
                    <p className="text-sm text-gray-600 leading-snug">{collaborator.functionality_summary}</p>
                  </div>

                  {/* Activity Timeline */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <div>
                        <span className="font-medium">First:</span> {formatDate(collaborator.first_commit_date)}
                      </div>
                      <div>
                        <span className="font-medium">Latest:</span> {formatDate(collaborator.last_commit_date)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Activity:</span> {collaborator.commit_frequency_per_week} commits/week
                    </div>
                  </div>

                  {/* Files Modified (truncated) */}
                  {collaborator.files_modified.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Modified Files ({collaborator.files_modified.length}):
                      </div>
                      <div className="text-xs text-gray-600">
                        {collaborator.files_modified.slice(0, 3).join(', ')}
                        {collaborator.files_modified.length > 3 && (
                          <span className="text-gray-400"> ...and {collaborator.files_modified.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Repository Info */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Repository Analysis</h4>
              <div className="text-sm text-gray-600">
                {collaboratorData.repository_url.split('/').slice(-2).join('/')} • {collaboratorData.branch} branch
              </div>
            </div>
            <button
              onClick={fetchCollaboratorAnalysis}
              className="btn-secondary"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
