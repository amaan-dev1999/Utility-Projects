import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtsService } from '../../services/ats.service';
import { AiScreeningService } from '../../services/ai-screening.service';
import { ScreeningCriteria, ResumeResult, DEFAULT_CRITERIA, ScreeningMode } from '../../models/ats.model';

@Component({
  selector: 'app-ats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ats.html',
  styleUrl: './ats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AtsComponent {
  criteria: ScreeningCriteria = { ...DEFAULT_CRITERIA };
  results: ResumeResult[] = [];
  processing = false;
  processingCount = 0;
  processedCount = 0;
  newRequiredSkill = '';
  newPreferredSkill = '';
  showCriteria = false;
  expandedIndex: number | null = null;
  filterMode: 'all' | 'passed' | 'failed' = 'all';
  screeningMode: ScreeningMode = 'keyword';
  showExtractedText: ResumeResult | null = null;

  constructor(
    private atsService: AtsService,
    private aiService: AiScreeningService,
    private cdr: ChangeDetectorRef
  ) {}

  get filteredResults(): ResumeResult[] {
    if (this.filterMode === 'passed') return this.results.filter(r => r.passed);
    if (this.filterMode === 'failed') return this.results.filter(r => !r.passed);
    return this.results;
  }

  get passedCount(): number {
    return this.results.filter(r => r.passed && r.status === 'done').length;
  }

  get failedCount(): number {
    return this.results.filter(r => !r.passed && r.status === 'done').length;
  }

  get doneCount(): number {
    return this.results.filter(r => r.status === 'done').length;
  }

  addRequiredSkill(): void {
    const skill = this.newRequiredSkill.trim();
    if (skill && !this.criteria.requiredSkills.includes(skill)) {
      this.criteria.requiredSkills.push(skill);
    }
    this.newRequiredSkill = '';
  }

  removeRequiredSkill(index: number): void {
    this.criteria.requiredSkills.splice(index, 1);
  }

  addPreferredSkill(): void {
    const skill = this.newPreferredSkill.trim();
    if (skill && !this.criteria.preferredSkills.includes(skill)) {
      this.criteria.preferredSkills.push(skill);
    }
    this.newPreferredSkill = '';
  }

  removePreferredSkill(index: number): void {
    this.criteria.preferredSkills.splice(index, 1);
  }

  async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) await this.processFiles(Array.from(files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      await this.processFiles(Array.from(input.files));
      input.value = '';
    }
  }

  async processFiles(files: File[]): Promise<void> {
    this.processing = true;
    this.processedCount = 0;
    this.processingCount = 0;
    this.cdr.markForCheck();

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'zip') {
        try {
          const entries = await this.atsService.extractFilesFromZip(file);
          this.processingCount += entries.length;
          this.cdr.markForCheck();
          for (const entry of entries) {
            const placeholder: ResumeResult = {
              fileName: entry.name,
              fileData: entry.data,
              candidateName: '',
              extractedText: '',
              skillsFound: [],
              skillsMissing: [],
              preferredFound: [],
              experienceYears: null,
              score: 0,
              passed: false,
              manualOverride: false,
              textQuality: 'unknown',
              screeningMode: this.screeningMode,
              status: 'pending',
            };
            this.results.push(placeholder);
          }
          this.cdr.markForCheck();
          for (const result of this.results.filter(r => r.status === 'pending')) {
            await this.screenSingleResult(result);
            this.processedCount++;
            this.cdr.markForCheck();
          }
        } catch {
          console.error('Failed to extract zip:', file.name);
        }
      } else if (['pdf', 'docx', 'txt'].includes(ext ?? '')) {
        this.processingCount++;
        const fileData = new Uint8Array(await file.arrayBuffer());
        const result: ResumeResult = {
          fileName: file.name,
          fileData,
          candidateName: '',
          extractedText: '',
          skillsFound: [],
          skillsMissing: [],
          preferredFound: [],
          experienceYears: null,
          score: 0,
          passed: false,
          manualOverride: false,
          textQuality: 'unknown',
          screeningMode: this.screeningMode,
          status: 'pending',
        };
        this.results.push(result);
        this.cdr.markForCheck();
        await this.screenSingleResult(result, file);
        this.processedCount++;
        this.cdr.markForCheck();
      }
    }

    this.processing = false;
    this.cdr.markForCheck();
  }

  private async screenSingleResult(result: ResumeResult, originalFile?: File): Promise<void> {
    result.status = 'processing';
    this.cdr.markForCheck();
    // Yield to allow UI to repaint
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      let text: string;
      if (originalFile) {
        text = await this.atsService.extractTextFromFile(originalFile);
      } else {
        // Create a File from the Uint8Array for parsing
        const blob = new Blob([result.fileData.buffer as ArrayBuffer]);
        const file = new File([blob], result.fileName);
        text = await this.atsService.extractTextFromFile(file);
      }
      result.extractedText = text;
      result.candidateName = this.atsService.extractCandidateName(text, result.fileName);
      result.screeningMode = this.screeningMode;

      if (this.screeningMode === 'ai') {
        const aiResult = await this.aiService.screenResume(text, this.criteria);
        result.skillsFound = aiResult.skillsFound;
        result.skillsMissing = aiResult.skillsMissing;
        result.preferredFound = aiResult.preferredFound;
        result.experienceYears = aiResult.experienceYears;
        result.score = aiResult.score;
        result.textQuality = aiResult.textQuality;
        result.aiSummary = aiResult.summary;
        result.aiConfidence = 80; // Semantic matching provides good confidence
      } else {
        const screening = this.atsService.screenResume(text, this.criteria);
        result.skillsFound = screening.skillsFound;
        result.skillsMissing = screening.skillsMissing;
        result.preferredFound = screening.preferredFound;
        result.experienceYears = screening.experienceYears;
        result.score = screening.score;
        result.textQuality = screening.textQuality;
      }
      result.passed = result.score >= this.criteria.passThreshold;
      result.status = 'done';
    } catch (e: any) {
      result.status = 'error';
      result.error = e.message || 'Failed to process file';
    }
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  async downloadPassedZip(): Promise<void> {
    const blob = await this.atsService.createPassedZip(this.results);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passed_Resumes_${new Date().toISOString().split('T')[0]}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearAll(): void {
    this.results = [];
    this.expandedIndex = null;
    this.filterMode = 'all';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= this.criteria.passThreshold) return 'score-mid';
    return 'score-low';
  }

  resetCriteria(): void {
    this.criteria = { ...DEFAULT_CRITERIA, requiredSkills: [...DEFAULT_CRITERIA.requiredSkills], preferredSkills: [...DEFAULT_CRITERIA.preferredSkills] };
  }

  toggleOverride(result: ResumeResult): void {
    result.passed = !result.passed;
    result.manualOverride = true;
    this.cdr.markForCheck();
  }

  async recheckAll(): Promise<void> {
    const doneResults = this.results.filter(r => r.status === 'done' && r.extractedText);
    if (doneResults.length === 0) return;
    this.processing = true;
    this.processedCount = 0;
    this.processingCount = doneResults.length;
    this.cdr.markForCheck();

    for (const result of doneResults) {
      result.screeningMode = this.screeningMode;

      if (this.screeningMode === 'ai') {
        const aiResult = await this.aiService.screenResume(result.extractedText, this.criteria);
        result.skillsFound = aiResult.skillsFound;
        result.skillsMissing = aiResult.skillsMissing;
        result.preferredFound = aiResult.preferredFound;
        result.experienceYears = aiResult.experienceYears;
        result.score = aiResult.score;
        result.textQuality = aiResult.textQuality;
        result.aiSummary = aiResult.summary;
        result.aiConfidence = 80;
      } else {
        const screening = this.atsService.screenResume(result.extractedText, this.criteria);
        result.skillsFound = screening.skillsFound;
        result.skillsMissing = screening.skillsMissing;
        result.preferredFound = screening.preferredFound;
        result.experienceYears = screening.experienceYears;
        result.score = screening.score;
        result.textQuality = screening.textQuality;
        result.aiSummary = undefined;
        result.aiConfidence = undefined;
      }
      result.passed = result.manualOverride ? result.passed : result.score >= this.criteria.passThreshold;
      this.processedCount++;
      this.cdr.markForCheck();
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.processing = false;
    this.cdr.markForCheck();
  }

  async toggleAiMode(): Promise<void> {
    if (this.screeningMode === 'keyword') {
      if (this.aiService.modelStatus !== 'ready' && this.aiService.modelStatus !== 'loading') {
        try {
          this.cdr.markForCheck();
          await this.aiService.loadModel();
          this.cdr.markForCheck();
        } catch {
          return; // Stay in keyword mode if model fails to load
        }
      }
      this.screeningMode = 'ai';
    } else {
      this.screeningMode = 'keyword';
    }
    this.cdr.markForCheck();
  }

  get aiModelStatus() { return this.aiService.modelStatus; }
  get aiModelProgress() { return this.aiService.modelProgress; }
}
