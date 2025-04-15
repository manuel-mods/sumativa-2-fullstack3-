import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';

interface StoredUser extends User {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'forum_auth';
  private readonly USERS_STORAGE_KEY = 'forum_users';
  private readonly MOCK_USERS = [
    {
      id: '1',
      name: 'Admin User',
      email: 'manuel@admin.com',
      password: 'Admin@123',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Regular User',
      email: 'manuel@user.com',
      password: 'User@123',
      role: UserRole.USER,
      createdAt: new Date('2024-01-02'),
    },
  ];

  private currentUserSignal = signal<User | null>(null);

  constructor(private router: Router) {
    this.loadUserFromStorage();
    this.initializeUserStorage();
  }

  get currentUser() {
    return this.currentUserSignal();
  }

  get isLoggedIn() {
    return !!this.currentUserSignal();
  }

  get isAdmin() {
    return this.currentUserSignal()?.role === UserRole.ADMIN;
  }

  login(email: string, password: string): boolean {
    // First check mock users
    const mockUser = this.MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (mockUser) {
      const { password: _, ...userData } = mockUser;
      this.currentUserSignal.set(userData);
      this.saveUserToStorage(userData);
      return true;
    }

    // Then check stored users
    const storedUsers = this.getStoredUsers();
    const storedUser = storedUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (storedUser) {
      const { password: _, ...userData } = storedUser;
      this.currentUserSignal.set(userData);
      this.saveUserToStorage(userData);
      return true;
    }

    return false;
  }

  register(name: string, email: string, password: string): boolean {
    // Check if email already exists in mock users
    if (
      this.MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase())
    ) {
      return false;
    }

    // Check if email already exists in stored users
    const storedUsers = this.getStoredUsers();
    if (
      storedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())
    ) {
      return false;
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: UserRole.USER,
      createdAt: new Date(),
    };

    storedUsers.push(newUser);
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(storedUsers));

    // Auto login after register
    const { password: _, ...userData } = newUser;
    this.currentUserSignal.set(userData);
    this.saveUserToStorage(userData);

    return true;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  updateUserProfile(name: string, email: string): void {
    const currentUser = this.currentUserSignal();
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      name,
      email,
    };

    this.currentUserSignal.set(updatedUser);
    this.saveUserToStorage(updatedUser);

    // Update user in storage if it's a registered user
    this.updateUserInStorage(currentUser.id, { name, email });
  }

  updatePassword(currentPassword: string, newPassword: string): boolean {
    const currentUser = this.currentUserSignal();
    if (!currentUser) return false;

    // Check if user is a mock user
    const mockUserIndex = this.MOCK_USERS.findIndex(
      (u) => u.id === currentUser.id && u.password === currentPassword
    );

    if (mockUserIndex >= 0) {
      this.MOCK_USERS[mockUserIndex].password = newPassword;
      return true;
    }

    // Check if user is a stored user
    const storedUsers = this.getStoredUsers();
    const storedUserIndex = storedUsers.findIndex(
      (u) => u.id === currentUser.id && u.password === currentPassword
    );

    if (storedUserIndex >= 0) {
      storedUsers[storedUserIndex].password = newPassword;
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(storedUsers));
      return true;
    }

    return false;
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Convert string dates back to Date objects
        user.createdAt = new Date(user.createdAt);
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  private initializeUserStorage(): void {
    if (!localStorage.getItem(this.USERS_STORAGE_KEY)) {
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify([]));
    }
  }

  private getStoredUsers(): StoredUser[] {
    const users = localStorage.getItem(this.USERS_STORAGE_KEY);
    if (!users) return [];

    try {
      return JSON.parse(users);
    } catch (error) {
      console.error('Failed to parse stored users', error);
      return [];
    }
  }

  private updateUserInStorage(
    userId: string,
    updates: Partial<StoredUser>
  ): void {
    const storedUsers = this.getStoredUsers();
    const userIndex = storedUsers.findIndex((u) => u.id === userId);

    if (userIndex >= 0) {
      storedUsers[userIndex] = { ...storedUsers[userIndex], ...updates };
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(storedUsers));
    }
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (password.length > 30) {
      errors.push('La contraseña debe tener menos de 30 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
