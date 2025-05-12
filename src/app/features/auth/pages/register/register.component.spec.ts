import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    // Create spies
    authService = jasmine.createSpyObj(
      'AuthService',
      ['register', 'validatePassword'],
      {
        isLoggedIn: false,
      }
    );
    router = jasmine.createSpyObj('Router', ['navigate']);
    toastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
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

    // Mock password validation to return valid by default
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

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
    
    expect(component.registerForm.get('name')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should initialize with empty error message and password validation errors', () => {
    expect(component.errorMessage).toBe('');
    
    // Check that all password error types are initialized
    expect(Object.keys(component.passwordErrorTypes).length).toBeGreaterThan(0);
    
    // All error types should be true initially (since password is empty)
    Object.values(component.passwordErrorTypes).forEach(errorFlag => {
      expect(errorFlag).toBeTrue();
    });
  });

  it('should mark name as invalid if less than 3 characters', () => {
    const nameControl = component.registerForm.get('name');
    nameControl?.setValue('ab');

    expect(nameControl?.valid).toBeFalse();
    expect(nameControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should mark name as valid with 3 or more characters', () => {
    const nameControl = component.registerForm.get('name');
    nameControl?.setValue('abc');

    expect(nameControl?.valid).toBeTrue();
    expect(nameControl?.errors).toBeNull();
  });

  it('should mark email as invalid with incorrect format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('invalid-email');

    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should mark email as valid with correct format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('valid@example.com');

    expect(emailControl?.valid).toBeTrue();
    expect(emailControl?.errors).toBeNull();
  });

  it('should detect password mismatch', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
    });

    expect(component.registerForm.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should not have passwordMismatch error when passwords match', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
  });

  it('should mark form valid with correct inputs and matching passwords', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Manually trigger password validation since it's not automatically called
    component.validatePassword();

    expect(component.registerForm.valid).toBeTrue();
  });

  it('should validate password using AuthService on component initialization', () => {
    // This should have been called in the constructor
    expect(authService.validatePassword).toHaveBeenCalled();
  });

  it('should validate password using AuthService when validatePassword is called', () => {
    const password = 'Password123!';
    component.registerForm.get('password')?.setValue(password);
    
    // Reset the call count
    authService.validatePassword.calls.reset();
    
    component.validatePassword();
    
    expect(authService.validatePassword).toHaveBeenCalledWith(password);
  });

  it('should set password validation errors from AuthService', () => {
    // Mock invalid password with multiple errors
    const mockErrors = [
      'La contraseña debe tener al menos 8 caracteres',
      'La contraseña debe contener al menos una letra mayúscula'
    ];
    
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: mockErrors
    });

    component.registerForm.get('password')?.setValue('weak');
    component.validatePassword();

    expect(component.passwordValidationErrors).toEqual(mockErrors);
    expect(component.registerForm.get('password')?.errors?.['invalidPassword']).toBeTrue();
  });

  it('should reset all password error type flags before evaluating new errors', () => {
    // First set password with one type of error
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: ['La contraseña debe tener al menos 8 caracteres']
    });
    
    component.registerForm.get('password')?.setValue('short');
    component.validatePassword();
    
    expect(component.passwordErrorTypes.minlength).toBeTrue();
    expect(component.passwordErrorTypes.uppercase).toBeFalse();
    
    // Then change to password with different error
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: ['La contraseña debe contener al menos una letra mayúscula']
    });
    
    component.registerForm.get('password')?.setValue('longenoughbutmissinguppercase123!');
    component.validatePassword();
    
    // The previous error should now be false, and the new error should be true
    expect(component.passwordErrorTypes.minlength).toBeFalse();
    expect(component.passwordErrorTypes.uppercase).toBeTrue();
  });

  it('should set specific password error flags correctly for each error type', () => {
    // Test all error types
    const allErrors = [
      'La contraseña debe tener al menos 8 caracteres',
      'La contraseña debe tener menos de 30 caracteres',
      'La contraseña debe contener al menos una letra mayúscula',
      'La contraseña debe contener al menos un número',
      'La contraseña debe contener al menos un carácter especial'
    ];
    
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: allErrors
    });

    component.registerForm.get('password')?.setValue('bad');
    component.validatePassword();

    expect(component.passwordErrorTypes.minlength).toBeTrue();
    expect(component.passwordErrorTypes.maxlength).toBeTrue();
    expect(component.passwordErrorTypes.uppercase).toBeTrue();
    expect(component.passwordErrorTypes.digit).toBeTrue();
    expect(component.passwordErrorTypes.specialChar).toBeTrue();
  });

  it('should correctly check if a specific error type exists using hasError method', () => {
    // Set only one specific error
    authService.validatePassword.and.returnValue({
      valid: false,
      errors: ['La contraseña debe contener al menos un número']
    });
    
    component.registerForm.get('password')?.setValue('Password!');
    component.validatePassword();
    
    expect(component.hasError('digit')).toBeTrue();
    expect(component.hasError('uppercase')).toBeFalse();
    expect(component.hasError('specialChar')).toBeFalse();
  });

  it('should mark form controls as touched when submitting an invalid form', () => {
    spyOn(component.registerForm, 'markAllAsTouched');
    
    // Create invalid form
    component.registerForm.setValue({
      name: '',
      email: 'invalid',
      password: 'short',
      confirmPassword: 'different'
    });
    
    component.onSubmit();
    
    expect(component.registerForm.markAllAsTouched).toHaveBeenCalled();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should validate password before submitting the form', () => {
    spyOn(component, 'validatePassword');
    
    component.onSubmit();
    
    expect(component.validatePassword).toHaveBeenCalled();
  });

  it('should call AuthService.register with form values on valid submission', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Mock successful registration
    authService.register.and.returnValue(of(true));

    // Submit the form
    component.onSubmit();

    // Verify service was called with form values
    expect(authService.register).toHaveBeenCalledWith(
      'Test User',
      'test@example.com',
      'Password123!'
    );
  });

  it('should handle successful registration response correctly', () => {
    component.handleRegisterResponse(true);
    
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.errorMessage).toBe('');
  });

  it('should handle failed registration response correctly', () => {
    component.handleRegisterResponse(false);
    
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Error al registrar el usuario');
  });

  it('should navigate to login page on successful registration', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Mock successful registration
    authService.register.and.returnValue(of(true));

    // Submit the form
    component.onSubmit();

    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display error message on failed registration', () => {
    // Mock password validation to return valid
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });

    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Mock failed registration
    authService.register.and.returnValue(of(false));

    // Submit the form
    component.onSubmit();

    // Verify error message
    expect(component.errorMessage).toBeTruthy();
    expect(component.errorMessage).toContain('Error al registrar');

    // Verify navigation was not called
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle registration API error gracefully', () => {
    // Set valid form values
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Mock registration error
    const errorResponse = new Error('Network error');
    authService.register.and.returnValue(throwError(() => errorResponse));

    // Prevent console.error output in test
    spyOn(console, 'error');

    // Submit the form
    expect(() => {
      component.onSubmit();
    }).not.toThrow();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();

    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();

    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword).toBeFalse();

    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeTrue();

    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeFalse();
  });

  // UI Tests
  it('should have a register form with all required fields', () => {
    const form = fixture.debugElement.query(By.css('form'));
    const nameInput = fixture.debugElement.query(By.css('#name'));
    const emailInput = fixture.debugElement.query(By.css('#email'));
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordInput = fixture.debugElement.query(By.css('#confirmPassword'));
    
    expect(form).toBeTruthy();
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('should have password visibility toggle buttons', () => {
    const passwordToggleBtn = fixture.debugElement.query(By.css('button[type="button"]:nth-of-type(1)'));
    const confirmPasswordToggleBtn = fixture.debugElement.query(By.css('button[type="button"]:nth-of-type(2)'));
    
    expect(passwordToggleBtn).toBeTruthy();
    expect(confirmPasswordToggleBtn).toBeTruthy();
  });

  it('should toggle password input type when visibility button is clicked', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password')).nativeElement;
    const passwordToggleBtn = fixture.debugElement.query(By.css('button[type="button"]:nth-of-type(1)')).nativeElement;
    
    // Initial state: password is hidden
    expect(passwordInput.type).toBe('password');
    
    // Click to show password
    passwordToggleBtn.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');
    
    // Click again to hide password
    passwordToggleBtn.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });

  it('should show password requirement indicators', () => {
    const requirementsList = fixture.debugElement.queryAll(By.css('.password-hints ul li'));
    
    // Should have 5 requirement items
    expect(requirementsList.length).toBe(5);
    
    // Initially all should be text-muted because password is empty
    requirementsList.forEach(item => {
      expect(item.classes['text-muted']).toBeTrue();
    });
    
    // When password meets requirements, the indicators should change to text-success
    authService.validatePassword.and.returnValue({ valid: true, errors: [] });
    component.registerForm.get('password')?.setValue('ValidPassword123!');
    component.validatePassword();
    fixture.detectChanges();
    
    const updatedRequirementsList = fixture.debugElement.queryAll(By.css('.password-hints ul li'));
    updatedRequirementsList.forEach(item => {
      expect(item.classes['text-success']).toBeTrue();
      expect(item.classes['text-muted']).toBeFalsy();
    });
  });

  it('should show validation errors when form controls are invalid and touched', () => {
    // Get controls and mark them as touched
    const nameControl = component.registerForm.get('name');
    const emailControl = component.registerForm.get('email');
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    
    nameControl?.setValue('');
    nameControl?.markAsTouched();
    
    emailControl?.setValue('invalid');
    emailControl?.markAsTouched();
    
    passwordControl?.setValue('');
    passwordControl?.markAsTouched();
    
    confirmPasswordControl?.setValue('');
    confirmPasswordControl?.markAsTouched();
    
    component.registerForm.setErrors({ passwordMismatch: true });
    
    fixture.detectChanges();
    
    const nameError = fixture.debugElement.query(By.css('div:nth-of-type(1) .text-danger'));
    const emailError = fixture.debugElement.query(By.css('div:nth-of-type(2) .text-danger'));
    const passwordError = fixture.debugElement.query(By.css('div:nth-of-type(3) .text-danger'));
    const confirmPasswordError = fixture.debugElement.query(By.css('div:nth-of-type(4) .text-danger'));
    const passwordMismatchError = fixture.debugElement.query(By.css('div:nth-of-type(4) div:nth-of-type(2)'));
    
    expect(nameError).toBeTruthy();
    expect(nameError.nativeElement.textContent).toContain('requerido');
    
    expect(emailError).toBeTruthy();
    expect(emailError.nativeElement.textContent).toContain('válido');
    
    expect(passwordError).toBeTruthy();
    expect(passwordError.nativeElement.textContent).toContain('requerida');
    
    expect(confirmPasswordError).toBeTruthy();
    expect(confirmPasswordError.nativeElement.textContent).toContain('confirma');
    
    expect(passwordMismatchError).toBeTruthy();
    expect(passwordMismatchError.nativeElement.textContent).toContain('no coinciden');
  });

  it('should call validatePassword when password input changes', () => {
    spyOn(component, 'validatePassword');
    
    const passwordInput = fixture.debugElement.query(By.css('#password')).nativeElement;
    passwordInput.value = 'newPassword123!';
    passwordInput.dispatchEvent(new Event('input'));
    
    expect(component.validatePassword).toHaveBeenCalled();
  });

  it('should have a register button', () => {
    const registerButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(registerButton).toBeTruthy();
    expect(registerButton.nativeElement.textContent).toContain('Registrarse');
  });

  it('should call onSubmit when form is submitted', () => {
    spyOn(component, 'onSubmit');
    
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);
    
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should have link to login page', () => {
    const loginLink = fixture.debugElement.query(By.css('a[routerLink="/login"]'));
    
    expect(loginLink).toBeTruthy();
    expect(loginLink.nativeElement.textContent).toContain('Iniciar Sesión');
  });

  it('should show error alert when errorMessage is set', () => {
    // Initially, error message should be empty
    let errorAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(errorAlert).toBeNull();
    
    // Set error message
    component.errorMessage = 'Test error message';
    fixture.detectChanges();
    
    // Error alert should now be visible
    errorAlert = fixture.debugElement.query(By.css('.alert-danger'));
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.nativeElement.textContent).toContain('Test error message');
  });

  it('should update form values when input values change', () => {
    const nameInput = fixture.debugElement.query(By.css('#name')).nativeElement;
    const emailInput = fixture.debugElement.query(By.css('#email')).nativeElement;
    const passwordInput = fixture.debugElement.query(By.css('#password')).nativeElement;
    const confirmPasswordInput = fixture.debugElement.query(By.css('#confirmPassword')).nativeElement;
    
    nameInput.value = 'Test User';
    nameInput.dispatchEvent(new Event('input'));
    
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    
    passwordInput.value = 'Password123!';
    passwordInput.dispatchEvent(new Event('input'));
    
    confirmPasswordInput.value = 'Password123!';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    
    expect(component.registerForm.get('name')?.value).toBe('Test User');
    expect(component.registerForm.get('email')?.value).toBe('test@example.com');
    // Password validation is called on input event, so the mock AuthService should have been called
    expect(authService.validatePassword).toHaveBeenCalledWith('Password123!');
  });
});