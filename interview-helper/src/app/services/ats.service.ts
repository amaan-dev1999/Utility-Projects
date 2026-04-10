import { Injectable } from '@angular/core';
import { ScreeningCriteria, ResumeResult } from '../models/ats.model';
import JSZip from 'jszip';

@Injectable({ providedIn: 'root' })
export class AtsService {

  async extractTextFromFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return this.extractPdfText(file);
    } else if (ext === 'docx') {
      return this.extractDocxText(file);
    } else if (ext === 'txt') {
      return file.text();
    }
    throw new Error(`Unsupported file type: .${ext}`);
  }

  private async extractPdfText(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist' as any);
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let lastX = 0;
      let lastY = 0;
      let lastFontSize = 0;
      const parts: string[] = [];
      for (const item of content.items as any[]) {
        if (!item.str) continue;
        const x = item.transform?.[4] ?? 0;
        const y = item.transform?.[5] ?? 0;
        const fontSize = item.transform?.[0] ?? 12;
        // New line if Y changes significantly
        if (parts.length > 0 && Math.abs(y - lastY) > 3) {
          parts.push('\n');
        } else if (parts.length > 0) {
          const gap = x - lastX;
          // Use font size to determine what counts as a "space" gap
          const spaceThreshold = Math.max(fontSize * 0.3, 3);
          const wordGapThreshold = Math.max(fontSize * 0.8, 8);
          if (gap > wordGapThreshold) {
            parts.push(' ');
          } else if (gap < -1) {
            // Overlapping items (PDF rendering artifact) — no separator
          } else if (gap > spaceThreshold && item.str.length === 1) {
            // Small gap but single char — likely a letter, don't add space
          } else if (gap > wordGapThreshold) {
            parts.push(' ');
          }
        }
        parts.push(item.str);
        lastX = x + (item.width ?? item.str.length * (fontSize * 0.6));
        lastY = y;
        lastFontSize = fontSize;
      }
      pages.push(parts.join(''));
    }
    return pages.join('\n');
  }

  private async extractDocxText(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  screenResume(text: string, criteria: ScreeningCriteria): { skillsFound: string[]; skillsMissing: string[]; preferredFound: string[]; experienceYears: number | null; score: number; textQuality: 'good' | 'poor' | 'unknown' } {
    const cleaned = this.normalizeText(text);
    const textQuality = this.assessTextQuality(cleaned);

    // Check required skills with fuzzy matching
    const skillsFound: string[] = [];
    const skillsMissing: string[] = [];
    for (const skill of criteria.requiredSkills) {
      if (this.matchSkill(skill, cleaned)) {
        skillsFound.push(skill);
      } else {
        skillsMissing.push(skill);
      }
    }

    // Check preferred skills with fuzzy matching
    const preferredFound: string[] = [];
    for (const skill of criteria.preferredSkills) {
      if (this.matchSkill(skill, cleaned)) {
        preferredFound.push(skill);
      }
    }

    // Extract experience
    const experienceYears = this.extractExperience(text) ?? this.extractExperience(cleaned);

    // Calculate score
    const requiredWeight = 60;
    const preferredWeight = 20;
    const experienceWeight = 20;

    const requiredScore = criteria.requiredSkills.length > 0
      ? (skillsFound.length / criteria.requiredSkills.length) * requiredWeight
      : requiredWeight;

    const preferredScore = criteria.preferredSkills.length > 0
      ? (preferredFound.length / criteria.preferredSkills.length) * preferredWeight
      : 0;

    let expScore = 0;
    if (experienceYears !== null) {
      if (experienceYears >= criteria.minExperienceYears) {
        expScore = experienceWeight;
      } else if (experienceYears >= criteria.minExperienceYears - 1) {
        expScore = experienceWeight * 0.5;
      }
    }

    const score = Math.round(requiredScore + preferredScore + expScore);

    return { skillsFound, skillsMissing, preferredFound, experienceYears, score, textQuality };
  }

  /** Normalize garbled PDF text — fix ligatures, encoding issues, extra whitespace */
  private normalizeText(text: string): string {
    let result = text
      // Fix common PDF ligatures
      .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl')
      // Fix bullet points and special chars
      .replace(/[•◦▪▸►·●○■□▶→–—]/g, ' ')
      // Fix zero-width and non-breaking spaces
      .replace(/[\u200B\u200C\u200D\uFEFF\u200E\u200F]/g, '')
      .replace(/\u00A0/g, ' ')
      // Fix soft hyphens that split words
      .replace(/\u00AD/g, '')
      // Fix common encoding artifacts
      .replace(/â€™/g, "'").replace(/â€"/g, '-').replace(/â€œ/g, '"').replace(/â€\x9D/g, '"')
      // Remove control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      // Collapse multiple spaces/newlines
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Fix scattered single-character sequences (e.g., "J a v a" → "Java", "M u l t i t h r e a d i n g" → "Multithreading")
    // Matches any sequence of 3+ single letters separated by single spaces
    result = result.replace(/\b([A-Za-z]) ((?:[A-Za-z] ){2,}[A-Za-z])\b/g, (match) => {
      return match.replace(/ /g, '');
    });

    return result;
  }

  /** Check if extracted text is usable or garbled */
  private assessTextQuality(text: string): 'good' | 'poor' | 'unknown' {
    if (text.length < 50) return 'poor';

    // Count readable words vs garbage
    const words = text.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 10) return 'poor';

    // Check ratio of words that look like real English
    const readableWords = words.filter(w => /^[a-zA-Z0-9.,'@/\-+#()]+$/.test(w));
    const ratio = readableWords.length / words.length;

    if (ratio >= 0.7) return 'good';
    if (ratio >= 0.4) return 'unknown';
    return 'poor';
  }

  /** Match a skill using exact variants + fuzzy n-gram matching */
  private matchSkill(skill: string, text: string): boolean {
    const normalized = text.toLowerCase();
    const variants = this.getSkillVariants(skill);

    // 1. Exact variant match
    if (variants.some(v => normalized.includes(v.toLowerCase()))) {
      return true;
    }

    // 2. Fuzzy match — check if skill appears with minor corruption (e.g., "Sp ring Boot" or "J a v a")
    const skillLower = skill.toLowerCase();

    // Try matching with spaces stripped (handles split words like "Angu lar")
    const noSpaceText = normalized.replace(/\s/g, '');
    const noSpaceSkill = skillLower.replace(/\s/g, '');
    if (noSpaceSkill.length >= 3 && noSpaceText.includes(noSpaceSkill)) {
      return true;
    }

    // 3. Trigram similarity — catches typos and partial corruption
    for (const variant of variants) {
      const similarity = this.trigramSimilarity(variant.toLowerCase(), normalized);
      if (similarity > 0.6) return true;
    }

    return false;
  }

  /** Calculate trigram similarity — checks if any window of text contains enough trigrams of the query */
  private trigramSimilarity(query: string, text: string): number {
    if (query.length < 3) return text.includes(query) ? 1 : 0;

    const qTrigrams = new Set<string>();
    for (let i = 0; i <= query.length - 3; i++) {
      qTrigrams.add(query.substring(i, i + 3));
    }

    // Check a sliding window around the query length
    const windowSize = Math.max(query.length * 2, 20);
    let bestMatch = 0;

    for (let start = 0; start < text.length - 3; start += 5) {
      const window = text.substring(start, start + windowSize);
      let matches = 0;
      for (const tri of qTrigrams) {
        if (window.includes(tri)) matches++;
      }
      const score = matches / qTrigrams.size;
      bestMatch = Math.max(bestMatch, score);
      if (bestMatch > 0.6) return bestMatch; // Early exit
    }
    return bestMatch;
  }

  private getSkillVariants(skill: string): string[] {
    const map: Record<string, string[]> = {
      'Java': ['java', 'core java', 'j2ee', 'j2se', 'java8', 'java11', 'java17', 'java 8', 'java 11', 'java 17', 'java se', 'java ee'],
      'Spring Boot': ['spring boot', 'springboot', 'spring-boot', 'spring framework'],
      'Angular': ['angular', 'angularjs', 'angular.js'],
      'REST API': ['rest api', 'restful', 'rest services', 'web services', 'web api'],
      'SQL': ['sql', 'mysql', 'postgresql', 'oracle db', 'oracle database', 'mssql', 'sql server'],
      'Microservices': ['microservices', 'micro services', 'micro-services'],
      'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
      'Azure': ['azure', 'microsoft azure'],
      'Docker': ['docker', 'containerization'],
      'Kubernetes': ['kubernetes', 'k8s'],
      'CI/CD': ['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci', 'continuous integration'],
      'Git': ['git', 'github', 'gitlab', 'bitbucket'],
      'MongoDB': ['mongodb', 'mongo db', 'nosql'],
      'Kafka': ['kafka', 'apache kafka', 'message queue'],
      'React': ['react', 'reactjs', 'react.js'],
      'Multithreading': ['multithreading', 'multi-threading', 'multi threading', 'concurrent programming', 'thread pool', 'threads'],
      'JavaScript': ['javascript', 'js', 'ecmascript'],
      'TypeScript': ['typescript', 'ts'],
      'Python': ['python'],
      'Node.js': ['node.js', 'nodejs', 'node js'],
      'Hibernate': ['hibernate', 'jpa', 'orm'],
      'Redis': ['redis', 'caching'],
      'HTML': ['html', 'html5'],
      'CSS': ['css', 'css3', 'scss', 'sass'],
    };
    return map[skill] ?? [skill];
  }

  private extractExperience(text: string): number | null {
    const patterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/gi,
      /experience\s*(?:of)?\s*(\d+)\+?\s*(?:years?|yrs?)/gi,
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:in\s+(?:software|IT|development|programming))/gi,
    ];
    let maxYears = 0;
    let found = false;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const years = parseInt(match[1], 10);
        if (years > 0 && years < 50) {
          maxYears = Math.max(maxYears, years);
          found = true;
        }
      }
    }
    return found ? maxYears : null;
  }

  extractCandidateName(text: string, fileName: string): string {
    // Try to get name from first non-empty line (common resume format)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/[^a-zA-Z\s.]/g, '').trim();
      // If the first line looks like a name (2-4 words, only letters)
      const words = firstLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Za-z.]+$/.test(w))) {
        return firstLine;
      }
    }
    // Fallback to filename without extension
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }

  async extractFilesFromZip(zipFile: File): Promise<{ name: string; data: Uint8Array }[]> {
    const zip = await JSZip.loadAsync(zipFile);
    const files: { name: string; data: Uint8Array }[] = [];
    const validExts = ['pdf', 'docx', 'txt'];

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.split('.').pop()?.toLowerCase();
      if (!ext || !validExts.includes(ext)) continue;
      // Skip macOS resource fork files
      if (path.includes('__MACOSX') || path.startsWith('.')) continue;
      const data = await entry.async('uint8array');
      const name = path.split('/').pop() || path;
      files.push({ name, data });
    }
    return files;
  }

  async createPassedZip(results: ResumeResult[]): Promise<Blob> {
    const zip = new JSZip();
    const passed = results.filter(r => r.passed);
    for (const r of passed) {
      zip.file(r.fileName, r.fileData);
    }
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }
}
