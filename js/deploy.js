/**
 * GitHub Pages Deployer
 * Pushes the generated resume directly to GitHub Pages via API
 */
const GitHubDeployer = {
  
  API_BASE: 'https://api.github.com',
  
  /**
   * Create a repo and push files to deploy to GitHub Pages
   */
  async deploy(token, repoName, htmlContent) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ResumeBuilder/1.0'
    };

    // Step 1: Get authenticated user
    const userRes = await fetch(`${this.API_BASE}/user`, { headers });
    if (!userRes.ok) throw new Error('Invalid GitHub token');
    const user = await userRes.json();
    const username = user.login;

    // Step 2: Create repository
    const createRes = await fetch(`${this.API_BASE}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repoName,
        description: 'My animated resume — built with ResumeBuilder',
        private: false,
        auto_init: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      if (err.errors?.[0]?.code === 'already_exists') {
        throw new Error(`Repository "${repoName}" already exists. Pick a different name.`);
      }
      throw new Error(err.message || 'Failed to create repository');
    }

    const repo = await createRes.json();
    const owner = username;

    // Step 3: Create index.html
    await this.createFile(owner, repoName, 'index.html', htmlContent, 'Initial commit — animated resume', headers);

    // Step 4: Enable GitHub Pages
    const pagesRes = await fetch(`${this.API_BASE}/repos/${owner}/${repoName}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      })
    });

    if (!pagesRes.ok) {
      // Pages might take a moment; try to set it up
      const err = await pagesRes.json();
      console.warn('Pages setup warning:', err);
    }

    // Step 5: Return the URL
    const pagesUrl = `https://${username}.github.io/${repoName}`;
    return {
      success: true,
      url: pagesUrl,
      repoUrl: repo.html_url,
      username,
      repoName
    };
  },

  /**
   * Create or update a file in a repo
   */
  async createFile(owner, repoName, path, content, message, headers) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    const res = await fetch(`${this.API_BASE}/repos/${owner}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch: 'main'
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `Failed to create ${path}`);
    }

    return await res.json();
  },

  /**
   * Check if a repo already exists
   */
  async repoExists(token, repoName) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ResumeBuilder/1.0'
    };

    const res = await fetch(`${this.API_BASE}/user/repos?per_page=100`, { headers });
    if (!res.ok) return false;
    
    const repos = await res.json();
    return repos.some(r => r.name === repoName);
  }
};
