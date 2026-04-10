import { CandidateQuestion } from './question.model';

export interface EvaluationRatings {
  technicalSkills: number | null;   // 0-5
  confidence: number | null;        // 0-5
  behaviour: number | null;         // 0-5
  problemSolving: number | null;    // 0-5
  communication: number | null;     // 0-5
}

export interface Candidate {
  id: string;
  name: string;
  experience: number;
  interviewDate: string;
  status: 'in-progress' | 'completed';
  questions: CandidateQuestion[];
  overallNotes: string;
  overallRating: number | null; // 0-5 performance rating
  score?: number;
  totalQuestions?: number;
  interviewerUsername: string;
  evaluation?: EvaluationRatings;
  evaluationFeedback?: string;
  interviewerName?: string;
}
