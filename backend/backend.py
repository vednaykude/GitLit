from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime
import httpx
import re
import os
import google.generativeai as genai
from dotenv import load_dotenv
import base64
import json
from urllib.parse import quote

load_dotenv()

CONFLUENCE_BASE_URL = os.getenv("CONFLUENCE_BASE_URL")
CONFLUENCE_USERNAME = os.getenv("CONFLUENCE_USERNAME") 
CONFLUENCE_API_TOKEN = os.getenv("CONFLUENCE_API_TOKEN")
CONFLUENCE_SPACE_KEY = os.getenv("CONFLUENCE_SPACE_KEY")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("models/gemini-2.5-pro")

def gemini_response(text):
    response = model.generate_content(text)
    return response.text

# Initialize FastAPI app
app = FastAPI(
    title="Project Handoff Assistant API",
    description="AI-powered documentation generation from Git repositories",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# New Pydantic models for our three endpoints
class BranchInfo(BaseModel):
    name: str
    commit_sha: str
    last_commit_date: str
    is_default: bool

class BranchesResponse(BaseModel):
    repository_url: str
    branches: List[BranchInfo]
    total_branches: int

class DocumentationResponse(BaseModel):
    repository_url: str
    branch: str
    document_type: str  # "usage_guide" or "evolution_history"
    generated_at: datetime
    markdown_content: str
    processing_time_seconds: float

class AskEvolutionResponse(BaseModel):
    answer: str
    commit_count_used: int

class CollaboratorContribution(BaseModel):
    name: str
    email: str
    commit_count: int
    lines_added: int
    lines_removed: int
    files_modified: List[str]
    primary_languages: List[str]
    functionality_summary: str
    first_commit_date: str
    last_commit_date: str
    commit_frequency_per_week: float
    key_areas: List[str]  # Main work areas

class CollaboratorAnalysisResponse(BaseModel):
    repository_url: str
    branch: str
    total_collaborators: int
    analysis_date: datetime
    collaborators: List[CollaboratorContribution]
    team_summary: str
    processing_time_seconds: float

# Existing models (keeping for backward compatibility)
class ProjectStats(BaseModel):
    total_commits: int
    active_contributors: int
    code_coverage: float
    open_pull_requests: int

class RecentActivity(BaseModel):
    user: str
    action: str
    time: str
    commit_hash: Optional[str] = None

class GitInsight(BaseModel):
    repository: str
    last_updated: datetime
    stats: ProjectStats
    recent_activities: List[RecentActivity]

def parse_github_url(repo_url: str) -> tuple[str, str]:
    """Parse GitHub URL to extract owner and repo name"""
    # Handle different GitHub URL formats
    patterns = [
        r'https://github\.com/([^/]+)/([^/]+)/?$',
        r'https://github\.com/([^/]+)/([^/]+)\.git$',
        r'git@github\.com:([^/]+)/([^/]+)\.git$'
    ]
    
    for pattern in patterns:
        match = re.match(pattern, repo_url.strip())
        if match:
            owner, repo = match.groups()
            # Remove .git suffix if present
            if repo.endswith('.git'):
                repo = repo[:-4]
            return owner, repo
    
    raise ValueError(f"Invalid GitHub URL format: {repo_url}")

async def get_github_branches(owner: str, repo: str) -> List[BranchInfo]:
    """Fetch branches from GitHub API"""
    github_api_url = f"https://api.github.com/repos/{owner}/{repo}/branches"
    
    # Set up headers with authentication if token is available
    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        headers["Accept"] = "application/vnd.github.v3+json"
    
    async with httpx.AsyncClient() as client:
        # Get branches
        response = await client.get(github_api_url, headers=headers)
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or access denied")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="GitHub API error")
        
        branches_data = response.json()
        
        # Get default branch info
        repo_info_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_response = await client.get(repo_info_url, headers=headers)
        default_branch = repo_response.json().get("default_branch", "main") if repo_response.status_code == 200 else "main"
        
        # Convert to BranchInfo objects
        branches = []
        for branch in branches_data:
            # Get commit details for last commit date
            commit_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{branch['commit']['sha']}"
            commit_response = await client.get(commit_url, headers=headers)
            
            if commit_response.status_code == 200:
                commit_data = commit_response.json()
                last_commit_date = commit_data['commit']['author']['date'][:10]  # Extract date part
            else:
                last_commit_date = "Unknown"
            
            branches.append(BranchInfo(
                name=branch['name'],
                commit_sha=branch['commit']['sha'],
                last_commit_date=last_commit_date,
                is_default=(branch['name'] == default_branch)
            ))
        
        return branches

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Project Handoff Assistant API is running", "status": "healthy"}

# Test endpoint to check Confluence connection
@app.get("/api/test-confluence")
async def test_confluence_connection():
    """Test Confluence API connection"""
    try:
        auth_string = f"{CONFLUENCE_USERNAME}:{CONFLUENCE_API_TOKEN}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # Test space access
            space_url = f"{CONFLUENCE_BASE_URL}/wiki/rest/api/space/{CONFLUENCE_SPACE_KEY}"
            space_response = await client.get(space_url, headers=headers)
            
            if space_response.status_code == 200:
                space_data = space_response.json()
                return {
                    "success": True,
                    "message": "Confluence API connection successful",
                    "space_name": space_data.get("name"),
                    "space_key": space_data.get("key"),
                    "base_url": CONFLUENCE_BASE_URL
                }
            else:
                return {
                    "success": False,
                    "error": f"Cannot access space '{CONFLUENCE_SPACE_KEY}': {space_response.status_code}",
                    "details": space_response.text[:500]
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Main endpoint to save documentation to Confluence
@app.post("/api/save-to-confluence")
async def save_documentation_to_confluence(
    repo_url: str, 
    branch: str, 
    document_type: str,  # "usage_guide" or "evolution_history"
    space_key: str = None
):
    """Generate documentation and save it to Confluence"""
    try:
        # Generate the documentation first
        if document_type == "usage_guide":
            doc_response = await generate_usage_guide(repo_url, branch)
        elif document_type == "evolution_history":
            doc_response = await generate_evolution_summary(repo_url, branch)
        else:
            raise HTTPException(status_code=400, detail="Invalid document_type. Use 'usage_guide' or 'evolution_history'")
        
        # Create a title for the Confluence page
        owner, repo = parse_github_url(repo_url)
        title_prefix = "Usage Guide" if document_type == "usage_guide" else "Evolution History"
        title = f"{title_prefix} - {repo} ({branch})"
        
        # Save to Confluence
        confluence_result = await save_to_confluence(
            title=title,
            markdown_content=doc_response.markdown_content,
            space_key=space_key
        )
        
        return {
            "success": True,
            "message": "Documentation saved to Confluence successfully",
            "documentation_type": document_type,
            "confluence": confluence_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to Confluence: {str(e)}")

# Simple endpoint to save any markdown to Confluence
class MarkdownRequest(BaseModel):
    title: str
    markdown_content: str

@app.post("/api/save-markdown-to-confluence")
async def save_markdown_to_confluence(request: MarkdownRequest):
    """Save custom markdown content to Confluence using environment variables for all configuration"""
    try:
        confluence_result = await save_to_confluence(
            title=request.title,
            markdown_content=request.markdown_content,
            space_key=None  # Use default from environment
        )
        
        return {
            "success": True,
            "message": "Markdown saved to Confluence successfully",
            "confluence": confluence_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving markdown to Confluence: {str(e)}")


@app.get("/api/branches", response_model=BranchesResponse)
async def get_branches(repo_url: str):
    """Get all branches for a given GitHub repository URL"""
    try:
        # Parse GitHub URL to extract owner and repo
        owner, repo = parse_github_url(repo_url)
        
        # Fetch branches from GitHub API
        branches = await get_github_branches(owner, repo)
        
        return BranchesResponse(
            repository_url=repo_url,
            branches=branches,
            total_branches=len(branches)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching branches: {str(e)}")


@app.get("/api/evolution-summary", response_model=DocumentationResponse)
async def generate_evolution_summary(repo_url: str, branch: str):
   """Generate 'How We Got Here' documentation from complete Git history using GitHub API"""
   try:
       start_time = datetime.now()
       owner, repo = parse_github_url(repo_url)
       headers = {}
       if GITHUB_TOKEN:
           headers["Authorization"] = f"token {GITHUB_TOKEN}"
           headers["Accept"] = "application/vnd.github.v3+json"


       async with httpx.AsyncClient() as client:
           # Get all commits for the branch (paginated)
           commits = []
           page = 1
           while True:
               commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=100&page={page}"
               resp = await client.get(commits_url, headers=headers)
               if resp.status_code != 200:
                   raise HTTPException(status_code=resp.status_code, detail="Error fetching commits from GitHub")
               page_commits = resp.json()
               if not page_commits:
                   break
               commits.extend(page_commits)
               page += 1


           if not commits:
               raise HTTPException(status_code=404, detail="No commits found on this branch.")


           # For each commit, get the diff (compare with previous commit)
           summary = f"# How We Got Here - {repo_url} ({branch} branch)\n\n"
           summary += f"Total commits: {len(commits)}\n\n"
           summary += "## Commit-by-Commit Evolution\n\n"


           # Commits are newest first, so reverse for chronological order
           commits = list(reversed(commits))


           for i, commit in enumerate(commits):
               sha = commit["sha"]
               author = commit["commit"]["author"]["name"]
               date = commit["commit"]["author"]["date"]
               message = commit["commit"]["message"]


               summary += f"### Commit `{sha[:7]}`\n"
               summary += f"- **Date:** {date}\n"
               summary += f"- **Author:** {author}\n"
               summary += f"- **Message:** {message}\n"


               # Get diff with previous commit (skip for first commit)
               if i == 0:
                   summary += "_Initial commit (no diff)_\n\n"
               else:
                   prev_sha = commits[i-1]["sha"]
                   compare_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{prev_sha}...{sha}"
                   compare_resp = await client.get(compare_url, headers=headers)
                   if compare_resp.status_code == 200:
                       files = compare_resp.json().get("files", [])
                       for file in files:
                           filename = file["filename"]
                           patch = file.get("patch")
                           if patch:
                               # Truncate large diffs for readability
                               if len(patch) > 2000:
                                   patch = patch[:2000] + "\n...diff truncated...\n"
                               summary += f"\n#### `{filename}`\n"
                               summary += "```diff\n"
                               summary += patch
                               summary += "\n```\n"
                   else:
                       summary += "_Could not fetch diff_\n"
               summary += "\n---\n\n"

       # Generate AI-enhanced summary using Gemini
       ai_enhanced_summary = get_how_we_got_here_markdown(summary, repo_url, branch)
       
       processing_time = (datetime.now() - start_time).total_seconds()
       
       return DocumentationResponse(
           repository_url=repo_url,
           branch=branch,
           document_type="evolution-summary",
           generated_at=datetime.now(),
           markdown_content=ai_enhanced_summary,
           processing_time_seconds=processing_time
       )

   except Exception as e:
       raise HTTPException(status_code=500, detail=f"Error generating evolution summary: {str(e)}")




def get_how_we_got_here_markdown(evolution_str: str, repo_url: str, branch: str) -> str:
   """
   Takes the raw evolution summary markdown, sends it to Gemini for enhancement,
   and returns a polished Markdown document titled 'How We Got Here' with architectural decisions,
   major changes, and lessons learned.

   Args:
       evolution_str (str): Raw markdown evolution summary.
       repo_url (str): GitHub repository URL.
       branch (str): Branch name.

   Returns:
       str: Enhanced markdown summary generated by Gemini.
   """

   # Prepare prompt for Gemini
   prompt = (
       "You are given a markdown document representing the complete commit history of a GitHub branch, "
       "including every commit message, code content, and the differences between each commit. "
       "Analyze this development journey and generate a comprehensive Markdown document titled 'Change Log'.\n\n"
       "Your summary should:\n"
       "- Create a changelog section that highlights every change made in chronological order. Give at most 3 bullet points describing what changed in each commit. Categorize each commit as major, minor, or patch.\n"
       "- Identify and explain key architectural decisions made throughout the project.\n"
       "- Highlight major changes and refactors, referencing relevant commits.\n"
       "- Summarize important lessons learned or patterns observed during development.\n"
       "- Organize the content clearly with appropriate Markdown headings and bullet points.\n"
       "- Make it readable and insightful for developers who want to understand the project's evolution.\n\n"
       "Here is the commit history:\n\n"
       f"{evolution_str}\n\n"
       "Output the enhanced markdown content only."
   )

   # Get enhanced markdown from Gemini
   markdown_result = gemini_response(prompt)
   return markdown_result


@app.get("/api/usage-guide", response_model=DocumentationResponse)
async def generate_usage_guide(repo_url: str, branch: str):
    """
    Generate comprehensive usage documentation by analyzing ALL files in the entire GitHub repository.
    
    This function:
    1. Fetches the complete repository tree structure
    2. Downloads and analyzes ALL relevant files (not just recent changes)
    3. Categorizes files by type (frontend, backend, config, docs, tests)
    4. Prioritizes critical files (package.json, requirements.txt, main entry points, READMEs)
    5. Uses AI to generate accurate installation and usage instructions
    
    Returns a complete README.md with proper setup and run instructions.
    """
    try:
        start_time = datetime.now()
        owner, repo = parse_github_url(repo_url)

        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"

        async with httpx.AsyncClient() as client:
            # 1. Get the latest commit SHA to access the current state of the repository
            commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=1"
            commits_resp = await client.get(commits_url, headers=headers)
            if commits_resp.status_code != 200:
                raise HTTPException(status_code=commits_resp.status_code, detail="Failed to fetch commits")

            latest_commit = commits_resp.json()[0]
            commit_sha = latest_commit["sha"]

            # 2. Get the complete tree of ALL files in the repository (not just changed files)
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{commit_sha}?recursive=1"
            tree_resp = await client.get(tree_url, headers=headers)
            if tree_resp.status_code != 200:
                raise HTTPException(status_code=tree_resp.status_code, detail="Failed to fetch repository tree")

            tree_data = tree_resp.json()
            all_files = [item for item in tree_data["tree"] if item["type"] == "blob"]

            # 3. Analyze ALL files and categorize them properly
            critical_files = []  # Files essential for understanding how to use the project
            all_analyzed_files = []  # ALL files we'll analyze
            project_structure = {"frontend": [], "backend": [], "config": [], "docs": [], "tests": [], "other": []}
            
            # Categorize ALL files in the repository
            for file_item in all_files:
                path = file_item["path"]
                filename = path.split("/")[-1]
                file_ext = filename.split('.')[-1].lower() if '.' in filename else ''
                
                # Critical configuration and setup files (highest priority for usage guide)
                if filename in ['package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py', 
                              'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'Makefile', 'CMakeLists.txt',
                              'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod', '.env.example', '.env.template']:
                    critical_files.append(file_item)
                    project_structure["config"].append(path)
                
                # Main entry points and startup files
                elif filename in ['main.py', 'app.py', 'run.py', 'server.py', 'manage.py', 'wsgi.py', 'asgi.py',
                                'index.js', 'main.js', 'server.js', 'app.js', 'start.js',
                                'index.html', 'index.htm', 'main.html']:
                    critical_files.append(file_item)
                    if filename.endswith(('.py',)):
                        project_structure["backend"].append(path)
                    elif filename.endswith(('.js', '.html', '.htm')):
                        project_structure["frontend"].append(path)
                
                # Documentation files (critical for understanding usage)
                elif filename.lower() in ['readme.md', 'readme.txt', 'readme.rst', 'install.md', 'installation.md',
                                        'usage.md', 'getting-started.md', 'quickstart.md', 'setup.md'] or \
                     (filename.endswith('.md') and any(keyword in filename.lower() for keyword in 
                      ['readme', 'install', 'setup', 'usage', 'getting', 'start', 'quick', 'tutorial', 'guide'])):
                    critical_files.append(file_item)
                    project_structure["docs"].append(path)
                
                # Categorize all other files by type and location
                elif any(indicator in path.lower() for indicator in ['frontend', 'client', 'public', 'web', 'ui', 'www']):
                    project_structure["frontend"].append(path)
                    if filename.endswith(('.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.scss', '.less')):
                        all_analyzed_files.append(file_item)
                
                elif any(indicator in path.lower() for indicator in ['backend', 'server', 'api', 'src', 'lib']):
                    project_structure["backend"].append(path)
                    if filename.endswith(('.py', '.js', '.ts', '.java', '.go', '.php', '.rb', '.rs', '.cpp', '.c', '.cs')):
                        all_analyzed_files.append(file_item)
                
                elif any(indicator in path.lower() for indicator in ['test', 'tests', 'spec', '__tests__']):
                    project_structure["tests"].append(path)
                    if filename.endswith(('.py', '.js', '.ts', '.java', '.go', '.php', '.rb')):
                        all_analyzed_files.append(file_item)
                
                else:
                    project_structure["other"].append(path)
                    # Include other important files
                    if filename.endswith(('.py', '.js', '.ts', '.java', '.go', '.php', '.rb', '.md', '.yml', '.yaml', '.json', '.toml')):
                        all_analyzed_files.append(file_item)
            
            # Combine critical files and other analyzed files (prioritize critical files)
            files_to_analyze = critical_files + [f for f in all_analyzed_files if f not in critical_files]

            # 4. Build comprehensive content with full repository analysis
            collected_content = f"# Complete Repository Analysis: {repo_url}\n"
            collected_content += f"## Branch: {branch}\n## Commit SHA: {commit_sha}\n\n"
            
            # Comprehensive project analysis summary
            collected_content += "## COMPLETE REPOSITORY STRUCTURE ANALYSIS\n"
            collected_content += f"**Total files in repository:** {len(all_files)}\n"
            collected_content += f"**Files analyzed for usage guide:** {len(files_to_analyze)}\n"
            collected_content += f"**Critical configuration files found:** {len(critical_files)}\n\n"
            
            collected_content += "### File Categories:\n"
            for category, files in project_structure.items():
                if files:
                    collected_content += f"- **{category.title()}:** {len(files)} files\n"
                    # Show first few important files in each category
                    important_files = [f for f in files[:5]]
                    if important_files:
                        collected_content += f"  - Key files: {', '.join(important_files)}\n"
            collected_content += "\n"
            
            # List critical files for easy reference
            if critical_files:
                collected_content += "### CRITICAL FILES FOR SETUP & USAGE:\n"
                for file_item in critical_files:
                    collected_content += f"- {file_item['path']}\n"
                collected_content += "\n"

            # 5. Download and analyze ALL relevant files from the repository
            for file_item in files_to_analyze:
                filepath = file_item["path"]
                
                # Get file content via raw API
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{commit_sha}/{filepath}"
                try:
                    file_resp = await client.get(raw_url)
                    if file_resp.status_code == 200:
                        content = file_resp.text
                        
                        # Determine syntax highlighting
                        file_ext = filepath.split('.')[-1].lower() if '.' in filepath else 'text'
                        syntax_map = {
                            'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript',
                            'json': 'json', 'yaml': 'yaml', 'yml': 'yaml', 'toml': 'toml',
                            'md': 'markdown', 'txt': 'text', 'dockerfile': 'dockerfile',
                            'java': 'java', 'go': 'go', 'php': 'php', 'rb': 'ruby'
                        }
                        syntax = syntax_map.get(file_ext, 'text')
                        
                        # Keep more content for better analysis, but still manage size
                        max_content_length = 8000  # Increased from 4000
                        if len(content) > max_content_length:
                            # For critical files, keep more content
                            if file_item in critical_files:
                                max_content_length = 12000
                            content = content[:max_content_length] + "\n# ...Content Truncated for Size...\n"
                        
                        collected_content += f"\n### File: {filepath}\n```{syntax}\n{content}\n```\n"
                except Exception as e:
                    collected_content += f"\n### File: {filepath}\n*Could not read file: {str(e)}*\n\n"

            # 6. Generate comprehensive usage documentation analyzing the entire repository
            prompt = f"""
You are a senior software architect and technical documentation expert. You have been given the COMPLETE analysis of an entire GitHub repository - all its files, structure, and dependencies.

COMPREHENSIVE REPOSITORY ANALYSIS:
- Total files analyzed: {len(files_to_analyze)}
- Critical configuration files: {len(critical_files)}
- Complete project structure breakdown provided below

YOUR TASK: Create the most accurate and comprehensive README.md usage guide possible.

ANALYSIS REQUIREMENTS:
1. TECHNOLOGY STACK IDENTIFICATION:
   - Examine ALL configuration files (package.json, requirements.txt, etc.)
   - Identify the exact technologies, frameworks, and versions used
   - Determine if it's frontend-only, backend-only, or full-stack

2. INSTALLATION & SETUP:
   - Provide step-by-step installation based on ACTUAL dependency files found
   - Include environment setup if config files exist (.env examples, etc.)
   - Cover all prerequisites based on the tech stack identified

3. HOW TO RUN THE APPLICATION:
   - Find ALL entry points (main.py, index.js, server.js, etc.)
   - Check package.json "scripts" section for available commands
   - Provide separate instructions for frontend/backend if both exist
   - Include development vs production run instructions

4. PROJECT STRUCTURE EXPLANATION:
   - Explain the purpose of major directories and key files
   - Highlight important configuration and entry point files
   - Explain the architecture and data flow

5. CONFIGURATION & ENVIRONMENT:
   - Detail any environment variables needed
   - Explain configuration files and their purposes
   - Include database setup if applicable

6. ADDITIONAL USAGE INFORMATION:
   - API endpoints if it's a backend service
   - Build processes if applicable
   - Testing instructions if test files are present
   - Deployment notes if Dockerfile or similar exists

The README should be professional, complete, and actionable - someone should be able to clone the repo and get it running by following your instructions exactly.

COMPLETE REPOSITORY DATA:
{collected_content}

Return ONLY the markdown content for the README.md file.
"""
            
            markdown = gemini_response(prompt)
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return DocumentationResponse(
                repository_url=repo_url,
                branch=branch,
                document_type="usage_guide",
                generated_at=datetime.now(),
                markdown_content=markdown,
                processing_time_seconds=processing_time
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating usage guide: {str(e)}")

@app.post("/api/ask-evolution-question", response_model=AskEvolutionResponse)
async def ask_evolution_question(repo_url: str, branch: str, question: str):
    """Ask Gemini a question about recent commit history from a GitHub branch"""
    try:
        owner, repo = parse_github_url(repo_url)

        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
            headers["Accept"] = "application/vnd.github.v3+json"

        async with httpx.AsyncClient() as client:
            # Get all commits for the branch (paginated)
            commits = []
            page = 1
            while True:
                commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=100&page={page}"
                resp = await client.get(commits_url, headers=headers)
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail="Error fetching commits from GitHub")
                page_commits = resp.json()
                if not page_commits:
                    break
                commits.extend(page_commits)
                page += 1

            if not commits:
                raise HTTPException(status_code=404, detail="No commits found on this branch.")

            # Build summary markdown
            summary = f"# How We Got Here - {repo_url} ({branch} branch)\n\n"
            summary += f"Total commits: {len(commits)}\n\n"
            summary += "## Commit-by-Commit Evolution\n\n"

            commits = list(reversed(commits))  # chronological order

            for i, commit in enumerate(commits):
                sha = commit["sha"]
                author = commit["commit"]["author"]["name"]
                date = commit["commit"]["author"]["date"]
                message = commit["commit"]["message"]

                summary += f"### Commit `{sha[:7]}`\n"
                summary += f"- **Date:** {date}\n"
                summary += f"- **Author:** {author}\n"
                summary += f"- **Message:** {message}\n"

                # Skip diff for first commit
                if i == 0:
                    summary += "_Initial commit (no diff)_\n\n"
                else:
                    prev_sha = commits[i - 1]["sha"]
                    compare_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{prev_sha}...{sha}"
                    compare_resp = await client.get(compare_url, headers=headers)
                    if compare_resp.status_code == 200:
                        files = compare_resp.json().get("files", [])
                        for file in files:
                            filename = file["filename"]
                            patch = file.get("patch")
                            if patch:
                                if len(patch) > 2000:
                                    patch = patch[:2000] + "\n...diff truncated...\n"
                                summary += f"\n#### `{filename}`\n"
                                summary += "```diff\n"
                                summary += patch
                                summary += "\n```\n"
                    else:
                        summary += "_Could not fetch diff_\n"
                summary += "\n---\n\n"

        # Step 3: Ask Gemini
        prompt = (
            "You are a Git historian assistant. Based on the following Git commit and diff history, "
            "answer the user's question.\n\n"
            f"{summary}\n"
            "## Question:\n"
            f"{question}\n\n"
            "Be concise but informative. Reference commits when possible."
        )

        answer = gemini_response(prompt)

        return AskEvolutionResponse(
            answer=answer,
            commit_count_used=len(commits)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering commit history question: {str(e)}")

@app.get("/api/collaborator-analysis", response_model=CollaboratorAnalysisResponse)
async def analyze_collaborators(repo_url: str, branch: str):
    """Analyze all collaborators and their contributions with minimal LLM usage"""
    try:
        start_time = datetime.now()
        owner, repo = parse_github_url(repo_url)
        
        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
            headers["Accept"] = "application/vnd.github.v3+json"

        async with httpx.AsyncClient() as client:
            # Get all commits for the branch
            commits = []
            page = 1
            while True:
                commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=100&page={page}"
                resp = await client.get(commits_url, headers=headers)
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail="Error fetching commits from GitHub")
                page_commits = resp.json()
                if not page_commits:
                    break
                commits.extend(page_commits)
                page += 1

            if not commits:
                raise HTTPException(status_code=404, detail="No commits found on this branch.")

            # Group commits by author
            author_commits = {}
            for commit in commits:
                author_name = commit["commit"]["author"]["name"]
                author_email = commit["commit"]["author"]["email"]
                author_key = f"{author_name}|{author_email}"
                
                if author_key not in author_commits:
                    author_commits[author_key] = []
                author_commits[author_key].append(commit)

            # Analyze each collaborator
            collaborators = []
            all_commit_messages = []  # Collect all messages for single LLM call
            
            for author_key, author_commit_list in author_commits.items():
                author_name, author_email = author_key.split("|", 1)
                
                # Get detailed stats for this author
                files_modified = set()
                lines_added = 0
                lines_removed = 0
                commit_dates = []
                commit_messages = []
                
                for commit in author_commit_list:
                    commit_date = commit["commit"]["author"]["date"]
                    commit_dates.append(commit_date)
                    commit_messages.append(commit["commit"]["message"])
                    
                    # Get commit details for file changes and line counts
                    commit_detail_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit['sha']}"
                    commit_resp = await client.get(commit_detail_url, headers=headers)
                    if commit_resp.status_code == 200:
                        commit_data = commit_resp.json()
                        if "stats" in commit_data:
                            lines_added += commit_data["stats"].get("additions", 0)
                            lines_removed += commit_data["stats"].get("deletions", 0)
                        
                        # Track files modified
                        for file in commit_data.get("files", []):
                            files_modified.add(file["filename"])

                # Calculate commit frequency
                if len(commit_dates) > 1:
                    first_date = min(commit_dates)
                    last_date = max(commit_dates)
                    first_dt = datetime.fromisoformat(first_date.replace('Z', '+00:00'))
                    last_dt = datetime.fromisoformat(last_date.replace('Z', '+00:00'))
                    weeks_active = max(1, (last_dt - first_dt).days / 7)
                    commit_frequency = len(commit_dates) / weeks_active
                else:
                    commit_frequency = len(commit_dates)
                    first_date = commit_dates[0] if commit_dates else ""
                    last_date = commit_dates[0] if commit_dates else ""

                # Determine primary languages based on file extensions
                file_extensions = {}
                for filename in files_modified:
                    ext = filename.split('.')[-1].lower() if '.' in filename else 'no-ext'
                    file_extensions[ext] = file_extensions.get(ext, 0) + 1
                
                # Map extensions to languages
                ext_to_lang = {
                    'py': 'Python', 'js': 'JavaScript', 'jsx': 'React/JavaScript', 
                    'ts': 'TypeScript', 'tsx': 'React/TypeScript', 'java': 'Java',
                    'cpp': 'C++', 'c': 'C', 'cs': 'C#', 'php': 'PHP', 'rb': 'Ruby',
                    'go': 'Go', 'rs': 'Rust', 'swift': 'Swift', 'kt': 'Kotlin',
                    'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'md': 'Markdown',
                    'json': 'JSON', 'xml': 'XML', 'yaml': 'YAML', 'yml': 'YAML',
                    'sql': 'SQL', 'sh': 'Shell', 'dockerfile': 'Docker'
                }
                
                primary_languages = []
                for ext, count in sorted(file_extensions.items(), key=lambda x: x[1], reverse=True)[:3]:
                    lang = ext_to_lang.get(ext, ext.upper())
                    primary_languages.append(lang)

                # Generate rule-based functionality summary (no LLM call)
                functionality_summary = generate_rule_based_summary(commit_messages, files_modified, primary_languages)
                
                # Generate key areas based on file patterns
                key_areas = identify_key_areas(files_modified, commit_messages)

                collaborator = CollaboratorContribution(
                    name=author_name,
                    email=author_email,
                    commit_count=len(author_commit_list),
                    lines_added=lines_added,
                    lines_removed=lines_removed,
                    files_modified=list(files_modified)[:20],  # Limit to 20 files for response size
                    primary_languages=primary_languages,
                    functionality_summary=functionality_summary,
                    first_commit_date=min(commit_dates) if commit_dates else "",
                    last_commit_date=max(commit_dates) if commit_dates else "",
                    commit_frequency_per_week=round(commit_frequency, 2),
                    key_areas=key_areas
                )
                collaborators.append(collaborator)
                
                # Collect commit messages for team summary
                all_commit_messages.extend([f"{author_name}: {msg}" for msg in commit_messages[:5]])

            # Sort collaborators by commit count (most active first)
            collaborators.sort(key=lambda x: x.commit_count, reverse=True)

            # Generate team summary with single LLM call
            team_summary = generate_team_summary(collaborators, all_commit_messages[:50])  # Limit messages

            processing_time = (datetime.now() - start_time).total_seconds()

            return CollaboratorAnalysisResponse(
                repository_url=repo_url,
                branch=branch,
                total_collaborators=len(collaborators),
                analysis_date=datetime.now(),
                collaborators=collaborators,
                team_summary=team_summary,
                processing_time_seconds=processing_time
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing collaborators: {str(e)}")


def generate_rule_based_summary(commit_messages: List[str], files_modified: set, primary_languages: List[str]) -> str:
    """Generate a functionality summary using rules instead of LLM"""
    
    # Analyze commit message patterns
    patterns = {
        'feature': ['add', 'implement', 'create', 'new', 'feature'],
        'bugfix': ['fix', 'bug', 'error', 'issue', 'resolve'],
        'refactor': ['refactor', 'cleanup', 'reorganize', 'improve'],
        'ui': ['ui', 'frontend', 'css', 'style', 'design', 'interface'],
        'backend': ['api', 'backend', 'server', 'database', 'endpoint'],
        'test': ['test', 'testing', 'spec', 'unit', 'integration'],
        'docs': ['doc', 'readme', 'documentation', 'comment'],
        'config': ['config', 'setup', 'deploy', 'build', 'ci']
    }
    
    category_counts = {category: 0 for category in patterns}
    
    for message in commit_messages:
        message_lower = message.lower()
        for category, keywords in patterns.items():
            if any(keyword in message_lower for keyword in keywords):
                category_counts[category] += 1
    
    # Find top categories
    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    active_categories = [cat for cat, count in top_categories if count > 0]
    
    # Generate summary based on patterns and file types
    if not active_categories:
        summary = f"Contributed {len(commit_messages)} commits"
    else:
        summary = f"Focused on {', '.join(active_categories)}"
    
    if primary_languages:
        summary += f" using {', '.join(primary_languages[:2])}"
    
    if len(files_modified) > 10:
        summary += f", touching {len(files_modified)} files across multiple areas"
    elif files_modified:
        summary += f", working on {len(files_modified)} files"
    
    return summary + "."


def identify_key_areas(files_modified: set, commit_messages: List[str]) -> List[str]:
    """Identify key work areas based on file patterns"""
    
    areas = set()
    
    # File-based area detection
    for filename in files_modified:
        filename_lower = filename.lower()
        
        if any(pattern in filename_lower for pattern in ['frontend', 'src', 'components', 'ui']):
            areas.add('Frontend')
        if any(pattern in filename_lower for pattern in ['backend', 'api', 'server']):
            areas.add('Backend')
        if any(pattern in filename_lower for pattern in ['test', 'spec']):
            areas.add('Testing')
        if any(pattern in filename_lower for pattern in ['config', 'setup', '.yml', '.yaml', 'docker']):
            areas.add('Configuration')
        if filename_lower.endswith(('.md', '.txt', '.rst')):
            areas.add('Documentation')
        if any(pattern in filename_lower for pattern in ['css', 'scss', 'style']):
            areas.add('Styling')
        if filename_lower.endswith(('.py', '.js', '.ts', '.jsx', '.tsx')):
            areas.add('Core Development')
    
    # Commit message-based area detection
    for message in commit_messages:
        message_lower = message.lower()
        if any(word in message_lower for word in ['database', 'db', 'sql']):
            areas.add('Database')
        if any(word in message_lower for word in ['security', 'auth', 'login']):
            areas.add('Security')
        if any(word in message_lower for word in ['performance', 'optimize']):
            areas.add('Performance')
    
    return list(areas)[:5]  # Limit to top 5 areas


def generate_team_summary(collaborators: List[CollaboratorContribution], sample_commits: List[str]) -> str:
    """Generate team summary with single LLM call"""
    
    if len(collaborators) <= 3:
        # For small teams, use rule-based summary
        summary = f"Small team of {len(collaborators)} contributors. "
        top_contributor = collaborators[0]
        summary += f"{top_contributor.name} led development with {top_contributor.commit_count} commits. "
        
        all_languages = set()
        for collab in collaborators:
            all_languages.update(collab.primary_languages)
        
        if all_languages:
            summary += f"Team primarily worked with {', '.join(list(all_languages)[:3])}."
        
        return summary
    
    # For larger teams, use LLM for better insights
    team_info = f"Team of {len(collaborators)} contributors:\n"
    for collab in collaborators[:5]:  # Top 5 contributors
        team_info += f"- {collab.name}: {collab.commit_count} commits, {', '.join(collab.key_areas[:3])}\n"
    
    if len(sample_commits) > 0:
        team_info += f"\nSample recent work:\n"
        for commit in sample_commits[:10]:
            team_info += f"- {commit}\n"
    
    prompt = (
        "Based on the following team information, provide a brief 2-3 sentence summary "
        "describing the team composition, main contributors, and overall project direction:\n\n"
        f"{team_info}"
    )
    
    try:
        return gemini_response(prompt)
    except Exception:
        # Fallback to rule-based summary if LLM fails
        return f"Team of {len(collaborators)} contributors with {collaborators[0].name} as the main contributor ({collaborators[0].commit_count} commits)."


# Legacy endpoints (keeping for backward compatibility)
@app.get("/api/project-stats", response_model=ProjectStats)
async def get_project_stats():
    """Get overall project statistics"""
    try:
        sample_stats = ProjectStats(
            total_commits=247,
            active_contributors=8,
            code_coverage=94.2,
            open_pull_requests=3
        )
        return sample_stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching project stats: {str(e)}")


async def save_to_confluence(title: str, markdown_content: str, space_key: str = None) -> dict:
    """Save markdown content to Confluence as a new page"""
    
    if not all([CONFLUENCE_BASE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN]):
        raise HTTPException(status_code=500, detail="Confluence credentials not configured")
    
    space_key = space_key or CONFLUENCE_SPACE_KEY
    if not space_key:
        raise HTTPException(status_code=500, detail="Confluence space key not provided")
    
    # Convert markdown to Confluence storage format
    confluence_content = markdown_to_confluence_storage(markdown_content)
    
    # Confluence API authentication
    auth_string = f"{CONFLUENCE_USERNAME}:{CONFLUENCE_API_TOKEN}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Create page payload
    page_data = {
        "type": "page",
        "title": title,
        "space": {"key": space_key},
        "body": {
            "storage": {
                "value": confluence_content,
                "representation": "storage"
            }
        }
    }
    
    async with httpx.AsyncClient() as client:
        # Create the page
        create_url = f"{CONFLUENCE_BASE_URL}/wiki/rest/api/content"
        response = await client.post(create_url, headers=headers, json=page_data)
        
        if response.status_code == 200:
            page_info = response.json()
            page_url = f"{CONFLUENCE_BASE_URL}/wiki{page_info['_links']['webui']}"
            return {
                "success": True,
                "page_id": page_info["id"],
                "page_url": page_url,
                "title": title,
                "space_key": space_key
            }
        else:
            error_details = response.text
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Failed to create Confluence page: {error_details}"
            )

def markdown_to_confluence_storage(markdown_content: str) -> str:
    """Convert markdown to Confluence storage format"""
    import re
    
    content = markdown_content
    
    # Convert headers
    content = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', content, flags=re.MULTILINE)
    content = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', content, flags=re.MULTILINE)
    content = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', content, flags=re.MULTILINE)
    
    # Convert code blocks
    def replace_code_block(match):
        language = match.group(1) if match.group(1) else "text"
        code = match.group(2).strip()
        return f'''<ac:structured-macro ac:name="code" ac:schema-version="1">
<ac:parameter ac:name="language">{language}</ac:parameter>
<ac:plain-text-body><![CDATA[{code}]]></ac:plain-text-body>
</ac:structured-macro>'''
    
    content = re.sub(r'```(\w+)?\n(.*?)\n```', replace_code_block, content, flags=re.DOTALL)
    
    # Convert inline code
    content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
    
    # Convert bold and italic
    content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)
    content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', content)
    
    # Convert bullet points
    content = re.sub(r'^- (.*?)$', r'<ul><li>\1</li></ul>', content, flags=re.MULTILINE)
    
    # Convert numbered lists
    content = re.sub(r'^\d+\. (.*?)$', r'<ol><li>\1</li></ol>', content, flags=re.MULTILINE)
    
    # Convert line breaks
    content = content.replace('\n', '<br/>')
    
    return content
# Run the application
if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)