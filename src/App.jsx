import { useState } from "react";
import "./App.css";
import GitHubRepo from "./components/GithubRepo";
import Dropdown from "./components/Dropdown";
import GenerateDocumentation from "./components/GenerateDocumentation";
import MarkdownDisplay from "./components/MarkdownDisplay";
import ChatBot from "./components/ChatBot";
import Dashboard from "./components/Dashboard";

function App() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [documentationData, setDocumentationData] = useState(null);
  const [documentationType, setDocumentationType] = useState('');
  const [documentationError, setDocumentationError] = useState('');
  const [documentationLoading, setDocumentationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' or 'dashboard'

  const handleBranchesLoaded = (branchData, url) => {
    setBranches(branchData);
    setRepoUrl(url);
    setSelectedBranch(""); // Reset selected branch when new branches are loaded
    setDocumentationData(null); // Clear previous documentation
  };

  const handleBranchSelect = (branchName) => {
    setSelectedBranch(branchName);
    setDocumentationData(null); // Clear documentation when branch changes
  };

  const handleDocumentationGenerated = (data, type) => {
    setDocumentationData(data);
    setDocumentationType(type);
    setDocumentationError('');
  };

  const getDocumentationTitle = () => {
    if (documentationType === 'usage-guide') {
      return 'Usage Guide (README)';
    } else if (documentationType === 'evolution-summary') {
      return 'Evolution Summary (How We Got Here)';
    }
    return 'Documentation';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="header-gradient shadow-lg ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">GitLit</h1>
                  <p className="text-blue-100 text-sm font-medium">AI-Powered Documentation Generator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('workflow')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'workflow'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Documentation Workflow</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    <path d="M13 8a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM13 12a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM13 16a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                  </svg>
                  <span>Team Dashboard</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'workflow' ? (
          <>
            {/* Action Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <GitHubRepo onBranchesLoaded={handleBranchesLoaded} />
              </div>

              <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <Dropdown
                  branches={branches}
                  loading={false}
                  onBranchSelect={handleBranchSelect}
                />
              </div>

              <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <GenerateDocumentation
                  repoUrl={repoUrl}
                  selectedBranch={selectedBranch}
                  onDocumentationGenerated={handleDocumentationGenerated}
                  onLoadingChange={setDocumentationLoading}
                />
              </div>
            </div>

            {/* Documentation Display - Always visible */}
            <div className="animate-fade-in">
              <MarkdownDisplay
                data={documentationData}
                loading={documentationLoading}
                error={documentationError}
                title={getDocumentationTitle()}
              />
            </div>
          </>
        ) : (
          /* Dashboard Tab */
          <div className="animate-fade-in">
            <Dashboard
              repoUrl={repoUrl}
              selectedBranch={selectedBranch}
            />
          </div>
        )}
      </main>

      {/* ChatBot Widget */}
      <ChatBot 
        repoUrl={repoUrl}
        selectedBranch={selectedBranch}
      />
    </div>
  );
}

export default App;