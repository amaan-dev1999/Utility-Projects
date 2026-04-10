import { Injectable } from '@angular/core';
import { ScreeningCriteria } from '../models/ats.model';

export interface AiScreeningResult {
  skillsFound: string[];
  skillsMissing: string[];
  preferredFound: string[];
  experienceYears: number | null;
  score: number;
  summary: string;
  textQuality: 'good' | 'poor' | 'unknown';
}

@Injectable({ providedIn: 'root' })
export class AiScreeningService {
  private pipeline: any = null;
  private loading = false;
  private loadPromise: Promise<void> | null = null;

  modelStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  modelProgress = 0;

  async loadModel(): Promise<void> {
    if (this.pipeline) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._loadModel();
    return this.loadPromise;
  }

  private async _loadModel(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.modelStatus = 'loading';
    this.modelProgress = 0;

    try {
      const { pipeline, env } = await import('@huggingface/transformers' as any);
      // Use browser cache, no Node.js backends
      env.allowLocalModels = false;

      this.pipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (p: any) => {
            if (p.status === 'progress' && p.total) {
              this.modelProgress = Math.round((p.loaded / p.total) * 100);
            }
          }
        }
      );
      this.modelStatus = 'ready';
      this.modelProgress = 100;
    } catch (e) {
      console.error('Failed to load AI model:', e);
      this.modelStatus = 'error';
      this.loading = false;
      this.loadPromise = null;
      throw e;
    }
  }

  async screenResume(text: string, criteria: ScreeningCriteria): Promise<AiScreeningResult> {
    if (!this.pipeline) throw new Error('Model not loaded');

    const textQuality = this.assessTextQuality(text);

    // Split resume into meaningful chunks for better matching
    const resumeChunks = this.chunkText(text, 200);

    // Get embeddings for all resume chunks at once
    const chunkEmbeddings = await Promise.all(
      resumeChunks.map(chunk => this.getEmbedding(chunk))
    );

    // Check required skills
    const skillsFound: string[] = [];
    const skillsMissing: string[] = [];
    for (const skill of criteria.requiredSkills) {
      const found = await this.semanticMatch(skill, chunkEmbeddings, resumeChunks, 0.35);
      if (found) {
        skillsFound.push(skill);
      } else {
        skillsMissing.push(skill);
      }
    }

    // Check preferred skills
    const preferredFound: string[] = [];
    for (const skill of criteria.preferredSkills) {
      const found = await this.semanticMatch(skill, chunkEmbeddings, resumeChunks, 0.35);
      if (found) {
        preferredFound.push(skill);
      }
    }

    // Extract experience
    const experienceYears = this.extractExperience(text);

    // Calculate score (same weighting as keyword-based)
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

    // Generate summary
    const summary = this.generateSummary(skillsFound, skillsMissing, preferredFound, experienceYears, score);

    return { skillsFound, skillsMissing, preferredFound, experienceYears, score, summary, textQuality };
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array).slice(0, 384);
  }

  private async semanticMatch(
    skill: string,
    chunkEmbeddings: number[][],
    _chunks: string[],
    threshold: number
  ): Promise<boolean> {
    // Create skill phrases for better matching
    const skillPhrases = [
      skill,
      `Experience with ${skill}`,
      `${skill} development`,
      `Worked on ${skill}`,
    ];

    for (const phrase of skillPhrases) {
      const skillEmb = await this.getEmbedding(phrase);
      for (const chunkEmb of chunkEmbeddings) {
        const similarity = this.cosineSimilarity(skillEmb, chunkEmb);
        if (similarity >= threshold) return true;
      }
    }
    return false;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private chunkText(text: string, maxWords: number): string[] {
    const cleaned = text
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[•◦▪▸►·●○]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split by sentences or newlines
    const sentences = cleaned.split(/[.\n]+/).filter(s => s.trim().length > 10);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const words = (current + ' ' + sentence).trim().split(/\s+/);
      if (words.length > maxWords && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = (current + ' ' + sentence).trim();
      }
    }
    if (current.trim()) chunks.push(current.trim());

    // If no good chunks, fall back to word-based splitting
    if (chunks.length === 0) {
      const words = cleaned.split(/\s+/);
      for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '));
      }
    }

    return chunks.length > 0 ? chunks : [cleaned.substring(0, 1000)];
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

    // Try date-range based experience extraction
    if (!found) {
      const dateRanges = text.matchAll(
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})|present|current|now|till\s*date)/gi
      );
      let earliest = 9999, latest = 0;
      for (const m of dateRanges) {
        const startYear = parseInt(m[1], 10);
        const endYear = m[2] ? parseInt(m[2], 10) : new Date().getFullYear();
        if (startYear > 1980 && startYear < 2030) earliest = Math.min(earliest, startYear);
        if (endYear > 1980 && endYear <= 2030) latest = Math.max(latest, endYear);
      }
      if (earliest < 9999 && latest > 0 && latest >= earliest) {
        return latest - earliest;
      }
    }

    return found ? maxYears : null;
  }

  private assessTextQuality(text: string): 'good' | 'poor' | 'unknown' {
    if (text.length < 50) return 'poor';
    const words = text.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 10) return 'poor';
    const readable = words.filter(w => /^[a-zA-Z0-9.,'@/\-+#()]+$/.test(w));
    const ratio = readable.length / words.length;
    if (ratio >= 0.7) return 'good';
    if (ratio >= 0.4) return 'unknown';
    return 'poor';
  }

  private generateSummary(
    skillsFound: string[], skillsMissing: string[], preferredFound: string[],
    experienceYears: number | null, score: number
  ): string {
    const parts: string[] = [];

    if (experienceYears !== null) {
      parts.push(`${experienceYears} years of experience.`);
    }

    if (skillsFound.length > 0) {
      parts.push(`Has ${skillsFound.join(', ')}.`);
    }

    if (skillsMissing.length > 0) {
      parts.push(`Missing ${skillsMissing.join(', ')}.`);
    }

    if (preferredFound.length > 0) {
      parts.push(`Also knows ${preferredFound.join(', ')}.`);
    }

    const verdict = score >= 70 ? 'Strong candidate.' : score >= 50 ? 'Average candidate.' : 'Weak match.';
    parts.push(verdict);

    return parts.join(' ');
  }
}
