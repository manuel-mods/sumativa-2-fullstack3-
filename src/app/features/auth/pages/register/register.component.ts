import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  passwordValidationErrors: string[] = [];
  showPassword = false;
  showConfirmPassword = false;

  // Track specific password validation errors
  passwordErrorTypes = {
    minlength: false,
    maxlength: false,
    uppercase: false,
    digit: false,
    specialChar: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    // Initialize password validation on component load
    this.validatePassword();
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validatePassword() {
    const password = this.registerForm.get('password')?.value;
    if (!password) {
      // Initialize all error types as true when no password
      Object.keys(this.passwordErrorTypes).forEach(key => {
        this.passwordErrorTypes[key as keyof typeof this.passwordErrorTypes] = true;
      });
      return;
    }

    const validation = this.authService.validatePassword(password);
    this.passwordValidationErrors = validation.errors;

    // Reset all error types
    Object.keys(this.passwordErrorTypes).forEach(key => {
      this.passwordErrorTypes[key as keyof typeof this.passwordErrorTypes] = false;
    });

    // Set specific error flags based on validation errors
    this.passwordValidationErrors.forEach(error => {
      if (error.includes('al menos 8 caracteres')) {
        this.passwordErrorTypes.minlength = true;
      }
      if (error.includes('menos de 30 caracteres')) {
        this.passwordErrorTypes.maxlength = true;
      }
      if (error.includes('letra mayúscula')) {
        this.passwordErrorTypes.uppercase = true;
      }
      if (error.includes('un número')) {
        this.passwordErrorTypes.digit = true;
      }
      if (error.includes('carácter especial')) {
        this.passwordErrorTypes.specialChar = true;
      }
    });

    if (!validation.valid) {
      this.registerForm.get('password')?.setErrors({ invalidPassword: true });
    }
  }

  hasError(errorType: string): boolean {
    return this.passwordErrorTypes[errorType as keyof typeof this.passwordErrorTypes];
  }

  onSubmit(): void {
    this.validatePassword();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.value;
    this.authService.register(name, email, password).subscribe((success) => {
      this.handleRegisterResponse(success);
    });
  }

  handleRegisterResponse(success: boolean) {
    if (success) {
      this.router.navigate(['/login']);
    } else {
      this.errorMessage = 'Error al registrar el usuario';
    }
  }
}
