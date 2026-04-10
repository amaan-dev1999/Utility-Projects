import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { InterviewComponent } from './components/interview/interview';
import { ReportComponent } from './components/report/report';
import { TemplateBuilderComponent } from './components/template-builder/template-builder';
import { AtsComponent } from './components/ats/ats';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'templates', component: TemplateBuilderComponent, canActivate: [authGuard] },
  { path: 'templates/:id', component: TemplateBuilderComponent, canActivate: [authGuard] },
  { path: 'ats', component: AtsComponent, canActivate: [authGuard] },
  { path: 'interview/:id', component: InterviewComponent, canActivate: [authGuard] },
  { path: 'report/:id', component: ReportComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
