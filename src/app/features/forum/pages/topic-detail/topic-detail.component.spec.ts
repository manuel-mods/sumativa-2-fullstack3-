import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { TopicDetailComponent } from './topic-detail.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';
import { Category } from '../../../../core/models/category.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';

describe('TopicDetailComponent', () => {
  let component: TopicDetailComponent;
  let fixture: ComponentFixture<TopicDetailComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toastrService: jasmine.SpyObj<ToastrService>;
  let activatedRoute: { params: any };

  const mockTopic: Topic = {
    id: 'topic1',
    title: 'Test Topic',
    content: 'Test Content',
    categoryId: 'cat1',
    authorId: 'user1',
    authorName: 'Test User',
    createdAt: new Date(),
    commentsCount: 2,
  };

  const mockCategory: Category = {
    id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    iconClass: 'fa-test',
    topicsCount: 5,
  };

  const mockComments: Comment[] = [
    {
      id: 'comment1',
      topicId: 'topic1',
      content: 'First Comment',
      authorId: 'user1',
      authorName: 'Test User',
      createdAt: new Date(),
    },
    {
      id: 'comment2',
      topicId: 'topic1',
      content: 'Second Comment',
      authorId: 'user2',
      authorName: 'Another User',
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    // Create spies
    forumService = jasmine.createSpyObj('ForumService', [
      'getTopic',
      'getCategory',
      'getCommentsByTopic',
      'createComment',
    ]);

    authService = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: true,
      currentUser: { id: 'user1', name: 'Test User' },
    });

    router = jasmine.createSpyObj('Router', ['navigate']);
    
    toastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info',
    ]);

    // Set up mock returns
    forumService.getTopic.and.returnValue(of(mockTopic));
    forumService.getCategory.and.returnValue(mockCategory);
    forumService.getCommentsByTopic.and.returnValue(of(mockComments));

    // Mock route params
    activatedRoute = {
      params: of({ id: 'topic1' })
    };

    await TestBed.configureTestingModule({
      imports: [
        TopicDetailComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        HttpClientTestingModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ToastrService, useValue: toastrService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Initialization Tests
  it('should load topic, category and comments on init', () => {
    expect(component.topic).toEqual(mockTopic);
    expect(component.category).toEqual(mockCategory);
    expect(component.comments).toEqual(mockComments);

    // Verify service calls
    expect(forumService.getTopic).toHaveBeenCalledWith('topic1');
    expect(forumService.getCategory).toHaveBeenCalledWith('cat1');
    expect(forumService.getCommentsByTopic).toHaveBeenCalledWith('topic1');
  });

  it('should initialize comment form with validators', () => {
    expect(component.commentForm).toBeDefined();
    
    const contentControl = component.commentForm.get('content');
    expect(contentControl).toBeDefined();
    
    // Empty content should be invalid
    contentControl?.setValue('');
    expect(contentControl?.valid).toBeFalse();
    expect(contentControl?.errors?.['required']).toBeTrue();
    
    // Content less than 3 characters should be invalid
    contentControl?.setValue('ab');
    expect(contentControl?.valid).toBeFalse();
    expect(contentControl?.errors?.['minlength']).toBeTrue();
    
    // Valid content should be valid
    contentControl?.setValue('Valid comment');
    expect(contentControl?.valid).toBeTrue();
  });

  // Navigation Tests
  it('should redirect if topic does not exist', () => {
    // Reset component and forumService mock
    forumService.getTopic.and.returnValue(of(undefined));
    
    // Recreate component to trigger ngOnInit with new mock
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should redirect if topic is banned', () => {
    // Mock a banned topic
    const bannedTopic = { ...mockTopic, isBanned: true };
    forumService.getTopic.and.returnValue(of(bannedTopic));
    
    // Recreate component
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle different topic IDs from route params', () => {
    // Change the route params to a different topic ID
    (activatedRoute.params as any) = of({ id: 'different-topic' });
    
    // Recreate component
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify service was called with the new ID
    expect(forumService.getTopic).toHaveBeenCalledWith('different-topic');
  });

  // UI Rendering Tests
  it('should display topic title and content', () => {
    fixture.detectChanges();
    
    const titleElement = fixture.debugElement.query(By.css('.card-body h1'));
    const contentElement = fixture.debugElement.query(By.css('.card-body .border-top'));
    
    expect(titleElement.nativeElement.textContent).toContain(mockTopic.title);
    expect(contentElement.nativeElement.textContent).toContain(mockTopic.content);
  });

  it('should display topic author and date', () => {
    fixture.detectChanges();
    
    const authorElement = fixture.debugElement.query(By.css('.card-body .d-flex.align-items-center'));
    
    expect(authorElement.nativeElement.textContent).toContain(mockTopic.authorName);
    // Date formatting may vary, so we just check for presence
    expect(authorElement.nativeElement.textContent).toContain(mockTopic.createdAt.getFullYear().toString());
  });

  it('should display category name in breadcrumbs', () => {
    fixture.detectChanges();
    
    const breadcrumbElement = fixture.debugElement.query(By.css('.breadcrumb-item:nth-child(2) a'));
    
    expect(breadcrumbElement.nativeElement.textContent).toContain(mockCategory.name);
  });

  it('should display comments count correctly', () => {
    fixture.detectChanges();
    
    const commentsHeading = fixture.debugElement.query(By.css('h2'));
    
    expect(commentsHeading.nativeElement.textContent).toContain(`Comentarios (${mockComments.length})`);
  });

  it('should display comments list with correct content', () => {
    fixture.detectChanges();
    
    // Find all comment cards
    const commentElements = fixture.debugElement.queryAll(By.css('.mb-4 .card'));
    
    expect(commentElements.length).toBe(mockComments.length);
    
    // Check first comment content
    const firstCommentContent = commentElements[0].query(By.css('p')).nativeElement;
    expect(firstCommentContent.textContent).toContain(mockComments[0].content);
    
    // Check first comment author
    const firstCommentAuthor = commentElements[0].query(By.css('.fw-medium')).nativeElement;
    expect(firstCommentAuthor.textContent).toContain(mockComments[0].authorName);
  });

  it('should show comment form for logged in users', () => {
    // Set isLoggedIn to true
    Object.defineProperty(authService, 'isLoggedIn', { get: () => true });
    fixture.detectChanges();
    
    const commentForm = fixture.debugElement.query(By.css('form'));
    const loginPrompt = fixture.debugElement.query(By.css('.bg-light.rounded.p-4.text-center.mb-4'));
    
    expect(commentForm).toBeTruthy();
    expect(loginPrompt).toBeFalsy();
  });

  it('should show login prompt for non-logged in users', () => {
    // Set isLoggedIn to false
    Object.defineProperty(authService, 'isLoggedIn', { get: () => false });
    fixture.detectChanges();
    
    const commentForm = fixture.debugElement.query(By.css('form'));
    const loginPrompt = fixture.debugElement.query(By.css('.bg-light.rounded.p-4.text-center.mb-4'));
    const loginLink = loginPrompt.query(By.css('a[routerLink="/login"]'));
    
    expect(commentForm).toBeFalsy();
    expect(loginPrompt).toBeTruthy();
    expect(loginLink).toBeTruthy();
    expect(loginLink.nativeElement.textContent).toContain('Inicia sesión para comentar');
  });

  it('should display "no comments" message when comments array is empty', () => {
    // Set empty comments array
    component.comments = [];
    fixture.detectChanges();
    
    const noCommentsMessage = fixture.debugElement.query(By.css('.bg-light.rounded.p-4.text-center'));
    
    expect(noCommentsMessage).toBeTruthy();
    expect(noCommentsMessage.nativeElement.textContent).toContain('Aún no hay comentarios');
  });

  // Comment Form Submission Tests
  it('should mark form controls as touched when submitting an invalid form', () => {
    spyOn(component.commentForm, 'markAllAsTouched');
    
    // Leave form empty and submit
    component.commentForm.setValue({ content: '' });
    component.onCommentSubmit();
    
    expect(component.commentForm.markAllAsTouched).toHaveBeenCalled();
    expect(forumService.createComment).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not submit if component has no topic', () => {
    // Set a valid comment but no topic
    component.commentForm.setValue({ content: 'Valid comment' });
    component.topic = undefined;
    
    component.onCommentSubmit();
    
    expect(forumService.createComment).not.toHaveBeenCalled();
  });

  it('should not submit if already submitting', () => {
    // Set valid form and isSubmitting flag
    component.commentForm.setValue({ content: 'Valid comment' });
    component.isSubmitting = true;
    
    component.onCommentSubmit();
    
    expect(forumService.createComment).not.toHaveBeenCalled();
  });

  it('should redirect to login if not logged in when trying to submit', () => {
    // Set valid form but not logged in
    component.commentForm.setValue({ content: 'Valid comment' });
    Object.defineProperty(authService, 'isLoggedIn', { get: () => false });
    
    component.onCommentSubmit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(forumService.createComment).not.toHaveBeenCalled();
  });

  it('should create comment and refresh comments list on valid submission', fakeAsync(() => {
    // Set up new comment and updated comments list
    const newComment: Comment = {
      id: 'comment3',
      topicId: 'topic1',
      content: 'New Comment',
      authorId: 'user1',
      authorName: 'Test User',
      createdAt: new Date(),
    };
    
    const updatedComments = [...mockComments, newComment];
    
    // Mock service responses
    forumService.createComment.and.returnValue(of(newComment));
    forumService.getCommentsByTopic.and.returnValue(of(updatedComments));
    
    // Set valid form data and submit
    component.commentForm.setValue({ content: 'New Comment' });
    component.onCommentSubmit();
    
    // Verify isSubmitting flag is set
    expect(component.isSubmitting).toBeTrue();
    
    // Verify service was called with correct parameters
    expect(forumService.createComment).toHaveBeenCalledWith('topic1', 'New Comment');
    
    // Simulate async completion
    tick();
    
    // Verify comments list was updated
    expect(component.comments.length).toBe(3);
    expect(component.comments).toEqual(updatedComments);
    
    // Verify form was reset and isSubmitting flag cleared
    expect(component.commentForm.value.content).toBeFalsy();
    expect(component.isSubmitting).toBeFalse();
  }));

  it('should handle null response from createComment', fakeAsync(() => {
    // Mock createComment to return null
    forumService.createComment.and.returnValue(of(null));
    
    // Set valid form data and submit
    component.commentForm.setValue({ content: 'New Comment' });
    component.onCommentSubmit();
    
    // Verify isSubmitting flag is set
    expect(component.isSubmitting).toBeTrue();
    
    // Simulate async completion
    tick();
    
    // Verify isSubmitting flag is cleared even on error
    expect(component.isSubmitting).toBeFalse();
    
    // Verify comments list and form were not modified
    expect(component.comments.length).toBe(2);
    expect(component.commentForm.value.content).toBe('New Comment');
  }));

  it('should handle error in createComment', fakeAsync(() => {
    // Mock createComment to throw error
    forumService.createComment.and.returnValue(throwError(() => new Error('Comment creation error')));
    
    // Set valid form data and submit
    component.commentForm.setValue({ content: 'New Comment' });
    
    // Prevent console errors in test
    spyOn(console, 'error');
    
    // Submit should not throw
    expect(() => {
      component.onCommentSubmit();
      tick();
    }).not.toThrow();
    
    // Verify isSubmitting flag is cleared even on error
    expect(component.isSubmitting).toBeFalse();
  }));

  it('should disable submit button when form is invalid', () => {
    // Make form invalid
    component.commentForm.setValue({ content: '' });
    fixture.detectChanges();
    
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(submitButton.nativeElement.disabled).toBeTrue();
  });

  it('should disable submit button while submitting', () => {
    // Set valid form but isSubmitting flag
    component.commentForm.setValue({ content: 'Valid comment' });
    component.isSubmitting = true;
    fixture.detectChanges();
    
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(submitButton.nativeElement.disabled).toBeTrue();
  });

  it('should show different button text while submitting', () => {
    // Check initial button text
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitButton.nativeElement.textContent.trim()).toContain('Publicar Comentario');
    
    // Set isSubmitting flag
    component.isSubmitting = true;
    fixture.detectChanges();
    
    // Check updated button text
    expect(submitButton.nativeElement.textContent.trim()).toContain('Publicando...');
  });

  // Error Handling Tests
  it('should handle error loading topic', () => {
    // Mock getTopic to throw error
    forumService.getTopic.and.returnValue(throwError(() => new Error('Topic load failed')));
    
    // Prevent console errors in test
    spyOn(console, 'error');
    
    // Recreate component
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    
    // Should not throw exception
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
    
    // Component should handle error gracefully
    expect(component.topic).toBeUndefined();
  });

  it('should handle error loading comments', () => {
    // Mock getCommentsByTopic to throw error
    forumService.getCommentsByTopic.and.returnValue(throwError(() => new Error('Comments load failed')));
    
    // Prevent console errors in test
    spyOn(console, 'error');
    
    // Recreate component
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    
    // Should not throw exception
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
    
    // Comments should be empty array if loading failed
    expect(component.comments).toEqual([]);
  });

  // Route Params Tests
  it('should handle route params changes', () => {
    // Initial component has already loaded topic1
    expect(forumService.getTopic).toHaveBeenCalledWith('topic1');
    
    // Update route params to a new topic ID
    (activatedRoute.params as any).next({ id: 'topic2' });
    
    // Should have called getTopic with the new ID
    expect(forumService.getTopic).toHaveBeenCalledWith('topic2');
  });

  // UI Interaction Tests
  it('should submit comment when form is submitted', () => {
    spyOn(component, 'onCommentSubmit');
    
    // Set valid form value
    component.commentForm.setValue({ content: 'Test comment' });
    fixture.detectChanges();
    
    // Get form element and trigger submit event
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', null);
    
    expect(component.onCommentSubmit).toHaveBeenCalled();
  });

  it('should show validation errors when comment is invalid and touched', () => {
    // Set invalid value and mark as touched
    const contentControl = component.commentForm.get('content');
    contentControl?.setValue('');
    contentControl?.markAsTouched();
    fixture.detectChanges();
    
    // Should show required error
    const errorMessage = fixture.debugElement.query(By.css('.text-danger.small'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain('requerido');
    
    // Change to too short comment
    contentControl?.setValue('ab');
    fixture.detectChanges();
    
    // Should show minlength error
    expect(errorMessage.nativeElement.textContent).toContain('al menos 3 caracteres');
  });
});