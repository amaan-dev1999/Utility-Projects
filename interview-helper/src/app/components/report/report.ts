import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CandidateService } from '../../services/candidate.service';
import { PdfService } from '../../services/pdf.service';
import { Candidate, EvaluationRatings } from '../../models/candidate.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report.html',
  styleUrl: './report.scss'
})
export class ReportComponent implements OnInit {
  candidate: Candidate | null = null;

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
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidate = this.candidateService.getCandidateById(id) ?? null;
    }
    if (!this.candidate) {
      this.router.navigate(['/']);
    }
  }

  get scorePercent(): number {
    const rating = this.candidate?.overallRating ?? this.candidate?.score ?? 0;
    return Math.round((rating / 5) * 100);
  }

  get recommendation(): string {
    if (this.scorePercent >= 70) return 'RECOMMENDED';
    if (this.scorePercent >= 50) return 'AVERAGE';
    return 'NOT RECOMMENDED';
  }

  get recommendationClass(): string {
    if (this.scorePercent >= 70) return 'rec-good';
    if (this.scorePercent >= 50) return 'rec-avg';
    return 'rec-poor';
  }

  getCategoryCount(category: string): number {
    return this.candidate?.questions.filter(q => q.category === category).length ?? 0;
  }

  get categories(): string[] {
    return [...new Set(this.candidate?.questions.map(q => q.category) ?? [])];
  }

  downloadPdf(): void {
    if (this.candidate) {
      this.pdfService.generateReport(this.candidate);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
