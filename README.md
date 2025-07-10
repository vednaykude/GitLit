# GitLit

GitLit is an AI-powered documentation and analysis tool for GitHub repositories. It features a modern React + Vite frontend and a FastAPI backend, enabling seamless documentation generation, repository analysis, and Confluence integration.

## Features

- **GitHub Integration:**
  - Select a GitHub repository and branch.
  - Fetch branches and analyze collaborators.
- **AI Documentation Generation:**
  - Generate usage guides (README) and changelogs using Google Gemini.
  - View and copy generated markdown documentation.
- **Confluence Export:**
  - Save generated documentation directly to Confluence as a new page.
- **Collaborator Dashboard:**
  - Visualize and analyze repository collaborators and their contributions.
- **Chatbot Assistant:**
  - Ask questions about repository history, commits, and development using an AI-powered chatbot.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** FastAPI (Python), Google Gemini API, Confluence API

## Getting Started

### Prerequisites
- Node.js & npm
- Python 3.10+
- [Confluence API credentials](https://developer.atlassian.com/cloud/confluence/rest/)
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd GitLit
   ```
2. **Install frontend dependencies:**
   ```sh
   npm install
   ```
3. **Install backend dependencies:**
   ```sh
   cd backend
   pip install -r requirements.txt
   ```
4. **Set up environment variables:**
   - Create a `.env` file in `backend/` with your Confluence and Gemini API credentials.

### Running the App

- **Start the backend:**
  ```sh
  cd backend
  uvicorn backend:app --reload
  ```
- **Start the frontend:**
  ```sh
  npm run dev
  ```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000` by default.

## Project Structure

- `src/` — React frontend components
- `backend/` — FastAPI backend
- `public/` — Static assets

## License

MIT
