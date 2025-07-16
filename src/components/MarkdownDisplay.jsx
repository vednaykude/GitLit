import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const MarkdownDisplay = ({ data, loading, error, title }) => {
  const [viewMode, setViewMode] = useState('rendered'); // 'rendered' or 'raw'
  const [showConfluenceModal, setShowConfluenceModal] = useState(false);
  const [confluenceTitle, setConfluenceTitle] = useState('');
  const [confluenceLoading, setConfluenceLoading] = useState(false);
  const [confluenceSuccess, setConfluenceSuccess] = useState(false);
  const [confluenceError, setConfluenceError] = useState('');

  const handleConfluenceExport = async () => {
    if (!confluenceTitle.trim()) {
      setConfluenceError('Please enter a title for the Confluence page');
      return;
    }

    setConfluenceLoading(true);
    setConfluenceError('');
    setConfluenceSuccess(false);

    try {
      const response = await fetch("http://localhost:8000/api/save-markdown-to-confluence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: confluenceTitle,
          markdown_content: data.markdown_content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save to Confluence");
      }

      await response.json();
      setConfluenceSuccess(true);
      setShowConfluenceModal(false);
      setConfluenceTitle('');
      
    } catch (err) {
      setConfluenceError(err.message);
    } finally {
      setConfluenceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="card-header">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
            {title}
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-32">
            <div className="loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            <span className="ml-3 text-gray-600">Generating documentation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-red-600">
            {title} - Error
          </h3>
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
                <h3 className="text-sm font-medium text-red-800">Documentation Generation Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data && !loading && !error) {
    return (
      <div className="card animate-slide-in">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
                Documentation Preview
              </h3>
              <p className="text-sm text-gray-500">Generated documentation will appear here</p>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to Generate Documentation</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete the steps above to create documentation for your repository. 
              Choose between a usage guide or evolution summary.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Check if data has the expected structure
  if (!data.markdown_content) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
            {title}
          </h3>
        </div>
        <div className="card-body">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800">No markdown content available</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-in">
      <div className="card-header">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
              {title}
            </h3>
            <div className="text-sm text-gray-500">
              Generated: {new Date(data.generated_at).toLocaleString()}
            </div>
          </div>
          
          {/* Confluence Export Button in Top Right */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setConfluenceTitle(title || 'Documentation');
                setShowConfluenceModal(true);
                setConfluenceError('');
                setConfluenceSuccess(false);
              }}
              className="btn-tertiary"
              title="Export to Confluence"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                Export to Confluence
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* View Mode Toggle */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setViewMode('rendered')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'rendered'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Rendered View
            </div>
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'raw'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Raw Markdown
            </div>
          </button>
        </div>

        {/* Content Display */}
        <div className="prose max-w-none">
          {viewMode === 'rendered' ? (
            <div className="markdown-content border-2 border-gray-100 rounded-lg p-6 bg-white overflow-auto max-h-96 shadow-inner">
              <ReactMarkdown>
                {data.markdown_content}
              </ReactMarkdown>
            </div>
          ) : (
            <div 
              className="border-2 border-gray-100 rounded-lg p-4 bg-gray-50 overflow-auto max-h-96 font-mono text-sm shadow-inner"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {data.markdown_content}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => navigator.clipboard.writeText(data.markdown_content)}
            className="btn-primary flex-1"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy to Clipboard
            </div>
          </button>
          
          <button
            onClick={() => {
              const blob = new Blob([data.markdown_content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${data.document_type}_${data.branch}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-tertiary flex-1"
          >
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download File
            </div>
          </button>
        </div>
      </div>
      
      {/* Confluence Export Modal */}
      {showConfluenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
                  Export to Confluence
                </h3>
                <button
                  onClick={() => setShowConfluenceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="confluenceTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    id="confluenceTitle"
                    value={confluenceTitle}
                    onChange={(e) => setConfluenceTitle(e.target.value)}
                    placeholder="Enter title for Confluence page"
                    className="input-field w-full"
                    disabled={confluenceLoading}
                  />
                </div>
                
                {confluenceError && (
                  <div className="error-state">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {confluenceError}
                    </div>
                  </div>
                )}
                
                {confluenceSuccess && (
                  <div className="success-state">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Successfully exported to Confluence!
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowConfluenceModal(false)}
                  className="btn-secondary flex-1"
                  disabled={confluenceLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfluenceExport}
                  disabled={confluenceLoading || !confluenceTitle.trim()}
                  className="btn-primary flex-1 relative"
                >
                  {confluenceLoading && (
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white absolute left-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {confluenceLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownDisplay;