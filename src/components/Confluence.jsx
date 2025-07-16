import React, { useState } from "react";

const Confluence = ({ documentationData }) => {
  const [website, setWebsite] = useState("https://confluence.company.com");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [savedPageUrl, setSavedPageUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!documentationData?.markdown_content) {
      setError("No documentation available to save. Please generate documentation first.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for the Confluence page.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);
    setSavedPageUrl("");

    try {
      // Use the simplified save-markdown-to-confluence endpoint
      const response = await fetch("http://localhost:8000/api/save-markdown-to-confluence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          markdown_content: documentationData.markdown_content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save to Confluence");
      }

      const result = await response.json();
      setSuccess(true);
      setSavedPageUrl(result.confluence.page_url);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isReady = documentationData?.markdown_content;

  return (
    <div className="card h-full">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
              Export to Confluence
            </h3>
            <p className="text-sm text-gray-500">Save documentation to Confluence</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Confluence Website
            </label>
            <input 
              type="text" 
              id="website" 
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://confluence.company.com"
              className="input-field"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Confluence website URL (configured in backend)
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
            </label>
            <input 
              type="text" 
              id="title" 
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title for Confluence"
              className="input-field"
              disabled={loading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Title for the Confluence page
            </p>
          </div>
          
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
          
          {success && savedPageUrl && (
            <div className="success-state">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <span>Documentation exported successfully!</span>
                  <a 
                    href={savedPageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    View in Confluence
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading || !isReady}
            className="btn-tertiary w-full relative"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white absolute left-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {loading ? "Exporting..." : "Export to Confluence"}
            </div>
          </button>
          
          {!isReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-800">
                  Generate documentation first to enable export
                </span>
              </div>
            </div>
          )}
          
         
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Export Information:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Status:</strong> {isReady ? 'Ready to export' : 'Waiting for documentation'}</div>
              <div><strong>Content:</strong> {documentationData?.markdown_content ? 'Documentation loaded' : 'No content'}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Confluence;
