export interface ScreeningCriteria {
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  passThreshold: number; // 0-100 percentage
}

export type ScreeningMode = 'keyword' | 'ai';

export interface ResumeResult {
  fileName: string;
  fileData: Uint8Array;
  candidateName: string;
  extractedText: string;
  skillsFound: string[];
  skillsMissing: string[];
  preferredFound: string[];
  experienceYears: number | null;
  score: number; // 0-100
  passed: boolean;
  manualOverride: boolean; // interviewer manually toggled pass/fail
  textQuality: 'good' | 'poor' | 'unknown'; // how reliable is the extracted text
  screeningMode: ScreeningMode;
  aiSummary?: string;
  aiConfidence?: number; // 0-100
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  requiredSkills: ['Java', 'Spring Boot', 'Angular', 'REST API', 'SQL'],
  preferredSkills: ['Microservices', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'MongoDB', 'Kafka', 'React'],
  minExperienceYears: 3,
  passThreshold: 60
};
