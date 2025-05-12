import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  submitted = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.isLoading) {
      return; // Prevent multiple submissions
    }

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      // Simulate API call with delay
      setTimeout(() => {
        try {
          console.log('Reset password for:', this.forgotPasswordForm.value.email);
          this.toastr.success(
            'Instrucciones enviadas, revisa tu correo para completar el proceso',
            'Email enviado'
          );
          this.isLoading = false;
          this.submitted = true;
        } catch (error) {
          this.handleError(error);
        }
      }, 1500);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    console.error('Error in forgot password:', error);
    this.isLoading = false;
    this.toastr.error(
      'Ha ocurrido un error, intenta nuevamente',
      'Error'
    );
  }
}