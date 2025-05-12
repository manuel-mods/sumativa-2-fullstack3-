import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    // Create spies
    authService = jasmine.createSpyObj('AuthService', ['login'], {
      isLoggedIn: false,
    });
    router = jasmine.createSpyObj('Router', ['navigate']);
    toastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        HttpClientTestingModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastrService },
      ],
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
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should mark form controls as invalid when empty', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');
    
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['required']).toBeTrue();
    
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['required']).toBeTrue();
    
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should mark form valid with correct inputs', () => {
    component.loginForm.setValue({
      email: 'valid@example.com',
      password: 'Password123!',
    });

    expect(component.loginForm.valid).toBeTrue();
  });

  it('should mark form controls as touched when submitting an invalid form', () => {
    spyOn(component.loginForm, 'markAllAsTouched');
    
    // Leave form invalid
    component.loginForm.setValue({
      email: '',
      password: '',
    });
    
    // Submit the form
    component.onSubmit();
    
    expect(component.loginForm.markAllAsTouched).toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should show validation error messages when form controls are invalid and touched', () => {
    // Get controls and mark them as touched
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');
    
    emailControl?.setValue('');
    emailControl?.markAsTouched();
    
    passwordControl?.setValue('');
    passwordControl?.markAsTouched();
    
    fixture.detectChanges();
    
    const emailError = fixture.debugElement.query(By.css('div:nth-of-type(1) .text-danger'));
    const passwordError = fixture.debugElement.query(By.css('div:nth-of-type(2) .text-danger'));
    
    expect(emailError).toBeTruthy();
    expect(emailError.nativeElement.textContent).toContain('requerido');
    
    expect(passwordError).toBeTruthy();
    expect(passwordError.nativeElement.textContent).toContain('requerida');
  });

  it('should call AuthService.login with form values on valid submission', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123!',
    });

    // Mock successful login
    authService.login.and.returnValue(of(true));

    // Submit the form
    component.onSubmit();

    // Verify service was called with form values
    expect(authService.login).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!'
    );
  });

  it('should handle successful login response correctly', () => {
    component.handleLoginResponse(true);
    
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.errorMessage).toBe('');
  });

  it('should handle failed login response correctly', () => {
    component.handleLoginResponse(false);
    
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Email o contraseña incorrectos');
  });

  it('should navigate to home page on successful login', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123!',
    });

    // Mock successful login
    authService.login.and.returnValue(of(true));

    // Submit the form
    component.onSubmit();

    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should display error message on failed login', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'WrongPassword123!',
    });

    // Mock failed login
    authService.login.and.returnValue(of(false));

    // Submit the form
    component.onSubmit();

    // Verify error message
    expect(component.errorMessage).toBeTruthy();
    expect(component.errorMessage).toContain('incorrectos');

    // Verify navigation was not called
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle login API error gracefully', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123!',
    });

    // Mock login error
    const errorResponse = new Error('Network error');
    authService.login.and.returnValue(throwError(() => errorResponse));

    // Prevent console.error output in test
    spyOn(console, 'error');

    // Submit the form
    expect(() => {
      component.onSubmit();
    }).not.toThrow();

    // Verify error was handled (no error message is set in this case as it relies on the authService to handle errors)
    expect(console.error).not.toHaveBeenCalled(); // Error is handled in auth service
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to home if already logged in', () => {
    // Reset the component with isLoggedIn returning true
    TestBed.resetTestingModule();

    const loggedInAuthService = jasmine.createSpyObj('AuthService', ['login'], {
      isLoggedIn: true,
    });
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [LoginComponent, CommonModule, ReactiveFormsModule, RouterLink],
      providers: [
        { provide: AuthService, useValue: loggedInAuthService },
        { provide: Router, useValue: newRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);

    // Verify navigation happened in the constructor
    expect(newRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  // UI Element and Interaction Tests
  it('should have a login form with email and password inputs', () => {
    const form = fixture.debugElement.query(By.css('form'));
    const emailInput = fixture.debugElement.query(By.css('input#email'));
    const passwordInput = fixture.debugElement.query(By.css('input#password'));
    
    expect(form).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('should have a login button', () => {
    const loginButton = fixture.debugElement.query(By.css('button[type="button"]'));
    
    expect(loginButton).toBeTruthy();
    expect(loginButton.nativeElement.textContent.trim()).toContain('Iniciar Sesión');
  });

  it('should call onSubmit method when login button is clicked', () => {
    spyOn(component, 'onSubmit');
    
    const loginButton = fixture.debugElement.query(By.css('button[type="button"]')).nativeElement;
    loginButton.click();
    
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should have links to forgot password and register pages', () => {
    const forgotPasswordLink = fixture.debugElement.query(By.css('a[routerLink="/forgot-password"]'));
    const registerLink = fixture.debugElement.query(By.css('a[routerLink="/register"]'));
    
    expect(forgotPasswordLink).toBeTruthy();
    expect(forgotPasswordLink.nativeElement.textContent).toContain('Olvidaste tu contraseña');
    
    expect(registerLink).toBeTruthy();
    expect(registerLink.nativeElement.textContent).toContain('Regístrate');
  });

  it('should display error alert when errorMessage is set', () => {
    // Initially, error message should be empty
    let errorAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(errorAlert).toBeNull();
    
    // Set error message
    component.errorMessage = 'Test error message';
    fixture.detectChanges();
    
    // Error alert should now be visible
    errorAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.nativeElement.textContent.trim()).toBe('Test error message');
  });

  it('should update form values when input values change', () => {
    const emailInput = fixture.debugElement.query(By.css('input#email')).nativeElement;
    const passwordInput = fixture.debugElement.query(By.css('input#password')).nativeElement;
    
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    
    passwordInput.value = 'Password123!';
    passwordInput.dispatchEvent(new Event('input'));
    
    expect(component.loginForm.get('email')?.value).toBe('test@example.com');
    expect(component.loginForm.get('password')?.value).toBe('Password123!');
  });
});