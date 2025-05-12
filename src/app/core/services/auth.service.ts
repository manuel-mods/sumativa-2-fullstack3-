import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface StoredUser extends User {
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'forum_auth';
  private readonly API_URL = 'http://localhost:8080/api';
  private currentUserSignal = signal<User | null>(null);
  private tokenKey = 'auth-token';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.loadUserFromStorage();
  }

  get currentUser() {
    return this.currentUserSignal();
  }

  get isLoggedIn() {
    return !!this.currentUserSignal() && !!this.getToken();
  }

  get isAdmin() {
    return this.currentUserSignal()?.role === UserRole.ADMIN;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(username: string, password: string): Observable<boolean> {
    const loginRequest: LoginRequest = { username, password };

    return this.http.post<JwtResponse>(`${this.API_URL}/auth/signin`, loginRequest)
      .pipe(
        tap(response => {
          // Save token
          localStorage.setItem(this.tokenKey, response.token);

          // Create user object from response
          const user: User = {
            id: response.id.toString(),
            name: response.username,
            email: response.email,
            role: response.roles.includes('ROLE_ADMIN') ? UserRole.ADMIN : UserRole.USER,
            createdAt: new Date()
          };

          this.currentUserSignal.set(user);
          this.saveUserToStorage(user);
          this.toastr.success('Has iniciado sesión correctamente', 'Bienvenido');
        }),
        map(() => true),
        catchError(error => {
          console.error('Login failed', error);
          this.toastr.error('Credenciales inválidas', 'Error de inicio de sesión');
          return of(false);
        })
      );
  }

  register(name: string, email: string, password: string): Observable<boolean> {
    const signupRequest: SignupRequest = {
      username: name,
      email,
      password
    };

    return this.http.post<MessageResponse>(`${this.API_URL}/auth/signup`, signupRequest)
      .pipe(
        tap(() => {
          this.toastr.success('Te has registrado correctamente. Ya puedes iniciar sesión', 'Registro exitoso');
        }),
        map(() => true),
        catchError(error => {
          console.error('Registration failed', error);
          if (error.status === 400) {
            this.toastr.error('El nombre de usuario o correo ya existe', 'Error de registro');
          } else {
            this.toastr.error('Ocurrió un error durante el registro', 'Error de registro');
          }
          return of(false);
        })
      );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
    this.toastr.info('Has cerrado sesión correctamente', 'Sesión finalizada');
  }

  updateUserProfile(name: string, email: string): Observable<boolean> {
    const currentUser = this.currentUserSignal();
    if (!currentUser) return of(false);

    const updatedUser = {
      ...currentUser,
      username: name,
      email
    };
    
    return this.http.put<User>(`${this.API_URL}/users/${currentUser.id}`, updatedUser)
      .pipe(
        tap(response => {
          const user: User = {
            id: currentUser.id,
            name: name,
            email: email,
            role: currentUser.role,
            createdAt: currentUser.createdAt
          };
          
          this.currentUserSignal.set(user);
          this.saveUserToStorage(user);
        }),
        map(() => true),
        catchError(error => {
          console.error('Profile update failed', error);
          return of(false);
        })
      );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    // This would be implemented with a proper endpoint for password changing
    // As that's not in the API, returning false
    return of(false);
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    const token = localStorage.getItem(this.tokenKey);
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        // Convert string dates back to Date objects
        user.createdAt = new Date(user.createdAt);
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.tokenKey);
      }
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