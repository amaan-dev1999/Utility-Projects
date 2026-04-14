export interface ScreeningCriteria {
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  passThreshold: number; // 0-100 percentage
}

export type ScreeningMode = 'keyword' | 'ai';

export type AgentId = 'parser' | 'evaluator' | 'summarizer' | 'decision';
export type AgentStatus = 'idle' | 'working' | 'done' | 'error';

export interface AgentLog {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface AgentState {
  id: AgentId;
  name: string;
  icon: string;
  status: AgentStatus;
  progress: number; // 0-100
  logs: AgentLog[];
  result?: string; // brief result text
}

export interface ResumeResult {
  fileName: string;
  fileData: Uint8Array;
  candidateName: string;
  extractedText: string;
  cleanedText: string;
  skillsFound: string[];
  skillsMissing: string[];
  preferredFound: string[];
  experienceYears: number | null;
  score: number; // 0-100
  passed: boolean;
  manualOverride: boolean;
  textQuality: 'good' | 'poor' | 'unknown';
  screeningMode: ScreeningMode;
  aiSummary?: string;
  aiConfidence?: number; // 0-100
  decisionReason?: string;
  agents: AgentState[];
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  _showText?: boolean;
}

export function createAgentStates(): AgentState[] {
  return [
    { id: 'parser', name: 'Parser Agent', icon: '📄', status: 'idle', progress: 0, logs: [] },
    { id: 'evaluator', name: 'Evaluator Agent', icon: '🔍', status: 'idle', progress: 0, logs: [] },
    { id: 'summarizer', name: 'Summarizer Agent', icon: '📝', status: 'idle', progress: 0, logs: [] },
    { id: 'decision', name: 'Decision Agent', icon: '⚖️', status: 'idle', progress: 0, logs: [] },
  ];
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  requiredSkills: ['Java', 'Spring Boot', 'Angular', 'REST API', 'SQL'],
  preferredSkills: ['Microservices', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'MongoDB', 'Kafka', 'React'],
  minExperienceYears: 3,
  passThreshold: 60
};
