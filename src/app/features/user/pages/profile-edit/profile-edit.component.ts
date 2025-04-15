import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  successMessage = '';
  passwordErrors: string[] = [];
  activeTab = 'profile'; // 'profile' or 'password'
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Load user data
    const user = this.authService.currentUser;
    this.profileForm.patchValue({
      name: user.name,
      email: user.email
    });
  }
  
  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    const { name, email } = this.profileForm.value;
    this.authService.updateUserProfile(name, email);
    this.successMessage = 'Profile updated successfully';
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    
    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      this.passwordErrors = ['New password and confirm password do not match'];
      return;
    }

    // Validate password strength
    const validation = this.authService.validatePassword(newPassword);
    if (!validation.valid) {
      this.passwordErrors = validation.errors;
      return;
    }

    // Update password
    const success = this.authService.updatePassword(currentPassword, newPassword);
    if (success) {
      this.successMessage = 'Password updated successfully';
      this.passwordForm.reset();
      this.passwordErrors = [];
    } else {
      this.passwordErrors = ['Current password is incorrect'];
    }

    // Reset success message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.passwordErrors = [];
  }
}