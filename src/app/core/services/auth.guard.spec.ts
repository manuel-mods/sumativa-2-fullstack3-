import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { UrlTree } from '@angular/router';

describe('Auth Guards', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const mockUrlTree = {} as UrlTree;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'parseUrl']);
    routerSpy.parseUrl.and.returnValue(mockUrlTree);

    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: false,
      isAdmin: false
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access for authenticated users', () => {
      // Set isLoggedIn to true
      Object.defineProperty(authServiceSpy, 'isLoggedIn', { get: () => true });

      const result = TestBed.runInInjectionContext(() => {
        return authGuard();
      });

      expect(result).toBeTrue();
      expect(routerSpy.parseUrl).not.toHaveBeenCalled();
    });

    it('should redirect unauthenticated users to login', () => {
      // Set isLoggedIn to false
      Object.defineProperty(authServiceSpy, 'isLoggedIn', { get: () => false });

      const result = TestBed.runInInjectionContext(() => {
        return authGuard();
      });

      expect(result).toBe(mockUrlTree);
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('adminGuard', () => {
    it('should allow access for authenticated admin users', () => {
      // Set isLoggedIn and isAdmin to true
      Object.defineProperty(authServiceSpy, 'isLoggedIn', { get: () => true });
      Object.defineProperty(authServiceSpy, 'isAdmin', { get: () => true });

      const result = TestBed.runInInjectionContext(() => {
        return adminGuard();
      });

      expect(result).toBeTrue();
      expect(routerSpy.parseUrl).not.toHaveBeenCalled();
    });

    it('should redirect non-admin users to home', () => {
      // Set isLoggedIn to true but isAdmin to false
      Object.defineProperty(authServiceSpy, 'isLoggedIn', { get: () => true });
      Object.defineProperty(authServiceSpy, 'isAdmin', { get: () => false });

      const result = TestBed.runInInjectionContext(() => {
        return adminGuard();
      });

      expect(result).toBe(mockUrlTree);
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/home');
    });

    it('should redirect unauthenticated users to home', () => {
      // Set both isLoggedIn and isAdmin to false
      Object.defineProperty(authServiceSpy, 'isLoggedIn', { get: () => false });
      Object.defineProperty(authServiceSpy, 'isAdmin', { get: () => false });

      const result = TestBed.runInInjectionContext(() => {
        return adminGuard();
      });

      expect(result).toBe(mockUrlTree);
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/home');
    });
  });
});