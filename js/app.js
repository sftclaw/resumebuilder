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
  const downloadMenu = document.getElementById('downloadMenu');
  const downloadHtml = document.getElementById('downloadHtml');
  const downloadPdf = document.getElementById('downloadPdf');
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

  // ===== DOWNLOAD DROPDOWN =====
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadMenu.hidden = !downloadMenu.hidden;
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    downloadMenu.hidden = true;
  });

  downloadMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // ===== DOWNLOAD HTML =====
  downloadHtml.addEventListener('click', () => {
    if (!parsedData) return;
    downloadMenu.hidden = true;

    const updatedData = getUpdatedData();
    const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const name = (updatedData.profile.name || 'resume').replace(/[^a-z0-9]/gi, '_');
    saveAs(blob, `${name}_resume.html`);
  });

  // ===== DOWNLOAD PDF =====
  downloadPdf.addEventListener('click', async () => {
    if (!parsedData) return;
    downloadMenu.hidden = true;

    // Show loading state
    const originalText = downloadPdf.innerHTML;
    downloadPdf.innerHTML = '<span class="download-icon">⏳</span><span><strong>Generating PDF...</strong><small>Please wait</small></span>';
    downloadPdf.disabled = true;

    try {
      const updatedData = getUpdatedData();
      const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });

      // Create a hidden iframe to render the resume
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:1200px;opacity:0;pointer-events:none;';
      document.body.appendChild(iframe);

      // Write HTML to iframe
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();

      // Wait for fonts and rendering
      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 2000); // Fallback timeout
      });

      // Wait a bit more for fonts
      await new Promise(r => setTimeout(r, 500));

      const resumeEl = iframe.contentDocument.querySelector('.resume');
      const name = (updatedData.profile.name || 'resume').replace(/[^a-z0-9]/gi, '_');

      // Use html2pdf
      const opt = {
        margin: 0,
        filename: `${name}_resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(resumeEl).save();

      // Cleanup
      document.body.removeChild(iframe);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try downloading as HTML instead.');
    } finally {
      downloadPdf.innerHTML = originalText;
      downloadPdf.disabled = false;
    }
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
