import { Injectable } from '@angular/core';

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'interviewer';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';

  private readonly credentials = [
    { username: 'admin', password: 'admin@123', name: 'Amaan Khan', role: 'admin' as const },
    { username: 'interviewer1', password: 'int@123', name: 'Interviewer 1', role: 'interviewer' as const },
    { username: 'interviewer2', password: 'int@123', name: 'Interviewer 2', role: 'interviewer' as const },
  ];

  login(username: string, password: string): User | null {
    const match = this.credentials.find(
      c => c.username === username && c.password === password
    );
    if (match) {
      const user: User = { username: match.username, name: match.name, role: match.role };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getUser(): User | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }
}
