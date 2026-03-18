/**
 * Resume Renderer
 * Generates animated HTML resume from parsed LinkedIn data
 */
const ResumeRenderer = {
  
  themes: ['dark', 'light', 'minimal', 'bold'],
  currentTheme: 'dark',

  /**
   * Render the full resume HTML (standalone, with animations)
   */
  render(data, options = {}) {
    const theme = options.theme || this.currentTheme;
    const sections = options.sections || {};
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.esc(data.profile.name || 'Resume')} — Resume</title>
  <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>${this.getExportStyles(theme)}</style>
</head>
<body class="theme-${theme}">
  <div class="resume">
    ${this.renderHero(data.profile, true)}
    ${sections.experience !== false && data.experience.length ? this.renderExperience(data.experience, true) : ''}
    ${sections.education !== false && data.education.length ? this.renderEducation(data.education, true) : ''}
    ${sections.skills !== false && data.skills.length ? this.renderSkills(data.skills, true) : ''}
    ${sections.projects !== false && data.projects.length ? this.renderProjects(data.projects, true) : ''}
    ${sections.certifications !== false && data.certifications.length ? this.renderCertifications(data.certifications, true) : ''}
  </div>
  <script src="https://unpkg.com/aos@2.3.4/dist/aos.js"><\/script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true, offset: 50 });
    });
  <\/script>
</body>
</html>`;
    
    return html;
  },

  /**
   * Render preview (for the editor — no animations, just show everything)
   */
  renderPreview(data, options = {}) {
    const theme = options.theme || this.currentTheme;
    const sections = options.sections || {};
    
    return `
      <div class="resume">
        ${this.renderHero(data.profile, false)}
        ${sections.experience !== false && data.experience.length ? this.renderExperience(data.experience, false) : ''}
        ${sections.education !== false && data.education.length ? this.renderEducation(data.education, false) : ''}
        ${sections.skills !== false && data.skills.length ? this.renderSkills(data.skills, false) : ''}
        ${sections.projects !== false && data.projects.length ? this.renderProjects(data.projects, false) : ''}
        ${sections.certifications !== false && data.certifications.length ? this.renderCertifications(data.certifications, false) : ''}
      </div>
    `;
  },

  /**
   * Render Hero section
   */
  renderHero(profile, animated) {
    const a = animated ? 'data-aos="fade-up"' : '';
    const d = (delay) => animated ? `data-aos="fade-up" data-aos-delay="${delay}"` : '';
    
    return `
      <div class="resume-hero" ${a}>
        <h1 ${d(100)}>${this.esc(profile.name || 'Your Name')}</h1>
        ${profile.headline ? `<div class="headline" ${d(200)}>${this.esc(profile.headline)}</div>` : ''}
        ${profile.location ? `<div class="location" ${d(300)}>📍 ${this.esc(profile.location)}</div>` : ''}
        ${profile.summary ? `<div class="about" ${d(400)}>${this.esc(profile.summary)}</div>` : ''}
        <div class="resume-contact" ${d(500)}>
          ${profile.email ? `<a href="mailto:${this.esc(profile.email)}">📧 ${this.esc(profile.email)}</a>` : ''}
          ${profile.website ? `<a href="${this.esc(profile.website)}" target="_blank">🌐 Portfolio</a>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render Experience section
   */
  renderExperience(items, animated) {
    return `
      <div class="resume-section" ${animated ? 'data-aos="fade-up"' : ''}>
        <h2>Experience</h2>
        ${items.map((item, i) => `
          <div class="resume-item" ${animated ? `data-aos="fade-up" data-aos-delay="${i * 100}"` : ''}>
            <div class="resume-item-header">
              <span class="resume-item-title">${this.esc(item.title)}</span>
              <span class="resume-item-date">${this.esc(item.startDate)} — ${this.esc(item.endDate)}</span>
            </div>
            <div class="resume-item-company">${this.esc(item.company)}${item.location ? ` · ${this.esc(item.location)}` : ''}</div>
            ${item.description ? `<div class="resume-item-description">${item.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render Education section
   */
  renderEducation(items, animated) {
    return `
      <div class="resume-section" ${animated ? 'data-aos="fade-up"' : ''}>
        <h2>Education</h2>
        ${items.map((item, i) => `
          <div class="resume-item" ${animated ? `data-aos="fade-up" data-aos-delay="${i * 100}"` : ''}>
            <div class="resume-item-header">
              <span class="resume-item-title">${this.esc(item.school)}</span>
              <span class="resume-item-date">${this.esc(item.startDate)} — ${this.esc(item.endDate)}</span>
            </div>
            ${item.degree ? `<div class="resume-item-company">${this.esc(item.degree)}${item.field ? ` in ${this.esc(item.field)}` : ''}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render Skills section
   */
  renderSkills(skills, animated) {
    return `
      <div class="resume-section" ${animated ? 'data-aos="fade-up"' : ''}>
        <h2>Skills</h2>
        <div class="skills-grid">
          ${skills.map((skill, i) => `
            <span class="skill-tag" ${animated ? `data-aos="zoom-in" data-aos-delay="${i * 30}"` : ''}>${this.esc(skill)}</span>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render Projects section
   */
  renderProjects(items, animated) {
    return `
      <div class="resume-section" ${animated ? 'data-aos="fade-up"' : ''}>
        <h2>Projects</h2>
        <div class="projects-grid">
          ${items.map((item, i) => `
            <div class="project-card" ${animated ? `data-aos="fade-up" data-aos-delay="${i * 100}"` : ''}>
              <h3>${this.esc(item.title)}</h3>
              ${item.description ? `<p>${this.esc(item.description)}</p>` : ''}
              ${item.url ? `<div class="project-links"><a href="${this.esc(item.url)}" target="_blank">View Project →</a></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render Certifications section
   */
  renderCertifications(items, animated) {
    return `
      <div class="resume-section" ${animated ? 'data-aos="fade-up"' : ''}>
        <h2>Certifications</h2>
        ${items.map((item, i) => `
          <div class="resume-item" ${animated ? `data-aos="fade-up" data-aos-delay="${i * 100}"` : ''}>
            <div class="resume-item-header">
              <span class="resume-item-title">${this.esc(item.name)}</span>
              <span class="resume-item-date">${this.esc(item.date)}</span>
            </div>
            ${item.authority ? `<div class="resume-item-company">${this.esc(item.authority)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Escape HTML special chars
   */
  esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Get CSS for export (standalone resume)
   */
  getExportStyles(theme) {
    return `
/* ===== ResumeBuilder Export Styles ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;
}
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-main);
  min-height: 100vh;
  margin: 0;
}

/* Theme Variables — Warm Claude-inspired palette */
.theme-dark .resume {
  --bg: #1a1614; --bg-secondary: #241f1c; --text: #f0ebe6; --text-muted: #a09890;
  --accent: #d97757; --accent-light: #e8956e; --border: rgba(255,255,255,0.08);
  --skill-bg: rgba(217, 119, 87, 0.15); --skill-fill: linear-gradient(135deg, #d97757, #c45a3c);
}
.theme-light .resume {
  --bg: #fefcfa; --bg-secondary: #f8f4f0; --text: #2c2420; --text-muted: #8a7e76;
  --accent: #c45a3c; --accent-light: #d97757; --border: rgba(0,0,0,0.1);
  --skill-bg: rgba(196, 90, 60, 0.1); --skill-fill: linear-gradient(135deg, #c45a3c, #d97757);
}
.theme-minimal .resume {
  --bg: #faf8f6; --bg-secondary: #ffffff; --text: #1a1614; --text-muted: #777;
  --accent: #1a1614; --accent-light: #333; --border: #e5ddd8;
  --skill-bg: #f0ebe6; --skill-fill: linear-gradient(90deg, #333, #666);
}
.theme-bold .resume {
  --bg: #0f0c0a; --bg-secondary: #1a1614; --text: #ffffff; --text-muted: #b0a090;
  --accent: #ff7a5a; --accent-light: #ff9980; --border: rgba(255, 122, 90, 0.3);
  --skill-bg: rgba(255, 122, 90, 0.15); --skill-fill: linear-gradient(135deg, #ff7a5a, #ffb088);
}

/* Resume */
.resume {
  font-family: var(--font-main);
  background: var(--bg); color: var(--text);
  max-width: 800px; margin: 0 auto; padding: 0;
  line-height: 1.6;
}

/* Hero */
.resume-hero { padding: 4rem 3rem; position: relative; overflow: hidden; }
.resume-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--skill-fill); }
.resume-hero h1 { font-family: var(--font-display); font-size: 2.8rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--accent); }
.resume-hero .headline { font-size: 1.15rem; color: var(--accent-light); font-weight: 500; margin-bottom: 0.5rem; }
.resume-hero .location { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
.resume-hero .about { font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; max-width: 600px; }
.resume-contact { display: flex; gap: 1.5rem; margin-top: 1.5rem; flex-wrap: wrap; }
.resume-contact a { color: var(--accent); text-decoration: none; font-size: 0.9rem; }

/* Sections */
.resume-section { padding: 2rem 3rem; border-top: 1px solid var(--border); }
.resume-section h2 { font-size: 1.3rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.5rem; color: var(--accent); display: flex; align-items: center; gap: 0.6rem; }
.resume-section h2::before { content: ''; width: 4px; height: 20px; background: var(--skill-fill); border-radius: 2px; }

/* Items */
.resume-item { margin-bottom: 1.5rem; padding-left: 1.2rem; border-left: 2px solid var(--border); position: relative; }
.resume-item::before { content: ''; position: absolute; left: -5px; top: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.resume-item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.3rem; flex-wrap: wrap; gap: 0.5rem; }
.resume-item-title { font-weight: 600; font-size: 1.05rem; }
.resume-item-date { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; }
.resume-item-company { font-size: 0.95rem; color: var(--accent); margin-bottom: 0.5rem; }
.resume-item-description { font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; }

/* Skills */
.skills-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.skill-tag { background: var(--skill-bg); color: var(--accent); padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
.theme-minimal .skill-tag { border: 1px solid var(--border); background: none; color: var(--text); }

/* Projects */
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.project-card { background: var(--bg-secondary); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); transition: transform 0.3s, box-shadow 0.3s; }
.project-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.project-card h3 { font-size: 1rem; margin-bottom: 0.5rem; }
.project-card p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; }
.project-links a { font-size: 0.8rem; color: var(--accent); text-decoration: none; }

@media (max-width: 600px) {
  .resume-hero, .resume-section { padding: 1.5rem; }
  .resume-hero h1 { font-size: 2rem; }
}
    `;
  }
};
