import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ProfileEditComponent } from './profile-edit.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../../core/models/user.model';
import { Observable, of } from 'rxjs';

describe('ProfileEditComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Create spies
    authService = jasmine.createSpyObj(
      'AuthService',
      ['updateUserProfile', 'updatePassword', 'validatePassword'],
      {
        currentUser: mockUser,
        isLoggedIn: true,
      }
    );

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent, CommonModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if not logged in', () => {
    // Reset component with no current user
    TestBed.resetTestingModule();

    const newAuthService = jasmine.createSpyObj(
      'AuthService',
      ['updateUserProfile', 'updatePassword', 'validatePassword'],
      {
        currentUser: null,
        isLoggedIn: false,
      }
    );

    const newRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ProfileEditComponent, CommonModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: newAuthService },
        { provide: Router, useValue: newRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Verify navigation
    expect(newRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load user data on init', () => {
    expect(component.profileForm.get('name')?.value).toBe('Test User');
    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
  });

  it('should initialize with profile tab active', () => {
    expect(component.activeTab).toBe('profile');
  });

  it('should change active tab when setActiveTab is called', () => {
    component.setActiveTab('password');

    expect(component.activeTab).toBe('password');
    expect(component.successMessage).toBe('');
    expect(component.passwordErrors.length).toBe(0);
  });

  it('should mark profileForm invalid with empty fields', () => {
    component.profileForm.setValue({
      name: '',
      email: '',
    });

    expect(component.profileForm.valid).toBeFalse();
  });

  it('should mark name invalid if less than 3 characters', () => {
    component.profileForm.get('name')?.setValue('ab');

    expect(component.profileForm.get('name')?.valid).toBeFalse();
    expect(
      component.profileForm.get('name')?.errors?.['minlength']
    ).toBeTruthy();
  });

  it('should mark email invalid with incorrect format', () => {
    component.profileForm.get('email')?.setValue('invalid-email');

    expect(component.profileForm.get('email')?.valid).toBeFalse();
    expect(component.profileForm.get('email')?.errors?.['email']).toBeTruthy();
  });

  it('should not submit profile with invalid form', () => {
    component.profileForm.setValue({
      name: 'ab',
      email: 'invalid-email',
    });

    component.onSubmitProfile();

    expect(authService.updateUserProfile).not.toHaveBeenCalled();
  });

  it('should update profile with valid form data', fakeAsync(() => {
    component.profileForm.setValue({
      name: 'Updated Name',
      email: 'updated@example.com',
    });

    component.onSubmitProfile();

    expect(authService.updateUserProfile).toHaveBeenCalledWith(
      'Updated Name',
      'updated@example.com'
    );
    expect(component.successMessage).toBe('Profile updated successfully');

    // Test success message timeout
    tick(3000);
    expect(component.successMessage).toBe('');
  }));

  it('should validate passwords match on password update', () => {
    component.passwordForm.setValue({
      currentPassword: 'CurrentPass123!',
      newPassword: 'NewPass123!',
      confirmPassword: 'DifferentPass123!',
    });

    component.onSubmitPassword();

    expect(component.passwordErrors.length).toBeGreaterThan(0);
    expect(component.passwordErrors[0]).toContain('do not match');
    expect(authService.validatePassword).not.toHaveBeenCalled();
    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('should validate password strength on password update', () => {
    component.passwordForm.setValue({
      currentPassword: 'CurrentPass123!',
      newPassword: 'weak',
      confirmPassword: 'weak',
    });

    // Mock password validation to return invalid
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: ['Password must be at least 8 characters'],
    });

    component.onSubmitPassword();

    expect(authService.validatePassword).toHaveBeenCalledWith('weak');
    expect(component.passwordErrors.length).toBeGreaterThan(0);
    expect(component.passwordErrors[0]).toContain('at least 8 characters');
    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle incorrect current password on password update', () => {
    component.passwordForm.setValue({
      currentPassword: 'WrongCurrentPass123!',
      newPassword: 'StrongNewPass123!',
      confirmPassword: 'StrongNewPass123!',
    });

    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

    // Mock updatePassword to return false (incorrect current password)
    authService.updatePassword.and.returnValue(of(false));

    component.onSubmitPassword();

    expect(authService.validatePassword).toHaveBeenCalledWith(
      'StrongNewPass123!'
    );
    expect(authService.updatePassword).toHaveBeenCalledWith(
      'WrongCurrentPass123!',
      'StrongNewPass123!'
    );

    expect(component.passwordErrors.length).toBeGreaterThan(0);
    expect(component.passwordErrors[0]).toContain(
      'Current password is incorrect'
    );
  });

  it('should successfully update password with valid data', fakeAsync(() => {
    component.passwordForm.setValue({
      currentPassword: 'CurrentPass123!',
      newPassword: 'StrongNewPass123!',
      confirmPassword: 'StrongNewPass123!',
    });

    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

    // Mock updatePassword to return true (success)
    authService.updatePassword.and.returnValue(of(true));

    component.onSubmitPassword();

    expect(authService.validatePassword).toHaveBeenCalledWith(
      'StrongNewPass123!'
    );
    expect(authService.updatePassword).toHaveBeenCalledWith(
      'CurrentPass123!',
      'StrongNewPass123!'
    );

    expect(component.successMessage).toBe('Password updated successfully');
    expect(component.passwordErrors.length).toBe(0);

    // Check form was reset
    expect(component.passwordForm.value.currentPassword).toBeFalsy();
    expect(component.passwordForm.value.newPassword).toBeFalsy();
    expect(component.passwordForm.value.confirmPassword).toBeFalsy();

    // Test success message timeout
    tick(3000);
    expect(component.successMessage).toBe('');
  }));
});
