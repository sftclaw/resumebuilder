/**
 * ResumeBuilder — Main App Controller
 */
(function() {
  'use strict';

  // Initialize AOS on landing page
  AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true });

  // State
  let parsedData = null;
  let currentTheme = 'dark';
  let sections = {
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true
  };

  // DOM Elements
  const landing = document.getElementById('landing');
  const editor = document.getElementById('editor');
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const previewFrame = document.getElementById('previewFrame');
  const backBtn = document.getElementById('backBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const deployBtn = document.getElementById('deployBtn');
  const deployModal = document.getElementById('deployModal');
  const cancelDeploy = document.getElementById('cancelDeploy');
  const confirmDeploy = document.getElementById('confirmDeploy');
  const deployStatus = document.getElementById('deployStatus');

  // ===== FILE UPLOAD =====
  uploadArea.addEventListener('click', () => fileInput.click());
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().includes('.zip')) {
      await handleFile(file);
    } else {
      alert('Please upload a ZIP file from LinkedIn data export.');
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await handleFile(file);
  });

  async function handleFile(file) {
    uploadArea.innerHTML = '<div class="upload-icon">⏳</div><p class="upload-text">Parsing your LinkedIn data...</p>';
    
    try {
      parsedData = await LinkedInParser.parse(file);
      
      if (!parsedData.profile.name) {
        // Try to fill from whatever we have
        parsedData.profile.name = parsedData.profile.name || 'Your Name';
      }

      populateEditor(parsedData);
      showEditor();
    } catch (err) {
      console.error('Parse error:', err);
      uploadArea.innerHTML = `<div class="upload-icon">❌</div><p class="upload-text">Failed to parse file</p><p class="upload-subtext">${err.message}</p>`;
    }
  }

  // ===== POPULATE EDITOR =====
  function populateEditor(data) {
    document.getElementById('field-name').value = data.profile.name || '';
    document.getElementById('field-headline').value = data.profile.headline || '';
    document.getElementById('field-location').value = data.profile.location || '';
    document.getElementById('field-about').value = data.profile.summary || '';
    document.getElementById('field-email').value = data.profile.email || '';
    document.getElementById('field-website').value = data.profile.website || '';
    
    updatePreview();
  }

  // ===== PREVIEW =====
  function updatePreview() {
    if (!parsedData) return;

    // Update profile from editor fields
    const updatedData = JSON.parse(JSON.stringify(parsedData));
    updatedData.profile.name = document.getElementById('field-name').value;
    updatedData.profile.headline = document.getElementById('field-headline').value;
    updatedData.profile.location = document.getElementById('field-location').value;
    updatedData.profile.summary = document.getElementById('field-about').value;
    updatedData.profile.email = document.getElementById('field-email').value;
    updatedData.profile.website = document.getElementById('field-website').value;

    const html = ResumeRenderer.renderPreview(updatedData, { theme: currentTheme, sections });
    previewFrame.innerHTML = html;
    previewFrame.querySelector('.resume').classList.add(`theme-${currentTheme}`);

    // Re-init AOS for preview
    AOS.refresh();
  }

  // Debounced update on input changes
  let updateTimeout;
  document.querySelectorAll('.sidebar input, .sidebar textarea').forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updatePreview, 300);
    });
  });

  // ===== SECTION TOGGLES =====
  document.querySelectorAll('.section-toggles input').forEach(el => {
    el.addEventListener('change', () => {
      sections[el.dataset.section] = el.checked;
      updatePreview();
    });
  });

  // ===== THEME SWITCHER =====
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTheme = btn.dataset.theme;
      updatePreview();
    });
  });

  // ===== NAVIGATION =====
  function showEditor() {
    landing.classList.remove('active');
    editor.classList.add('active');
  }

  backBtn.addEventListener('click', () => {
    editor.classList.remove('active');
    landing.classList.add('active');
    uploadArea.innerHTML = '<div class="upload-icon">📁</div><p class="upload-text">Drag & drop your LinkedIn ZIP file here</p><p class="upload-subtext">or click to browse</p>';
  });

  // ===== DOWNLOAD =====
  downloadBtn.addEventListener('click', () => {
    if (!parsedData) return;
    
    const updatedData = getUpdatedData();
    const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `${(updatedData.profile.name || 'resume').replace(/[^a-z0-9]/gi, '_')}_resume.html`;
    saveAs(blob, filename);
  });

  // ===== DEPLOY =====
  deployBtn.addEventListener('click', () => {
    deployModal.hidden = false;
    deployStatus.style.display = 'none';
    deployStatus.className = 'deploy-status';
    
    // Pre-fill with saved token if available
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
      document.getElementById('deployToken').value = savedToken;
    }
  });

  cancelDeploy.addEventListener('click', () => {
    deployModal.hidden = true;
  });

  deployModal.addEventListener('click', (e) => {
    if (e.target === deployModal) deployModal.hidden = true;
  });

  confirmDeploy.addEventListener('click', async () => {
    const token = document.getElementById('deployToken').value.trim();
    const repoName = document.getElementById('deployRepo').value.trim() || 'my-resume';

    if (!token) {
      showDeployStatus('error', 'Please enter your GitHub token.');
      return;
    }

    if (!parsedData) {
      showDeployStatus('error', 'No resume data loaded.');
      return;
    }

    // Save token for future use
    localStorage.setItem('gh_token', token);

    showDeployStatus('loading', '🚀 Creating repository and deploying...');
    confirmDeploy.disabled = true;

    try {
      const updatedData = getUpdatedData();
      const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });

      const result = await GitHubDeployer.deploy(token, repoName, html);
      
      showDeployStatus('success', 
        `✅ Deployed successfully!<br><br>` +
        `🔗 <a href="${result.url}" target="_blank" style="color: #4ade80;">${result.url}</a><br>` +
        `📁 <a href="${result.repoUrl}" target="_blank" style="color: #a5b4fc;">${result.repoUrl}</a>`
      );
    } catch (err) {
      showDeployStatus('error', `❌ ${err.message}`);
    } finally {
      confirmDeploy.disabled = false;
    }
  });

  function showDeployStatus(type, message) {
    deployStatus.className = `deploy-status ${type}`;
    deployStatus.innerHTML = message;
    deployStatus.style.display = 'block';
  }

  // ===== HELPERS =====
  function getUpdatedData() {
    const data = JSON.parse(JSON.stringify(parsedData));
    data.profile.name = document.getElementById('field-name').value;
    data.profile.headline = document.getElementById('field-headline').value;
    data.profile.location = document.getElementById('field-location').value;
    data.profile.summary = document.getElementById('field-about').value;
    data.profile.email = document.getElementById('field-email').value;
    data.profile.website = document.getElementById('field-website').value;
    return data;
  }

})();
