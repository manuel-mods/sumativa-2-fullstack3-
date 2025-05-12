import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let router: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;
  let toastrService: jasmine.SpyObj<ToastrService>;
  
  const API_URL = 'http://localhost:8080/api';

  beforeEach(() => {
    // Create router and toastr spies
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [
        AuthService, 
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ],
    });

    // Get service and mocked dependencies
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    httpMock = TestBed.inject(HttpTestingController);
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;

    // Clear localStorage to ensure clean state
    localStorage.clear();
  });

  afterEach(() => {
    // Verify there are no outstanding HTTP requests
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no logged in user', () => {
    expect(service.isLoggedIn).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  describe('login', () => {
    it('should login successfully with correct credentials', () => {
      const mockResponse = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER']
      };

      let result = false;
      service.login('testuser', 'Password123!').subscribe(res => {
        result = res;
      });

      // Expect HTTP request to signin endpoint
      const req = httpMock.expectOne(`${API_URL}/auth/signin`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'testuser', 
        password: 'Password123!'
      });

      // Respond with mock data
      req.flush(mockResponse);

      // Verify response and state changes
      expect(result).toBeTrue();
      expect(localStorage.getItem('auth-token')).toBe('test-token');
      expect(service.isLoggedIn).toBeTrue();
      expect(service.currentUser).toBeTruthy();
      expect(service.currentUser?.name).toBe('testuser');
      expect(service.currentUser?.email).toBe('test@example.com');
      expect(service.currentUser?.role).toBe(UserRole.USER);
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should identify admin users correctly', () => {
      const mockResponse = {
        token: 'admin-token',
        type: 'Bearer',
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN']
      };

      service.login('admin', 'Admin123!').subscribe();

      const req = httpMock.expectOne(`${API_URL}/auth/signin`);
      req.flush(mockResponse);

      expect(service.isLoggedIn).toBeTrue();
      expect(service.isAdmin).toBeTrue();
      expect(service.currentUser?.role).toBe(UserRole.ADMIN);
    });

    it('should handle login failure', () => {
      let result = true;
      service.login('wronguser', 'WrongPassword123!').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/signin`);
      req.error(new ErrorEvent('error', { message: 'Invalid credentials' }));

      expect(result).toBeFalse();
      expect(service.isLoggedIn).toBeFalse();
      expect(service.currentUser).toBeNull();
      expect(toastrService.error).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', () => {
      const mockResponse = { message: 'User registered successfully!' };

      let result = false;
      service.register('Test User', 'test@example.com', 'Password123!').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/signup`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      req.flush(mockResponse);

      expect(result).toBeTrue();
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should handle registration failure if email exists', () => {
      let result = true;
      service.register('Test User', 'existing@example.com', 'Password123!').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/signup`);
      req.error(new ErrorEvent('error', { message: 'Email already in use' }), { status: 400 });

      expect(result).toBeFalse();
      expect(toastrService.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user and navigate to login', () => {
      // Setup a logged in state first
      localStorage.setItem('auth-token', 'test-token');
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
        createdAt: new Date()
      };
      localStorage.setItem(service['STORAGE_KEY'], JSON.stringify(user));
      service['loadUserFromStorage']();

      // Logout
      service.logout();

      expect(service.isLoggedIn).toBeFalse();
      expect(service.currentUser).toBeNull();
      expect(localStorage.getItem('auth-token')).toBeNull();
      expect(localStorage.getItem(service['STORAGE_KEY'])).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(toastrService.info).toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should validate password requirements correctly', () => {
      expect(service.validatePassword('short').valid).toBeFalse();
      expect(service.validatePassword('nouppercase123!').valid).toBeFalse();
      expect(service.validatePassword('NOLOWERCASE123!').valid).toBeFalse();
      expect(service.validatePassword('NoDigits!').valid).toBeFalse();
      expect(service.validatePassword('NoSpecial123').valid).toBeFalse();
      expect(service.validatePassword('Valid123!').valid).toBeTrue();
    });

    it('should return appropriate error messages', () => {
      const result = service.validatePassword('short');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('al menos 8 caracteres');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile correctly', () => {
      // Setup a logged in state first
      const originalUser = {
        id: '1',
        name: 'Original Name',
        email: 'original@example.com',
        role: UserRole.USER,
        createdAt: new Date()
      };
      service['currentUserSignal'].set(originalUser);
      localStorage.setItem('auth-token', 'test-token');

      const updatedUser = {
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: UserRole.USER,
        createdAt: originalUser.createdAt
      };

      let result = false;
      service.updateUserProfile('Updated Name', 'updated@example.com').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        ...originalUser,
        username: 'Updated Name',
        email: 'updated@example.com'
      });

      req.flush(updatedUser);

      expect(result).toBeTrue();
      expect(service.currentUser?.name).toBe('Updated Name');
      expect(service.currentUser?.email).toBe('updated@example.com');
    });

    it('should handle profile update failure', () => {
      // Setup a logged in state first
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
        createdAt: new Date()
      };
      service['currentUserSignal'].set(user);
      localStorage.setItem('auth-token', 'test-token');

      let result = true;
      service.updateUserProfile('Test User', 'existing@example.com').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/users/1`);
      req.error(new ErrorEvent('error', { message: 'Email already in use' }));

      expect(result).toBeFalse();
    });

    it('should return false if user is not logged in', () => {
      service['currentUserSignal'].set(null);
      
      let result = true;
      service.updateUserProfile('Name', 'email@example.com').subscribe(res => {
        result = res;
      });

      expect(result).toBeFalse();
      httpMock.expectNone(`${API_URL}/users`);
    });
  });

  describe('updatePassword', () => {
    it('should currently return false for password update (not implemented)', () => {
      let result = true;
      service.updatePassword('OldPass123!', 'NewPass456!').subscribe(res => {
        result = res;
      });

      expect(result).toBeFalse();
    });
  });
});