import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Create router spy
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    // Get service and mocked dependencies
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage to ensure clean state
    localStorage.clear();
    service['initializeUserStorage']();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no logged in user', () => {
    expect(service.isLoggedIn).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  it('should register a new user successfully', () => {
    const result = service.register(
      'Test User',
      'test@example.com',
      'Password123!'
    );

    expect(result).toBeTrue();
    expect(service.isLoggedIn).toBeTrue();

    const user = service.currentUser;
    expect(user).toBeTruthy();
    expect(user?.name).toBe('Test User');
    expect(user?.email).toBe('test@example.com');
    expect(user?.role).toBe(UserRole.USER);
  });

  it('should not register a user with existing email', () => {
    // Register first user
    service.register('Test User', 'duplicate@example.com', 'Password123!');
    service.logout();

    // Try to register with same email
    const result = service.register(
      'Another User',
      'duplicate@example.com',
      'Password456!'
    );

    expect(result).toBeFalse();
    expect(service.isLoggedIn).toBeFalse();
  });

  it('should validate password requirements correctly', () => {
    expect(service.validatePassword('short')).toBeFalse();
    expect(service.validatePassword('nouppercase123!')).toBeFalse();
    expect(service.validatePassword('NOLOWERCASE123!')).toBeFalse();
    expect(service.validatePassword('NoDigits!')).toBeFalse();
    expect(service.validatePassword('NoSpecial123')).toBeFalse();
    expect(service.validatePassword('Valid123!')).toBeTrue();
  });

  it('should login with correct credentials', () => {
    // Register user first
    service.register('Test User', 'login@example.com', 'Password123!');
    service.logout();

    // Login
    const result = service.login('login@example.com', 'Password123!');

    expect(result).toBeTrue();
    expect(service.isLoggedIn).toBeTrue();
    expect(service.currentUser?.email).toBe('login@example.com');
  });

  it('should login with mock admin credentials', () => {
    const result = service.login('admin@forum.com', 'Admin123!');

    expect(result).toBeTrue();
    expect(service.isLoggedIn).toBeTrue();
    expect(service.isAdmin).toBeTrue();
  });

  it('should not login with incorrect credentials', () => {
    const result = service.login('wrong@example.com', 'WrongPassword123!');

    expect(result).toBeFalse();
    expect(service.isLoggedIn).toBeFalse();
  });

  it('should logout user and navigate to login', () => {
    // Login first
    service.login('admin@forum.com', 'Admin123!');

    // Logout
    service.logout();

    expect(service.isLoggedIn).toBeFalse();
    expect(service.currentUser).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should update user profile correctly', () => {
    // Register user first
    service.register('Original Name', 'original@example.com', 'Password123!');

    // Update profile
    const result = service.updateUserProfile(
      'Updated Name',
      'updated@example.com'
    );

    expect(result).toBeTrue();
    expect(service.currentUser?.name).toBe('Updated Name');
    expect(service.currentUser?.email).toBe('updated@example.com');
  });

  it('should handle email conflict during profile update', () => {
    // Register two users
    service.register('User One', 'one@example.com', 'Password123!');
    service.logout();
    service.register('User Two', 'two@example.com', 'Password123!');

    // Try to update second user to first user's email
    const result = service.updateUserProfile(
      'User Two Updated',
      'one@example.com'
    );

    expect(result).toBeFalse();
  });

  it('should update password with correct current password', () => {
    // Register user
    service.register('Test User', 'password@example.com', 'OldPass123!');

    // Update password
    const result = service.updatePassword('OldPass123!', 'NewPass456!');

    expect(result).toBeTrue();

    // Verify by logging out and in with new password
    service.logout();
    const loginResult = service.login('password@example.com', 'NewPass456!');

    expect(loginResult).toBeTrue();
  });

  it('should not update password with incorrect current password', () => {
    // Register user
    service.register('Test User', 'password@example.com', 'Correct123!');

    // Try update with wrong password
    const result = service.updatePassword('Wrong123!', 'NewPass456!');

    expect(result).toBeFalse();
  });

  it('should not update password with invalid new password', () => {
    // Register user
    service.register('Test User', 'password@example.com', 'Correct123!');

    // Try update with invalid new password
    const result = service.updatePassword('Correct123!', 'weak');

    expect(result).toBeFalse();
  });

  it('should identify admin users correctly', () => {
    // Login as regular user
    service.register('Regular User', 'regular@example.com', 'Password123!');
    expect(service.isAdmin).toBeFalse();

    // Login as admin
    service.logout();
    service.login('admin@forum.com', 'Admin123!');
    expect(service.isAdmin).toBeTrue();
  });
});
