import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CandidateService } from '../../services/candidate.service';
import { QuestionBankService } from '../../services/question-bank.service';
import { AuthService } from '../../services/auth.service';
import { Candidate, EvaluationRatings } from '../../models/candidate.model';
import { CandidateQuestion } from '../../models/question.model';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview.html',
  styleUrl: './interview.scss'
})
export class InterviewComponent implements OnInit {
  candidate: Candidate | null = null;
  activeCategory = 'All';
  expandedId: number | null = null;
  visibleAnswers = new Set<number>();
  showAddPanel = false;
  addCategory = 'Core Java';
  customQuestion = '';
  customAnswer = '';
  allCategories = ['Core Java', 'Angular', 'Spring Boot', 'Cloud'];

  ratingLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  // Evaluation form
  showEvaluation = false;
  evalInterviewerName = '';
  evalRatings: EvaluationRatings = {
    technicalSkills: null,
    confidence: null,
    behaviour: null,
    problemSolving: null,
    communication: null
  };
  evalFeedback = '';
  evalCriteria = [
    { key: 'technicalSkills' as keyof EvaluationRatings, label: 'Technical Skills' },
    { key: 'confidence' as keyof EvaluationRatings, label: 'Confidence' },
    { key: 'behaviour' as keyof EvaluationRatings, label: 'Behaviour' },
    { key: 'problemSolving' as keyof EvaluationRatings, label: 'Problem Solving' },
    { key: 'communication' as keyof EvaluationRatings, label: 'Communication' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateService: CandidateService,
    private questionBank: QuestionBankService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidate = this.candidateService.getCandidateById(id) ?? null;
    }
    if (!this.candidate) {
      this.router.navigate(['/']);
      return;
    }
    this.evalInterviewerName = this.candidate.interviewerName || this.authService.getUser()?.name || '';
    if (this.candidate.evaluation) {
      this.evalRatings = { ...this.candidate.evaluation };
    }
    this.evalFeedback = this.candidate.evaluationFeedback || '';
  }

  get filteredQuestions(): CandidateQuestion[] {
    if (!this.candidate) return [];
    if (this.activeCategory === 'All') return this.candidate.questions;
    return this.candidate.questions.filter(q => q.category === this.activeCategory);
  }

  get categories(): string[] {
    if (!this.candidate) return [];
    const cats = [...new Set(this.candidate.questions.map(q => q.category))];
    return ['All', ...cats];
  }

  getCategoryCount(cat: string): number {
    if (!this.candidate) return 0;
    if (cat === 'All') return this.candidate.questions.length;
    return this.candidate.questions.filter(q => q.category === cat).length;
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
    this.expandedId = null;
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  toggleAnswer(id: number): void {
    if (this.visibleAnswers.has(id)) {
      this.visibleAnswers.delete(id);
    } else {
      this.visibleAnswers.add(id);
    }
  }

  setOverallRating(value: number): void {
    if (!this.candidate) return;
    this.candidate.overallRating = this.candidate.overallRating === value ? null : value;
    this.saveProgress();
  }

  getRatingClass(rating: number | null | undefined): string {
    if (rating === null || rating === undefined) return '';
    if (rating >= 3.5) return 'rating-good';
    if (rating >= 2.5) return 'rating-avg';
    return 'rating-poor';
  }

  saveProgress(): void {
    if (this.candidate) {
      this.candidateService.updateCandidate(this.candidate);
    }
  }

  finishInterview(): void {
    if (!this.candidate) return;
    this.showEvaluation = true;
  }

  get evalOverallRating(): number | null {
    const vals = Object.values(this.evalRatings).filter(v => v !== null) as number[];
    if (vals.length === 0) return null;
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }

  setEvalRating(key: keyof EvaluationRatings, value: number): void {
    this.evalRatings[key] = this.evalRatings[key] === value ? null : value;
  }

  get evalComplete(): boolean {
    return Object.values(this.evalRatings).every(v => v !== null);
  }

  cancelEvaluation(): void {
    this.showEvaluation = false;
  }

  submitEvaluation(): void {
    if (!this.candidate) return;
    this.candidate.evaluation = { ...this.evalRatings };
    this.candidate.evaluationFeedback = this.evalFeedback;
    this.candidate.interviewerName = this.evalInterviewerName;
    this.candidate.overallRating = this.evalOverallRating;
    this.candidateService.updateCandidate(this.candidate);
    this.candidateService.completeInterview(this.candidate.id);
    this.router.navigate(['/report', this.candidate.id]);
  }

  goBack(): void {
    this.saveProgress();
    this.router.navigate(['/']);
  }

  shuffleQuestion(index: number): void {
    if (!this.candidate) return;
    const q = this.filteredQuestions[index];
    if (!q) return;
    const range = this.candidate.experience <= 5 ? '3-5' : '5-8';
    const usedIds = this.candidate.questions.map(cq => cq.id);
    const replacement = this.questionBank.getReplacementQuestion(q.category, range, usedIds);
    if (!replacement) {
      alert('No more unused questions available in this category.');
      return;
    }
    const realIdx = this.candidate.questions.indexOf(q);
    if (realIdx !== -1) {
      this.candidate.questions[realIdx] = { ...replacement, isCorrect: null, rating: null, notes: '' };
      this.expandedId = replacement.id;
      this.saveProgress();
    }
  }

  removeQuestion(index: number): void {
    if (!this.candidate) return;
    const q = this.filteredQuestions[index];
    if (!q) return;
    const realIdx = this.candidate.questions.indexOf(q);
    if (realIdx !== -1) {
      this.candidate.questions.splice(realIdx, 1);
      this.expandedId = null;
      this.saveProgress();
    }
  }

  toggleAddPanel(): void {
    this.showAddPanel = !this.showAddPanel;
  }

  addFromBank(): void {
    if (!this.candidate) return;
    const range = this.candidate.experience <= 5 ? '3-5' : '5-8';
    const usedIds = this.candidate.questions.map(q => q.id);
    const question = this.questionBank.getReplacementQuestion(this.addCategory, range, usedIds);
    if (!question) {
      alert(`No more unused ${this.addCategory} questions available.`);
      return;
    }
    this.candidate.questions.push({ ...question, isCorrect: null, rating: null, notes: '' });
    this.activeCategory = 'All';
    this.expandedId = question.id;
    this.showAddPanel = false;
    this.saveProgress();
  }

  addCustomToList(): void {
    if (!this.candidate || !this.customQuestion.trim()) return;
    const newId = -Date.now();
    const newQ: CandidateQuestion = {
      id: newId,
      category: this.addCategory as CandidateQuestion['category'],
      difficulty: 'Medium',
      experienceRange: this.candidate.experience <= 5 ? '3-5' : '5-8',
      question: this.customQuestion.trim(),
      answer: this.customAnswer.trim() || 'Custom question — no predefined answer',
      isCorrect: null,
      rating: null,
      notes: ''
    };
    this.candidate.questions.push(newQ);
    this.activeCategory = 'All';
    this.expandedId = newId;
    this.showAddPanel = false;
    this.customQuestion = '';
    this.customAnswer = '';
    this.saveProgress();
  }
}
