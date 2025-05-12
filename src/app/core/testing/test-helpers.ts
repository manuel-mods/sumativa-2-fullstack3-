import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ForumService } from '../services/forum.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Type } from '@angular/core';
import { UserRole } from '../models/user.model';

/**
 * Creates a mock ActivatedRoute with custom parameters
 */
export function getMockActivatedRoute(params = {}, queryParams = {}) {
  return {
    params: of(params),
    queryParams: of(queryParams),
    snapshot: {
      paramMap: convertToParamMap(params),
      queryParamMap: convertToParamMap(queryParams)
    }
  } as unknown as ActivatedRoute;
}

/**
 * Creates a mock Router with spies for common methods
 */
export function getMockRouter() {
  return jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'parseUrl']);
}

/**
 * Creates a mock AuthService with spies for common methods
 */
export function getMockAuthService(isLoggedIn = true, isAdmin = false) {
  const mockUser = isLoggedIn ? {
    id: '1',
    name: isAdmin ? 'admin' : 'user',
    email: isAdmin ? 'admin@example.com' : 'user@example.com',
    role: isAdmin ? UserRole.ADMIN : UserRole.USER,
    createdAt: new Date()
  } : null;

  return jasmine.createSpyObj('AuthService', 
    ['login', 'logout', 'register', 'getToken', 'updateUserProfile', 'updatePassword', 'validatePassword'],
    {
      currentUser: mockUser,
      isLoggedIn: isLoggedIn,
      isAdmin: isAdmin
    }
  );
}

/**
 * Creates a mock ForumService with spies for common methods
 */
export function getMockForumService() {
  return jasmine.createSpyObj('ForumService', 
    [
      'getCategory', 'getTopicsByCategory', 'getTopic', 'createTopic', 
      'updateTopic', 'deleteTopic', 'banTopic', 'unbanTopic',
      'getCommentsByTopic', 'createComment', 'deleteComment', 
      'reportComment', 'unreportComment', 'loadAllTopics',
      'getAllTopicsForAdmin', 'getAllCommentsForAdmin'
    ]
  );
}

/**
 * Creates a mock ToastrService with spies for common methods
 */
export function getMockToastrService() {
  return jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);
}

/**
 * Returns common imports for component tests
 */
export function getCommonTestImports() {
  return [
    HttpClientTestingModule,
    ToastrModule.forRoot()
  ];
}

/**
 * Returns common providers for component tests
 */
export function getCommonTestProviders(options: {
  activatedRouteParams?: Record<string, any>,
  activatedRouteQueryParams?: Record<string, any>,
  isLoggedIn?: boolean,
  isAdmin?: boolean
} = {}) {
  return [
    { provide: ActivatedRoute, useValue: getMockActivatedRoute(
      options.activatedRouteParams || {}, 
      options.activatedRouteQueryParams || {}
    )},
    { provide: Router, useValue: getMockRouter() },
    { provide: AuthService, useValue: getMockAuthService(
      options.isLoggedIn !== undefined ? options.isLoggedIn : true,
      options.isAdmin !== undefined ? options.isAdmin : false
    )},
    { provide: ToastrService, useValue: getMockToastrService() }
  ];
}