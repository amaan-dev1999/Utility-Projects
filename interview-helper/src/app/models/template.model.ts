export interface TemplateQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  difficulty: 'Medium' | 'Hard';
}

export interface InterviewTemplate {
  id: string;
  name: string;
  createdBy: string;
  categories: string[];
  questions: TemplateQuestion[];
  createdDate: string;
}
