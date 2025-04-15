import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  passwordValidationErrors: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password === confirmPassword) {
      return null;
    }
    
    return { passwordMismatch: true };
  }
  
  validatePassword() {
    const password = this.registerForm.get('password')?.value;
    if (!password) return;
    
    const validation = this.authService.validatePassword(password);
    this.passwordValidationErrors = validation.errors;
    
    if (!validation.valid) {
      this.registerForm.get('password')?.setErrors({ invalidPassword: true });
    }
  }
  
  onSubmit(): void {
    this.validatePassword();
    
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    const { name, email, password } = this.registerForm.value;
    const success = this.authService.register(name, email, password);
    
    if (success) {
      this.router.navigate(['/home']);
    } else {
      this.errorMessage = 'Email already exists';
    }
  }
}