import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ChatBot = ({ repoUrl, selectedBranch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Litty, your repository assistant. I can help you understand the evolution of your repository. Ask me questions about recent commits, changes, or development history. ",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ((isOpen || isFullscreen) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isFullscreen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!repoUrl || !selectedBranch) {
      const errorMessage = {
        id: Date.now(),
        text: "Please select a repository and branch first before asking questions.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/ask-evolution-question?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(selectedBranch)}&question=${encodeURIComponent(inputMessage)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get response");
      }

      const result = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        text: result.answer,
        sender: 'bot',
        timestamp: new Date(),
        commitCount: result.commit_count_used
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hi! I'm Litty, your repository assistant. I can help you understand the evolution of your repository. Ask me questions about recent commits, changes, or development history. ",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 ${
          isOpen 
            ? 'hover:bg-red-600' 
            : 'hover:opacity-90'
        }`}
        style={{
          backgroundColor: isOpen ? '#ef4444' : 'var(--prudential-blue)'
        }}
        title={isOpen ? 'Close Chat' : 'Ask Evolution Questions'}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white m-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bg-white shadow-2xl border border-gray-200 z-40 flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'inset-4 rounded-lg' 
            : 'bottom-24 right-6 w-96 h-96 rounded-lg'
        }`}>
          {/* Header */}
          <div className="text-white p-4 rounded-t-lg flex items-center justify-between" style={{ backgroundColor: 'var(--prudential-blue)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--prudential-green)' }}></div>
              <div>
                <h3 className="font-semibold text-md">Litty</h3>
                <p className="text-xs opacity-80">
                  {repoUrl && selectedBranch 
                    ? `${repoUrl.split('/').slice(-2).join('/')} (${selectedBranch})`
                    : 'Select repo & branch to start'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white opacity-80 hover:opacity-100 transition-all"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
              <button
                onClick={clearChat}
                className="text-white opacity-80 hover:opacity-100 transition-all"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${isFullscreen ? 'max-w-4xl' : 'max-w-xs'} rounded-lg p-3 text-sm ${
                    message.sender === 'user'
                      ? 'text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  style={message.sender === 'user' ? { backgroundColor: 'var(--prudential-blue)' } : {}}
                >
                  {message.sender === 'bot' && !message.isError ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  )}
                  {message.commitCount && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      Based on {message.commitCount} commits
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white opacity-70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg p-3 text-sm max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>Analyzing commits...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about recent changes, commits, or evolution..."
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-blue-500"
                disabled={isLoading || !repoUrl || !selectedBranch}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || !repoUrl || !selectedBranch}
                className="text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: 'var(--prudential-blue)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
