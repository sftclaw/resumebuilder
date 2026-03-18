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
  let isDemo = false;
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
  const previewFrame = document.getElementById('previewFrame');
  const backBtn = document.getElementById('backBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const fileInput = document.getElementById('fileInput');
  const uploadWidget = document.getElementById('uploadWidget');

  // Landing page buttons
  const startBtns = [document.getElementById('startBtn'), document.getElementById('startBtn2'), document.getElementById('startBtn3')];
  const demoBtns = [document.getElementById('demoBtn'), document.getElementById('demoBtn2')];

  // ===== NAVIGATION =====
  startBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', () => showEditor(null));
  });

  demoBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', () => showEditor(DemoData, true));
  });

  backBtn.addEventListener('click', () => {
    editor.classList.remove('active');
    landing.classList.add('active');
    AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true });
  });

  function showEditor(data, demo = false) {
    landing.classList.remove('active');
    editor.classList.add('active');
    isDemo = demo;
    parsedData = data;

    if (data) {
      populateEditor(data);
    } else {
      // Fresh start — empty editor
      parsedData = {
        profile: { name: '', headline: '', location: '', summary: '', email: '', website: '' },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
      };
      populateEditor(parsedData);
    }
  }

  // ===== FILE UPLOAD =====
  uploadWidget.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Please upload a ZIP file from LinkedIn data export.');
      return;
    }

    try {
      parsedData = await LinkedInParser.parse(file);
      if (!parsedData.profile.name) {
        parsedData.profile.name = 'Your Name';
      }
      isDemo = false;
      populateEditor(parsedData);
    } catch (err) {
      console.error('Parse error:', err);
      alert('Failed to parse file: ' + err.message);
    }

    fileInput.value = '';
  });

  // ===== POPULATE EDITOR =====
  function populateEditor(data) {
    document.getElementById('field-name').value = data.profile.name || '';
    document.getElementById('field-headline').value = data.profile.headline || '';
    document.getElementById('field-location').value = data.profile.location || '';
    document.getElementById('field-about').value = data.profile.summary || '';
    document.getElementById('field-email').value = data.profile.email || '';
    document.getElementById('field-website').value = data.profile.website || '';

    // Reset section toggles
    document.querySelectorAll('.section-toggles input').forEach(el => {
      el.checked = true;
    });
    sections = { experience: true, education: true, skills: true, projects: true, certifications: true };

    // Reset theme
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-theme="dark"]').classList.add('active');
    currentTheme = 'dark';

    updatePreview();
  }

  // ===== PREVIEW =====
  function updatePreview() {
    if (!parsedData) return;

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
    AOS.refresh();
  }

  // Debounced update
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

  // ===== DOWNLOAD =====
  downloadBtn.addEventListener('click', () => {
    if (!parsedData) return;

    const updatedData = getUpdatedData();
    const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const name = (updatedData.profile.name || 'resume').replace(/[^a-z0-9]/gi, '_');
    saveAs(blob, `${name}_resume.html`);
  });

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
