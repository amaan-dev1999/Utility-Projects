import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CandidateService } from '../../services/candidate.service';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';
import { TemplateService } from '../../services/template.service';
import { Candidate } from '../../models/candidate.model';
import { InterviewTemplate } from '../../models/template.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  candidateName = '';
  candidateExperience: number | null = null;
  selectedCategory = 'All';
  categories = ['All', 'Core Java', 'Angular', 'Spring Boot', 'Cloud'];
  candidates: Candidate[] = [];
  showForm = false;
  isAdmin = false;
  currentUsername = '';
  interviewMode: 'bank' | 'template' = 'bank';
  selectedTemplateId = '';
  myTemplates: InterviewTemplate[] = [];

  constructor(
    private candidateService: CandidateService,
    private pdfService: PdfService,
    private authService: AuthService,
    private templateService: TemplateService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'admin';
    this.currentUsername = user?.username ?? '';
    this.loadCandidates();
    this.myTemplates = this.templateService.getMyTemplates();
  }

  loadCandidates(): void {
    this.candidates = this.candidateService.getAllCandidates();
  }

  private isMine(c: Candidate): boolean {
    return c.interviewerUsername === this.currentUsername
      || !c.interviewerUsername
      || c.interviewerUsername === 'unknown';
  }

  get myCandidates(): Candidate[] {
    return this.candidates.filter(c => this.isMine(c));
  }

  get othersCandidates(): Candidate[] {
    return this.candidates.filter(c => !this.isMine(c));
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  startInterview(): void {
    if (!this.candidateName.trim() || !this.candidateExperience) return;

    let candidate: Candidate;
    if (this.interviewMode === 'template' && this.selectedTemplateId) {
      candidate = this.candidateService.createFromTemplate(
        this.candidateName,
        this.candidateExperience,
        this.selectedTemplateId
      );
    } else {
      candidate = this.candidateService.createCandidate(
        this.candidateName,
        this.candidateExperience,
        this.selectedCategory
      );
    }

    this.candidateName = '';
    this.candidateExperience = null;
    this.selectedCategory = 'All';
    this.selectedTemplateId = '';
    this.interviewMode = 'bank';
    this.showForm = false;
    this.router.navigate(['/interview', candidate.id]);
  }

  resumeInterview(id: string): void {
    this.router.navigate(['/interview', id]);
  }

  viewReport(id: string): void {
    this.router.navigate(['/report', id]);
  }

  downloadPdf(candidate: Candidate): void {
    this.pdfService.generateReport(candidate);
  }

  deleteCandidate(id: string): void {
    if (confirm('Are you sure you want to delete this candidate?')) {
      this.candidateService.deleteCandidate(id);
      this.loadCandidates();
    }
  }

  getScoreClass(candidate: Candidate): string {
    if (!candidate.score || !candidate.totalQuestions) return '';
    const pct = (candidate.score / candidate.totalQuestions) * 100;
    if (pct >= 70) return 'score-good';
    if (pct >= 50) return 'score-avg';
    return 'score-poor';
  }

  get inProgressCount(): number {
    return this.candidates.filter(c => c.status === 'in-progress').length;
  }

  get completedCount(): number {
    return this.candidates.filter(c => c.status === 'completed').length;
  }

  downloadFinalReport(): void {
    this.pdfService.generateSummaryReport(this.myCandidates);
  }

  clearDashboard(): void {
    if (!confirm('⚠️ This will permanently delete ALL your interviews. This action cannot be undone. Continue?')) return;
    this.candidateService.clearMyCandidates();
    this.loadCandidates();
  }
}
