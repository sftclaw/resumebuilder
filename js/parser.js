/**
 * LinkedIn Data Parser
 * Parses LinkedIn data export ZIP files entirely client-side
 */
const LinkedInParser = {
  
  /**
   * Parse a LinkedIn ZIP file and extract all profile data
   */
  async parse(zipFile) {
    const zip = await JSZip.loadAsync(zipFile);
    const data = {
      profile: {},
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      courses: []
    };

    // Helper to read a CSV file from the zip
    const readCSV = async (filename) => {
      const file = zip.file(new RegExp(filename, 'i'))[0];
      if (!file) return null;
      const text = await file.async('text');
      return this.parseCSV(text);
    };

    // Helper to read Profile.json
    const readJSON = async (filename) => {
      const file = zip.file(new RegExp(filename, 'i'))[0];
      if (!file) return null;
      const text = await file.async('text');
      try { return JSON.parse(text); } catch { return null; }
    };

    // Parse Profile
    const profileData = await readJSON('Profile');
    if (profileData) {
      data.profile = this.parseProfileJSON(profileData);
    } else {
      const profileCsv = await readCSV('Profile');
      if (profileCsv && profileCsv.length > 1) {
        data.profile = this.parseProfileCSV(profileCsv);
      }
    }

    // Parse Positions (Experience)
    const positions = await readCSV('Positions');
    if (positions) {
      data.experience = this.parsePositions(positions);
    }

    // Parse Education
    const education = await readCSV('Education');
    if (education) {
      data.education = this.parseEducation(education);
    }

    // Parse Skills
    const skills = await readCSV('Skills');
    if (skills) {
      data.skills = this.parseSkills(skills);
    }

    // Parse Projects
    const projects = await readCSV('Projects');
    if (projects) {
      data.projects = this.parseProjects(projects);
    }

    // Parse Certifications
    const certs = await readCSV('Certifications');
    if (certs) {
      data.certifications = this.parseCertifications(certs);
    }

    // Parse Courses
    const courses = await readCSV('Courses');
    if (courses) {
      data.courses = this.parseCourses(courses);
    }

    return data;
  },

  /**
   * Simple CSV parser
   */
  parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = parseLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
  },

  /**
   * Parse Profile JSON (newer LinkedIn exports)
   */
  parseProfileJSON(json) {
    const profile = {};
    
    // Navigate the nested structure
    const firstName = this.getNestedValue(json, ['firstName']) || '';
    const lastName = this.getNestedValue(json, ['lastName']) || '';
    profile.name = `${firstName} ${lastName}`.trim();
    
    profile.headline = this.getNestedValue(json, ['headline']) || '';
    profile.summary = this.getNestedValue(json, ['summary']) || '';
    profile.location = this.getLocation(json) || '';
    profile.email = this.getNestedValue(json, ['emailAddress']) || '';
    profile.website = this.getNestedValue(json, ['websites', 0, 'url']) || '';
    profile.industry = this.getNestedValue(json, ['industryName']) || '';

    return profile;
  },

  /**
   * Get nested value safely
   */
  getNestedValue(obj, path) {
    let current = obj;
    for (const key of path) {
      if (current == null) return null;
      current = current[key];
    }
    return current;
  },

  /**
   * Extract location from JSON
   */
  getLocation(json) {
    const city = this.getNestedValue(json, ['location', 'name']) || '';
    const country = this.getNestedValue(json, ['location', 'country']) || '';
    return [city, country].filter(Boolean).join(', ');
  },

  /**
   * Parse Profile CSV (older exports)
   */
  parseProfileCSV(rows) {
    const row = rows[0];
    return {
      name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
      headline: row['Headline'] || '',
      summary: row['Summary'] || '',
      location: [row['Geo Location'], row['Country']].filter(Boolean).join(', '),
      email: row['Email Address'] || '',
      industry: row['Industry'] || ''
    };
  },

  /**
   * Parse Positions/Experience
   */
  parsePositions(rows) {
    return rows
      .filter(r => r['Company Name'] || r['Title'])
      .map(r => ({
        title: r['Title'] || '',
        company: r['Company Name'] || '',
        location: r['Location'] || '',
        description: (r['Description'] || '').replace(/\n/g, '<br>'),
        startDate: this.formatLinkedInDate(r['Started On'] || ''),
        endDate: r['Finished On'] ? this.formatLinkedInDate(r['Finished On']) : 'Present',
        duration: this.calcDuration(r['Started On'], r['Finished On'])
      }));
  },

  /**
   * Parse Education
   */
  parseEducation(rows) {
    return rows
      .filter(r => r['School Name'])
      .map(r => ({
        school: r['School Name'] || '',
        degree: r['Degree Name'] || '',
        field: r['Notes'] || r['Activities and Societies'] || '',
        startDate: this.formatLinkedInDate(r['Start Date'] || ''),
        endDate: this.formatLinkedInDate(r['End Date'] || ''),
        description: (r['Notes'] || '').replace(/\n/g, '<br>')
      }));
  },

  /**
   * Parse Skills
   */
  parseSkills(rows) {
    return rows.map(r => r['Name'] || r['Skill'] || Object.values(r)[0] || '').filter(Boolean);
  },

  /**
   * Parse Projects
   */
  parseProjects(rows) {
    return rows.map(r => ({
      title: r['Title'] || r['Name'] || '',
      description: (r['Description'] || '').replace(/\n/g, '<br>'),
      url: r['URL'] || ''
    }));
  },

  /**
   * Parse Certifications
   */
  parseCertifications(rows) {
    return rows.map(r => ({
      name: r['Name'] || '',
      authority: r['Authority'] || '',
      date: this.formatLinkedInDate(r['Start Date'] || ''),
      url: r['Url'] || ''
    }));
  },

  /**
   * Parse Courses
   */
  parseCourses(rows) {
    return rows.map(r => ({
      name: r['Name'] || '',
      number: r['Number'] || ''
    }));
  },

  /**
   * Format LinkedIn date to readable format
   */
  formatLinkedInDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  },

  /**
   * Calculate duration between two dates
   */
  calcDuration(start, end) {
    if (!start) return '';
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : new Date();
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
      const years = Math.floor(months / 12);
      const remainMonths = months % 12;
      const parts = [];
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
      if (remainMonths > 0) parts.push(`${remainMonths} mo${remainMonths > 1 ? 's' : ''}`);
      return parts.join(' ') || '< 1 mo';
    } catch {
      return '';
    }
  }
};
