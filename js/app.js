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
  const downloadMd = document.getElementById('downloadMd');
  const downloadJson = document.getElementById('downloadJson');
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

    document.querySelectorAll('.section-toggles input').forEach(el => {
      el.checked = true;
    });
    sections = { experience: true, education: true, skills: true, projects: true, certifications: true };

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
    
    // Apply theme class
    const resume = previewFrame.querySelector('.resume');
    if (resume) {
      resume.className = `resume theme-${currentTheme}`;
    }
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
    const name = filename();
    saveAs(blob, `${name}_resume.html`);
  });

  // ===== DOWNLOAD PDF (via print) =====
  downloadPdf.addEventListener('click', () => {
    if (!parsedData) return;
    downloadMenu.hidden = true;

    const updatedData = getUpdatedData();
    const html = ResumeRenderer.render(updatedData, { theme: currentTheme, sections });

    // Open in a new window and trigger print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for fonts to load, then print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  });

  // ===== DOWNLOAD MARKDOWN =====
  downloadMd.addEventListener('click', () => {
    if (!parsedData) return;
    downloadMenu.hidden = true;

    const data = getUpdatedData();
    let md = '';

    // Name & headline
    md += `# ${data.profile.name || 'Resume'}\n\n`;
    if (data.profile.headline) md += `> ${data.profile.headline}\n\n`;
    if (data.profile.location) md += `📍 ${data.profile.location}\n`;
    if (data.profile.email) md += `📧 ${data.profile.email}\n`;
    if (data.profile.website) md += `🌐 [Portfolio](${data.profile.website})\n`;
    md += '\n';

    if (data.profile.summary) {
      md += `## About\n\n${data.profile.summary}\n\n`;
    }

    // Experience
    if (sections.experience && data.experience.length) {
      md += '## Experience\n\n';
      data.experience.forEach(item => {
        md += `### ${item.title} at ${item.company}\n`;
        md += `*${item.startDate} — ${item.endDate}${item.location ? ' · ' + item.location : ''}*\n\n`;
        if (item.description) {
          md += item.description.replace(/<br>/g, '\n') + '\n\n';
        }
      });
    }

    // Education
    if (sections.education && data.education.length) {
      md += '## Education\n\n';
      data.education.forEach(item => {
        md += `### ${item.school}\n`;
        md += `*${item.degree || ''}${item.field ? ' in ' + item.field : ''} — ${item.startDate} — ${item.endDate}*\n\n`;
      });
    }

    // Skills
    if (sections.skills && data.skills.length) {
      md += '## Skills\n\n';
      md += data.skills.map(s => `\`${s}\``).join(' ') + '\n\n';
    }

    // Projects
    if (sections.projects && data.projects.length) {
      md += '## Projects\n\n';
      data.projects.forEach(item => {
        md += `### ${item.title}\n`;
        if (item.description) md += item.description.replace(/<br>/g, '\n') + '\n';
        if (item.url) md += `[View Project](${item.url})\n`;
        md += '\n';
      });
    }

    // Certifications
    if (sections.certifications && data.certifications.length) {
      md += '## Certifications\n\n';
      data.certifications.forEach(item => {
        md += `- **${item.name}**${item.authority ? ' — ' + item.authority : ''}${item.date ? ' (' + item.date + ')' : ''}\n`;
      });
      md += '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${filename()}_resume.md`);
  });

  // ===== DOWNLOAD JSON =====
  downloadJson.addEventListener('click', () => {
    if (!parsedData) return;
    downloadMenu.hidden = true;

    const data = getUpdatedData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${filename()}_resume.json`);
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

  function filename() {
    const name = (document.getElementById('field-name').value || 'resume');
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

})();
