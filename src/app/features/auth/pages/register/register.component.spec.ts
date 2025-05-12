import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create spies
    authService = jasmine.createSpyObj('AuthService', 
      ['register', 'validatePassword'], 
      {
        isLoggedIn: false
      }
    );
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with a form containing required fields', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('name')).toBeDefined();
    expect(component.registerForm.get('email')).toBeDefined();
    expect(component.registerForm.get('password')).toBeDefined();
    expect(component.registerForm.get('confirmPassword')).toBeDefined();
  });

  it('should mark name as invalid if less than 3 characters', () => {
    const nameControl = component.registerForm.get('name');
    nameControl?.setValue('ab');
    
    expect(nameControl?.valid).toBeFalse();
    expect(nameControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should mark email as invalid with incorrect format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('invalid-email');
    
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should detect password mismatch', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!'
    });
    
    expect(component.registerForm.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should mark form valid with correct inputs and matching passwords', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });
    
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    
    // Manually trigger password validation since it's not automatically called
    component.validatePassword();
    
    expect(component.registerForm.valid).toBeTrue();
  });

  it('should validate password using AuthService', () => {
    // Mock invalid password
    authService.validatePassword.and.returnValue({ 
      valid: false, 
      errors: ['Password must contain at least one uppercase letter'] 
    });
    
    component.registerForm.get('password')?.setValue('weak');
    component.validatePassword();
    
    expect(component.passwordValidationErrors.length).toBeGreaterThan(0);
    expect(component.registerForm.get('password')?.errors?.['invalidPassword']).toBeTrue();
  });

  it('should not submit with invalid form', () => {
    spyOn(component, 'onSubmit').and.callThrough();
    
    // Leave form invalid
    component.registerForm.setValue({
      name: 'Test',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!'
    });
    
    // Submit the form
    component.onSubmit();
    
    // Ensure service was not called
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should call AuthService.register with form values on valid submission', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });
    
    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    
    // Mock successful registration
    authService.register.and.returnValue(true);
    
    // Submit the form
    component.onSubmit();
    
    // Verify service was called with form values
    expect(authService.register).toHaveBeenCalledWith(
      'Test User', 
      'test@example.com', 
      'Password123!'
    );
  });

  it('should navigate to home page on successful registration', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });
    
    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    
    // Mock successful registration
    authService.register.and.returnValue(true);
    
    // Submit the form
    component.onSubmit();
    
    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should display error message on failed registration', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });
    
    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    
    // Mock failed registration
    authService.register.and.returnValue(false);
    
    // Submit the form
    component.onSubmit();
    
    // Verify error message
    expect(component.errorMessage).toBeTruthy();
    expect(component.errorMessage).toContain('Email already exists');
    
    // Verify navigation was not called
    expect(router.navigate).not.toHaveBeenCalled();
  });
});