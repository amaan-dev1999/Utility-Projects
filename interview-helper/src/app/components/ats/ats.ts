import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtsService } from '../../services/ats.service';
import { AiScreeningService } from '../../services/ai-screening.service';
import { ScreeningCriteria, ResumeResult, DEFAULT_CRITERIA, AgentState, createAgentStates } from '../../models/ats.model';

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
  useAi = false;

  // Currently processing result (for live agent view)
  activeResult: ResumeResult | null = null;

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

  get passedCount(): number { return this.results.filter(r => r.passed && r.status === 'done').length; }
  get failedCount(): number { return this.results.filter(r => !r.passed && r.status === 'done').length; }
  get doneCount(): number { return this.results.filter(r => r.status === 'done').length; }
  get aiModelStatus() { return this.aiService.modelStatus; }
  get aiModelProgress() { return this.aiService.modelProgress; }

  addRequiredSkill(): void {
    const skill = this.newRequiredSkill.trim();
    if (skill && !this.criteria.requiredSkills.includes(skill)) this.criteria.requiredSkills.push(skill);
    this.newRequiredSkill = '';
  }
  removeRequiredSkill(i: number): void { this.criteria.requiredSkills.splice(i, 1); }
  addPreferredSkill(): void {
    const skill = this.newPreferredSkill.trim();
    if (skill && !this.criteria.preferredSkills.includes(skill)) this.criteria.preferredSkills.push(skill);
    this.newPreferredSkill = '';
  }
  removePreferredSkill(i: number): void { this.criteria.preferredSkills.splice(i, 1); }

  async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) await this.processFiles(Array.from(files));
  }
  onDragOver(event: DragEvent): void { event.preventDefault(); }
  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files) { await this.processFiles(Array.from(input.files)); input.value = ''; }
  }

  async toggleAi(): Promise<void> {
    if (!this.useAi) {
      if (this.aiService.modelStatus !== 'ready' && this.aiService.modelStatus !== 'loading') {
        try { this.cdr.markForCheck(); await this.aiService.loadModel(); this.cdr.markForCheck(); } catch { return; }
      }
      this.useAi = true;
    } else {
      this.useAi = false;
    }
    this.cdr.markForCheck();
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
            this.results.push(this.createPlaceholder(entry.name, entry.data));
          }
          this.cdr.markForCheck();
          for (const result of this.results.filter(r => r.status === 'pending')) {
            await this.runAgentPipeline(result);
            this.processedCount++;
            this.cdr.markForCheck();
          }
        } catch { console.error('Failed to extract zip:', file.name); }
      } else if (['pdf', 'docx', 'txt'].includes(ext ?? '')) {
        this.processingCount++;
        const fileData = new Uint8Array(await file.arrayBuffer());
        const result = this.createPlaceholder(file.name, fileData);
        this.results.push(result);
        this.cdr.markForCheck();
        await this.runAgentPipeline(result, file);
        this.processedCount++;
        this.cdr.markForCheck();
      }
    }
    this.processing = false;
    this.activeResult = null;
    this.cdr.markForCheck();
  }

  private createPlaceholder(fileName: string, fileData: Uint8Array): ResumeResult {
    return {
      fileName, fileData, candidateName: '', extractedText: '', cleanedText: '',
      skillsFound: [], skillsMissing: [], preferredFound: [],
      experienceYears: null, score: 0, passed: false, manualOverride: false,
      textQuality: 'unknown', screeningMode: this.useAi ? 'ai' : 'keyword',
      agents: createAgentStates(), status: 'pending',
    };
  }

  private async runAgentPipeline(result: ResumeResult, originalFile?: File): Promise<void> {
    result.status = 'processing';
    this.activeResult = result;
    this.cdr.markForCheck();
    await this.tick();

    try {
      // ─── AGENT 1: Parser ───
      await this.runParser(result, originalFile);

      // ─── AGENT 2: Evaluator (Keyword + AI combined) ───
      await this.runEvaluator(result);

      // ─── AGENT 3: Summarizer ───
      await this.runSummarizer(result);

      // ─── AGENT 4: Decision ───
      await this.runDecision(result);

      result.status = 'done';
    } catch (e: any) {
      result.status = 'error';
      result.error = e.message || 'Pipeline failed';
    }
    this.cdr.markForCheck();
  }

  // ─── AGENT 1: Parser ───
  private async runParser(result: ResumeResult, originalFile?: File): Promise<void> {
    const agent = this.getAgent(result, 'parser');
    agent.status = 'working';
    this.log(agent, 'info', 'Extracting text from ' + result.fileName + '...');
    this.cdr.markForCheck();
    await this.tick();

    let text: string;
    if (originalFile) {
      text = await this.atsService.extractTextFromFile(originalFile);
    } else {
      const blob = new Blob([result.fileData.buffer as ArrayBuffer]);
      const file = new File([blob], result.fileName);
      text = await this.atsService.extractTextFromFile(file);
    }
    result.extractedText = text;
    agent.progress = 40;
    this.log(agent, 'info', `Extracted ${text.length} characters, ${text.split(/\s+/).length} words`);
    this.cdr.markForCheck();
    await this.tick();

    // Clean & normalize
    result.candidateName = this.atsService.extractCandidateName(text, result.fileName);
    this.log(agent, 'info', `Candidate identified: ${result.candidateName}`);
    agent.progress = 70;
    this.cdr.markForCheck();
    await this.tick();

    // Assess quality
    const cleaned = (this.atsService as any).normalizeText(text);
    result.cleanedText = cleaned;
    result.textQuality = (this.atsService as any).assessTextQuality(cleaned);
    this.log(agent, result.textQuality === 'poor' ? 'warn' : 'success',
      `Text quality: ${result.textQuality.toUpperCase()}` + (result.textQuality === 'poor' ? ' — may affect accuracy' : ''));
    agent.progress = 100;
    agent.status = 'done';
    agent.result = `${text.split(/\s+/).length} words · Quality: ${result.textQuality}`;
    this.cdr.markForCheck();
    await this.tick();
  }

  // ─── AGENT 2: Evaluator ───
  private async runEvaluator(result: ResumeResult): Promise<void> {
    const agent = this.getAgent(result, 'evaluator');
    agent.status = 'working';
    this.log(agent, 'info', 'Starting keyword-based skill matching...');
    this.cdr.markForCheck();
    await this.tick();

    // Keyword screening (always runs)
    const kw = this.atsService.screenResume(result.extractedText, this.criteria);
    agent.progress = 40;
    this.log(agent, 'info', `Keyword scan: found ${kw.skillsFound.length}/${this.criteria.requiredSkills.length} required skills`);
    this.cdr.markForCheck();
    await this.tick();

    let aiResult: any = null;
    // AI screening (if enabled & ready)
    if (this.useAi && this.aiService.modelStatus === 'ready') {
      this.log(agent, 'info', '🧠 Running AI semantic analysis...');
      this.cdr.markForCheck();
      await this.tick();
      try {
        aiResult = await this.aiService.screenResume(result.extractedText, this.criteria);
        agent.progress = 80;
        this.log(agent, 'info', `AI scan: found ${aiResult.skillsFound.length}/${this.criteria.requiredSkills.length} required skills`);
        this.cdr.markForCheck();
        await this.tick();
      } catch (e: any) {
        this.log(agent, 'warn', 'AI scan failed, using keyword results only');
      }
    }

    // ── Merge results: union of keyword + AI findings ──
    const allRequired = new Set([...kw.skillsFound, ...(aiResult?.skillsFound ?? [])]);
    const allPreferred = new Set([...kw.preferredFound, ...(aiResult?.preferredFound ?? [])]);
    result.skillsFound = [...allRequired];
    result.skillsMissing = this.criteria.requiredSkills.filter(s => !allRequired.has(s));
    result.preferredFound = [...allPreferred];
    result.experienceYears = kw.experienceYears ?? aiResult?.experienceYears ?? null;
    result.textQuality = kw.textQuality;

    // Calculate combined score
    const reqScore = this.criteria.requiredSkills.length > 0
      ? (result.skillsFound.length / this.criteria.requiredSkills.length) * 60 : 60;
    const prefScore = this.criteria.preferredSkills.length > 0
      ? (result.preferredFound.length / this.criteria.preferredSkills.length) * 20 : 0;
    let expScore = 0;
    if (result.experienceYears !== null) {
      if (result.experienceYears >= this.criteria.minExperienceYears) expScore = 20;
      else if (result.experienceYears >= this.criteria.minExperienceYears - 1) expScore = 10;
    }
    result.score = Math.round(reqScore + prefScore + expScore);
    result.screeningMode = aiResult ? 'ai' : 'keyword';

    if (aiResult && allRequired.size > kw.skillsFound.length) {
      const extra = [...allRequired].filter(s => !kw.skillsFound.includes(s));
      this.log(agent, 'success', `AI found ${extra.length} additional skills: ${extra.join(', ')}`);
    }

    agent.progress = 100;
    agent.status = 'done';
    agent.result = `Score: ${result.score}% · ${result.skillsFound.length} skills matched`;
    this.log(agent, 'success', `Combined score: ${result.score}%`);
    this.cdr.markForCheck();
    await this.tick();
  }

  // ─── AGENT 3: Summarizer ───
  private async runSummarizer(result: ResumeResult): Promise<void> {
    const agent = this.getAgent(result, 'summarizer');
    agent.status = 'working';
    this.log(agent, 'info', 'Generating candidate brief...');
    this.cdr.markForCheck();
    await this.tick();

    const parts: string[] = [];
    if (result.candidateName) parts.push(`${result.candidateName}`);
    if (result.experienceYears !== null) parts.push(`has ${result.experienceYears} years of experience`);
    if (result.skillsFound.length > 0) parts.push(`with expertise in ${result.skillsFound.join(', ')}`);
    if (result.skillsMissing.length > 0) parts.push(`Missing: ${result.skillsMissing.join(', ')}`);
    if (result.preferredFound.length > 0) parts.push(`Bonus skills: ${result.preferredFound.join(', ')}`);

    const strength = result.score >= 75 ? 'Strong' : result.score >= 50 ? 'Average' : 'Weak';
    parts.push(`Overall: ${strength} candidate (${result.score}%)`);

    result.aiSummary = parts.join('. ') + '.';
    agent.progress = 100;
    agent.status = 'done';
    agent.result = `${strength} candidate profile generated`;
    this.log(agent, 'success', 'Candidate brief ready');
    this.cdr.markForCheck();
    await this.tick();
  }

  // ─── AGENT 4: Decision ───
  private async runDecision(result: ResumeResult): Promise<void> {
    const agent = this.getAgent(result, 'decision');
    agent.status = 'working';
    this.log(agent, 'info', `Evaluating against ${this.criteria.passThreshold}% threshold...`);
    this.cdr.markForCheck();
    await this.tick();

    result.passed = result.score >= this.criteria.passThreshold;

    // Generate reasoning
    const reasons: string[] = [];
    const reqRatio = this.criteria.requiredSkills.length > 0
      ? Math.round((result.skillsFound.length / this.criteria.requiredSkills.length) * 100) : 100;
    reasons.push(`Required skills: ${result.skillsFound.length}/${this.criteria.requiredSkills.length} (${reqRatio}%)`);
    if (result.skillsMissing.length > 0) reasons.push(`Missing: ${result.skillsMissing.join(', ')}`);
    if (result.experienceYears !== null) {
      const meetsExp = result.experienceYears >= this.criteria.minExperienceYears;
      reasons.push(`Experience: ${result.experienceYears} years ${meetsExp ? '✓' : '✗'} (need ${this.criteria.minExperienceYears})`);
    } else {
      reasons.push('Experience: Not detected');
    }
    reasons.push(`Score: ${result.score}% ${result.passed ? '≥' : '<'} ${this.criteria.passThreshold}% threshold`);

    result.decisionReason = reasons.join(' · ');

    agent.progress = 100;
    agent.status = 'done';
    agent.result = result.passed ? '✅ PASSED' : '❌ FAILED';
    this.log(agent, result.passed ? 'success' : 'warn',
      `Verdict: ${result.passed ? 'PASSED' : 'FAILED'} — ${result.score}%`);
    this.cdr.markForCheck();
    await this.tick();
  }

  private getAgent(result: ResumeResult, id: string): AgentState {
    return result.agents.find(a => a.id === id)!;
  }

  private log(agent: AgentState, type: 'info' | 'success' | 'warn' | 'error', message: string): void {
    agent.logs.push({ timestamp: Date.now(), message, type });
  }

  private tick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 80));
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
    this.activeResult = null;
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
      result.agents = createAgentStates();
      result.status = 'processing';
      this.activeResult = result;
      this.cdr.markForCheck();

      // Skip parser (text already extracted), re-run evaluator → summarizer → decision
      const parser = this.getAgent(result, 'parser');
      parser.status = 'done'; parser.progress = 100;
      parser.result = 'Using cached text';
      parser.logs = [{ timestamp: Date.now(), message: 'Text already extracted — skipping', type: 'info' }];

      await this.runEvaluator(result);
      await this.runSummarizer(result);
      await this.runDecision(result);

      if (result.manualOverride) result.passed = result.passed; // keep manual
      result.status = 'done';
      this.processedCount++;
      this.cdr.markForCheck();
    }

    this.processing = false;
    this.activeResult = null;
    this.cdr.markForCheck();
  }
}
