import { Injectable } from '@angular/core';
import { Candidate } from '../models/candidate.model';
import { CandidateQuestion } from '../models/question.model';
import { QuestionBankService } from './question-bank.service';
import { TemplateService } from './template.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private readonly STORAGE_KEY = 'candidates';

  constructor(private questionBank: QuestionBankService, private auth: AuthService, private templateService: TemplateService) {}

  private getAllRaw(): Candidate[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getAllCandidates(): Candidate[] {
    const user = this.auth.getUser();
    if (!user) return [];
    const all = this.getAllRaw();
    // Admin sees all candidates, interviewers see only their own
    if (user.role === 'admin') return all;
    return all.filter(c => c.interviewerUsername === user.username);
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.getAllRaw().find(c => c.id === id);
  }

  createCandidate(name: string, experience: number, category?: string): Candidate {
    const usedIds = this.questionBank.getAllUsedQuestionIds();
    const questions = this.questionBank.getQuestionsForCandidate(experience, usedIds, category);
    const user = this.auth.getUser();

    const candidateQuestions: CandidateQuestion[] = questions.map(q => ({
      ...q,
      isCorrect: null,
      rating: null,
      notes: ''
    }));

    const candidate: Candidate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      experience,
      interviewDate: new Date().toISOString(),
      status: 'in-progress',
      questions: candidateQuestions,
      overallNotes: '',
      overallRating: null,
      interviewerUsername: user?.username ?? 'unknown',
    };

    const all = this.getAllRaw();
    all.push(candidate);
    this.save(all);
    return candidate;
  }

  createFromTemplate(name: string, experience: number, templateId: string): Candidate {
    const template = this.templateService.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    const user = this.auth.getUser();

    const candidateQuestions: CandidateQuestion[] = template.questions.map(q => ({
      id: q.id,
      category: q.category as CandidateQuestion['category'],
      difficulty: q.difficulty,
      question: q.question,
      answer: q.answer,
      experienceRange: experience <= 5 ? '3-5' : '5-8',
      isCorrect: null,
      rating: null,
      notes: ''
    }));

    const candidate: Candidate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      experience,
      interviewDate: new Date().toISOString(),
      status: 'in-progress',
      questions: candidateQuestions,
      overallNotes: '',
      overallRating: null,
      interviewerUsername: user?.username ?? 'unknown',
    };

    const all = this.getAllRaw();
    all.push(candidate);
    this.save(all);
    return candidate;
  }

  updateCandidate(candidate: Candidate): void {
    const all = this.getAllRaw();
    const idx = all.findIndex(c => c.id === candidate.id);
    if (idx !== -1) {
      all[idx] = candidate;
      this.save(all);
    }
  }

  completeInterview(id: string): Candidate | undefined {
    const all = this.getAllRaw();
    const candidate = all.find(c => c.id === id);
    if (candidate) {
      const rating = candidate.overallRating ?? 0;
      candidate.score = rating;
      candidate.totalQuestions = 5;
      candidate.status = 'completed';
      this.save(all);
    }
    return candidate;
  }

  deleteCandidate(id: string): void {
    const all = this.getAllRaw().filter(c => c.id !== id);
    this.save(all);
  }

  clearMyCandidates(): void {
    const user = this.auth.getUser();
    if (!user) return;
    const all = this.getAllRaw().filter(c =>
      c.interviewerUsername && c.interviewerUsername !== 'unknown' && c.interviewerUsername !== user.username
    );
    this.save(all);
  }

  private save(candidates: Candidate[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(candidates));
  }
}
