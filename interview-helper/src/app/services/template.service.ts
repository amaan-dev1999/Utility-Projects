import { Injectable } from '@angular/core';
import { InterviewTemplate, TemplateQuestion } from '../models/template.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly STORAGE_KEY = 'interview_templates';

  constructor(private auth: AuthService) {}

  private getAllRaw(): InterviewTemplate[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getMyTemplates(): InterviewTemplate[] {
    const user = this.auth.getUser();
    if (!user) return [];
    return this.getAllRaw().filter(t => t.createdBy === user.username);
  }

  getTemplateById(id: string): InterviewTemplate | undefined {
    return this.getAllRaw().find(t => t.id === id);
  }

  saveTemplate(template: InterviewTemplate): void {
    const all = this.getAllRaw();
    const idx = all.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      all[idx] = template;
    } else {
      all.push(template);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  deleteTemplate(id: string): void {
    const all = this.getAllRaw().filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  createBlankTemplate(): InterviewTemplate {
    const user = this.auth.getUser();
    return {
      id: crypto.randomUUID(),
      name: '',
      createdBy: user?.username ?? 'unknown',
      categories: [],
      questions: [],
      createdDate: new Date().toISOString()
    };
  }
}
