export interface Question {
  id: number;
  category: 'Core Java' | 'Angular' | 'Spring Boot' | 'Cloud';
  difficulty: 'Medium' | 'Hard';
  question: string;
  answer: string;
  experienceRange: string; // e.g. '3-5' or '5-8'
}

export interface CandidateQuestion extends Question {
  isCorrect: boolean | null; // legacy, kept for backward compat
  rating: number | null;     // 0-10 performance rating, null = not evaluated
  notes: string;
}
