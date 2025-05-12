import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create spies
    authService = jasmine.createSpyObj('AuthService', ['login'], {
      isLoggedIn: false
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with a form containing email and password fields', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  it('should mark email as invalid with incorrect format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should mark form valid with correct inputs', () => {
    component.loginForm.setValue({
      email: 'valid@example.com',
      password: 'Password123!'
    });
    
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should not submit with invalid form', () => {
    spyOn(component, 'onSubmit').and.callThrough();
    
    // Leave form invalid
    component.loginForm.setValue({
      email: 'invalid-email',
      password: ''
    });
    
    // Submit the form
    component.onSubmit();
    
    // Ensure service was not called
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call AuthService.login with form values on valid submission', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    // Mock successful login
    authService.login.and.returnValue(true);
    
    // Submit the form
    component.onSubmit();
    
    // Verify service was called with form values
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
  });

  it('should navigate to home page on successful login', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    // Mock successful login
    authService.login.and.returnValue(true);
    
    // Submit the form
    component.onSubmit();
    
    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should display error message on failed login', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'WrongPassword123!'
    });
    
    // Mock failed login
    authService.login.and.returnValue(false);
    
    // Submit the form
    component.onSubmit();
    
    // Verify error message
    expect(component.errorMessage).toBeTruthy();
    expect(component.errorMessage).toContain('incorrectos');
    
    // Verify navigation was not called
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to home if already logged in', () => {
    // Reset the component with isLoggedIn returning true
    TestBed.resetTestingModule();
    
    const loggedInAuthService = jasmine.createSpyObj('AuthService', ['login'], {
      isLoggedIn: true
    });
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: AuthService, useValue: loggedInAuthService },
        { provide: Router, useValue: newRouter }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    
    // Verify navigation happened in the constructor
    expect(newRouter.navigate).toHaveBeenCalledWith(['/home']);
  });
});