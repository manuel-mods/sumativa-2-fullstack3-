import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';

import { ForgotPasswordComponent } from './forgot-password.component';
import { CommonModule } from '@angular/common';
import { getCommonTestImports } from '../../../../core/testing/test-helpers';
import { of } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    // Create toastr spy
    toastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ...getCommonTestImports(),
        ForgotPasswordComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: ToastrService, useValue: toastrService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}), // puedes simular parámetros si los usas
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with a form containing an email field', () => {
      expect(component.forgotPasswordForm).toBeDefined();
      expect(component.forgotPasswordForm.get('email')).toBeDefined();
      expect(component.forgotPasswordForm.get('email')?.value).toBe('');
      expect(component.submitted).toBeFalse();
      expect(component.isLoading).toBeFalse();
    });

    it('should set correct validators on email field', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      expect(emailControl?.validator).toBeTruthy();

      // Empty email should be invalid
      emailControl?.setValue('');
      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('required')).toBeTrue();

      // Invalid email format should be invalid
      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('email')).toBeTrue();

      // Valid email should be valid
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTrue();
      expect(emailControl?.errors).toBeNull();
    });
  });

  describe('Form Validation and Submission', () => {
    it('should mark form controls as touched when submitting an invalid form', () => {
      spyOn(component.forgotPasswordForm, 'markAllAsTouched');

      // Set invalid form value
      component.forgotPasswordForm.setValue({ email: '' });
      component.onSubmit();

      expect(component.forgotPasswordForm.markAllAsTouched).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
      expect(component.submitted).toBeFalse();
      expect(toastrService.error).not.toHaveBeenCalled();
    });

    it('should show validation error messages when email is invalid and touched', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorMessage = fixture.debugElement.query(
        By.css('.invalid-feedback')
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent).toContain(
        'El email es requerido'
      );

      emailControl?.setValue('invalid-email');
      fixture.detectChanges();

      expect(errorMessage.nativeElement.textContent).toContain(
        'Ingresa un email válido'
      );
    });

    it('should set loading state and submit form with valid data', fakeAsync(() => {
      spyOn(console, 'log');

      // Set valid form value
      component.forgotPasswordForm.setValue({ email: 'test@example.com' });
      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      expect(component.submitted).toBeFalse();

      // Check that console.log is called with the correct value after timeout
      tick(1500);

      expect(console.log).toHaveBeenCalledWith(
        'Reset password for:',
        'test@example.com'
      );
      expect(component.isLoading).toBeFalse();
      expect(component.submitted).toBeTrue();
      expect(toastrService.success).toHaveBeenCalledWith(
        'Instrucciones enviadas, revisa tu correo para completar el proceso',
        'Email enviado'
      );

      discardPeriodicTasks();
    }));

    it('should not process submission if already loading', () => {
      spyOn(console, 'log');
      component.isLoading = true;

      component.forgotPasswordForm.setValue({ email: 'test@example.com' });
      component.onSubmit();

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('UI Interaction and Display', () => {
    it('should disable submit button while loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(submitButton.nativeElement.disabled).toBeTrue();
    });

    it('should show spinner while loading', () => {
      component.isLoading = false;
      fixture.detectChanges();

      let spinner = fixture.debugElement.query(By.css('.spinner-border'));
      expect(spinner).toBeNull();

      component.isLoading = true;
      fixture.detectChanges();

      spinner = fixture.debugElement.query(By.css('.spinner-border'));
      expect(spinner).toBeTruthy();
    });

    it('should show the form initially and not the success message', () => {
      component.submitted = false;
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      const successMessage = fixture.debugElement.query(
        By.css('div[class="text-center py-3"]')
      );

      expect(form).toBeTruthy();
      expect(successMessage).toBeNull();
    });

    it('should show success message after form submission', () => {
      component.submitted = true;
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      const successMessage = fixture.debugElement.query(
        By.css('div[class="text-center py-3"]')
      );

      expect(form).toBeNull();
      expect(successMessage).toBeTruthy();
      expect(successMessage.nativeElement.textContent).toContain(
        'Revisa Tu Email'
      );
    });

    it('should have link to navigate back to login page', () => {
      const loginLink = fixture.debugElement.query(
        By.css('a[routerLink="/login"]')
      );
      expect(loginLink).toBeTruthy();
      expect(loginLink.nativeElement.textContent).toContain('Volver al Login');
    });

    it('should submit the form when the submit button is clicked', () => {
      spyOn(component, 'onSubmit');

      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      ).nativeElement;
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input'));

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', null);

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should update form value when input changes', () => {
      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      ).nativeElement;
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input'));

      expect(component.forgotPasswordForm.get('email')?.value).toBe(
        'test@example.com'
      );
    });

    it('should correctly apply disabled state to button based on form validity and loading state', () => {
      // Valid form, not loading - button should be enabled
      component.forgotPasswordForm.setValue({ email: 'valid@example.com' });
      component.isLoading = false;
      fixture.detectChanges();

      let submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(submitButton.nativeElement.disabled).toBeFalse();

      // Valid form, loading - button should be disabled
      component.isLoading = true;
      fixture.detectChanges();

      submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(submitButton.nativeElement.disabled).toBeTrue();

      // Invalid form, not loading - button should be enabled (validation happens on submit)
      component.forgotPasswordForm.setValue({ email: 'invalid-email' });
      component.isLoading = false;
      fixture.detectChanges();

      submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(submitButton.nativeElement.disabled).toBeFalse();
    });

    it('should display the page title correctly', () => {
      const pageTitle = fixture.debugElement.query(By.css('h2')).nativeElement;
      expect(pageTitle.textContent).toContain('Recuperar Contraseña');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully during form submission', fakeAsync(() => {
      spyOn(console, 'error');
      spyOn(console, 'log').and.throwError('Simulated error');

      component.forgotPasswordForm.setValue({ email: 'test@example.com' });

      expect(() => {
        component.onSubmit();
        tick(1500);
      }).not.toThrow();

      expect(component.isLoading).toBeFalse();
      expect(toastrService.error).toHaveBeenCalledWith(
        'Ha ocurrido un error, intenta nuevamente',
        'Error'
      );

      discardPeriodicTasks();
    }));
  });
});
