import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastrModule } from 'ngx-toastr';
import {
  getCommonTestImports,
  getMockActivatedRoute,
  getMockAuthService,
  getMockRouter,
} from './core/testing/test-helpers';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...getCommonTestImports(), AppComponent],
      providers: [
        { provide: ActivatedRoute, useValue: getMockActivatedRoute() },
        { provide: Router, useValue: getMockRouter() },
        { provide: AuthService, useValue: getMockAuthService() },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'foro-duoc-angular' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('foro-duoc-angular');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Hello, foro-duoc-angular'
    );
  });
});
