import React from "react";

const Dropdown = ({ branches, loading, onBranchSelect }) => {
  const handleBranchChange = (e) => {
    if (onBranchSelect) {
      onBranchSelect(e.target.value);
    }
  };

  const getDropdownState = () => {
    if (loading) return "loading";
    if (branches.length === 0) return "empty";
    return "ready";
  };

  const getDropdownIcon = () => {
    const state = getDropdownState();
    if (state === "loading") {
      return (
        <svg className="animate-spin w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            {getDropdownIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--prudential-blue)' }}>
              Step 2: Select Branch
            </h3>
            <p className="text-sm text-gray-500">Choose the branch to document</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="space-y-4">
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
              Available Branches
            </label>
            <select 
              className="select-field" 
              name="branch" 
              id="branch"
              onChange={handleBranchChange}
              disabled={loading || branches.length === 0}
            >
              <option value="">
                {loading 
                  ? "Loading branches..." 
                  : branches.length === 0 
                    ? "No branches available - connect a repository first" 
                    : "Select a branch"
                }
              </option>
              {branches.map((branch, index) => (
                <option key={index} value={branch.name}>
                  {branch.name} {branch.is_default ? "(default)" : ""}
                </option>
              ))}
            </select>
            
            {branches.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {branches.length} branch{branches.length !== 1 ? 'es' : ''} available
              </p>
            )}
          </div>
          
          {branches.length === 0 && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-800">
                  Complete Step 1 to see available branches
                </span>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="animate-spin w-5 h-5 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-orange-800">
                  Fetching branches from repository...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;