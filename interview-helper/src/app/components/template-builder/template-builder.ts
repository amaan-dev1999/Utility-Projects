import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TemplateService } from '../../services/template.service';
import { InterviewTemplate, TemplateQuestion } from '../../models/template.model';

@Component({
  selector: 'app-template-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './template-builder.html',
  styleUrl: './template-builder.scss'
})
export class TemplateBuilderComponent implements OnInit {
  templates: InterviewTemplate[] = [];
  activeTemplate: InterviewTemplate | null = null;
  isEditing = false;

  // New category input
  newCategory = '';

  // New question form
  showQuestionForm = false;
  qCategory = '';
  qQuestion = '';
  qAnswer = '';
  qDifficulty: 'Medium' | 'Hard' = 'Medium';

  // Edit question
  editingQuestionId: number | null = null;

  constructor(
    private templateService: TemplateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    const editId = this.route.snapshot.paramMap.get('id');
    if (editId) {
      const t = this.templateService.getTemplateById(editId);
      if (t) {
        this.activeTemplate = t;
        this.isEditing = true;
      }
    }
  }

  loadTemplates(): void {
    this.templates = this.templateService.getMyTemplates();
  }

  createNew(): void {
    this.activeTemplate = this.templateService.createBlankTemplate();
    this.isEditing = true;
  }

  editTemplate(t: InterviewTemplate): void {
    this.activeTemplate = { ...t, categories: [...t.categories], questions: t.questions.map(q => ({ ...q })) };
    this.isEditing = true;
  }

  deleteTemplate(id: string): void {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    this.templateService.deleteTemplate(id);
    this.loadTemplates();
  }

  backToList(): void {
    this.activeTemplate = null;
    this.isEditing = false;
    this.resetQuestionForm();
    this.loadTemplates();
  }

  // --- Category management ---
  addCategory(): void {
    if (!this.activeTemplate || !this.newCategory.trim()) return;
    const cat = this.newCategory.trim();
    if (this.activeTemplate.categories.includes(cat)) {
      alert('Category already exists.');
      return;
    }
    this.activeTemplate.categories.push(cat);
    this.newCategory = '';
  }

  removeCategory(cat: string): void {
    if (!this.activeTemplate) return;
    const hasQuestions = this.activeTemplate.questions.some(q => q.category === cat);
    if (hasQuestions && !confirm(`Remove "${cat}"? Its ${this.activeTemplate.questions.filter(q => q.category === cat).length} question(s) will also be removed.`)) return;
    this.activeTemplate.categories = this.activeTemplate.categories.filter(c => c !== cat);
    this.activeTemplate.questions = this.activeTemplate.questions.filter(q => q.category !== cat);
  }

  // --- Question management ---
  openQuestionForm(category?: string): void {
    this.showQuestionForm = true;
    this.qCategory = category || this.activeTemplate?.categories[0] || '';
    this.qQuestion = '';
    this.qAnswer = '';
    this.qDifficulty = 'Medium';
    this.editingQuestionId = null;
  }

  editQuestion(q: TemplateQuestion): void {
    this.showQuestionForm = true;
    this.editingQuestionId = q.id;
    this.qCategory = q.category;
    this.qQuestion = q.question;
    this.qAnswer = q.answer;
    this.qDifficulty = q.difficulty;
  }

  removeQuestion(id: number): void {
    if (!this.activeTemplate) return;
    this.activeTemplate.questions = this.activeTemplate.questions.filter(q => q.id !== id);
  }

  saveQuestion(): void {
    if (!this.activeTemplate || !this.qQuestion.trim() || !this.qCategory) return;

    if (this.editingQuestionId !== null) {
      const q = this.activeTemplate.questions.find(q => q.id === this.editingQuestionId);
      if (q) {
        q.category = this.qCategory;
        q.question = this.qQuestion.trim();
        q.answer = this.qAnswer.trim();
        q.difficulty = this.qDifficulty;
      }
    } else {
      this.activeTemplate.questions.push({
        id: Date.now(),
        category: this.qCategory,
        question: this.qQuestion.trim(),
        answer: this.qAnswer.trim(),
        difficulty: this.qDifficulty
      });
    }
    this.resetQuestionForm();
  }

  resetQuestionForm(): void {
    this.showQuestionForm = false;
    this.qCategory = '';
    this.qQuestion = '';
    this.qAnswer = '';
    this.qDifficulty = 'Medium';
    this.editingQuestionId = null;
  }

  getQuestionsForCategory(cat: string): TemplateQuestion[] {
    return this.activeTemplate?.questions.filter(q => q.category === cat) ?? [];
  }

  // --- Save template ---
  saveTemplate(): void {
    if (!this.activeTemplate) return;
    if (!this.activeTemplate.name.trim()) {
      alert('Please enter a template name.');
      return;
    }
    if (this.activeTemplate.questions.length === 0) {
      alert('Add at least one question.');
      return;
    }
    this.templateService.saveTemplate(this.activeTemplate);
    this.backToList();
  }
}
