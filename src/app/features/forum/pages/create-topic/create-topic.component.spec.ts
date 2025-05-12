import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { CreateTopicComponent } from './create-topic.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Category } from '../../../../core/models/category.model';
import { Topic } from '../../../../core/models/topic.model';
import {
  getCommonTestImports,
  getMockActivatedRoute,
  getMockRouter,
  getMockAuthService,
  getMockForumService
} from '../../../../core/testing/test-helpers';

describe('CreateTopicComponent', () => {
  let component: CreateTopicComponent;
  let fixture: ComponentFixture<CreateTopicComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Technology',
      description: 'Tech topics',
      iconClass: 'fa-laptop',
      topicsCount: 5
    },
    {
      id: '2',
      name: 'Sports',
      description: 'Sports topics',
      iconClass: 'fa-football',
      topicsCount: 3
    }
  ];

  const mockTopic: Topic = {
    id: '123',
    title: 'Test Topic',
    content: 'This is a test topic content',
    categoryId: '1',
    authorId: '1',
    authorName: 'Test User',
    createdAt: new Date(),
    commentsCount: 0,
    isBanned: false
  };

  beforeEach(async () => {
    // Create spies with default values
    forumService = getMockForumService();
    Object.defineProperty(forumService, 'categories', { value: mockCategories });
    forumService.createTopic.and.returnValue(of(mockTopic));

    authService = getMockAuthService(true, false);
    router = getMockRouter();

    await TestBed.configureTestingModule({
      imports: [
        ...getCommonTestImports(),
        CreateTopicComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: getMockActivatedRoute({}, { categoryId: '1' }) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if user is not logged in', () => {
    // Override the authService isLoggedIn property
    Object.defineProperty(authService, 'isLoggedIn', { get: () => false });
    
    // Re-trigger ngOnInit
    component.ngOnInit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load categories from forum service', () => {
    expect(component.categories).toEqual(mockCategories);
    expect(component.categories.length).toBe(2);
  });

  it('should initialize form with required validators', () => {
    expect(component.topicForm).toBeDefined();
    expect(component.topicForm.get('title')).toBeDefined();
    expect(component.topicForm.get('content')).toBeDefined();
    expect(component.topicForm.get('categoryId')).toBeDefined();
    
    // Check validators
    const titleControl = component.topicForm.get('title');
    const contentControl = component.topicForm.get('content');
    const categoryControl = component.topicForm.get('categoryId');
    
    // Initially form should be invalid
    expect(component.topicForm.valid).toBeFalsy();
    
    // Title validations
    titleControl?.setValue('');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.hasError('required')).toBeTruthy();
    
    titleControl?.setValue('abc');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.hasError('minlength')).toBeTruthy();
    
    titleControl?.setValue('This is a valid title');
    expect(titleControl?.valid).toBeTruthy();
    
    // Content validations
    contentControl?.setValue('');
    expect(contentControl?.valid).toBeFalsy();
    expect(contentControl?.hasError('required')).toBeTruthy();
    
    contentControl?.setValue('too short');
    expect(contentControl?.valid).toBeFalsy();
    expect(contentControl?.hasError('minlength')).toBeTruthy();
    
    contentControl?.setValue('This is a valid content with enough characters to pass validation');
    expect(contentControl?.valid).toBeTruthy();
    
    // Category validations
    categoryControl?.setValue('');
    expect(categoryControl?.valid).toBeFalsy();
    expect(categoryControl?.hasError('required')).toBeTruthy();
    
    categoryControl?.setValue('1');
    expect(categoryControl?.valid).toBeTruthy();
  });

  it('should pre-select category from query params', () => {
    // With our mock setup, categoryId '1' is passed in query params
    expect(component.topicForm.get('categoryId')?.value).toBe('1');
  });

  it('should not submit if form is invalid', () => {
    // Set up an invalid form
    component.topicForm.patchValue({
      title: 'ab',  // Too short
      content: 'Too short content',
      categoryId: ''
    });
    
    component.onSubmit();
    
    expect(forumService.createTopic).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalsy();
  });
  
  it('should not submit if already submitting', () => {
    // Set up a valid form but mark as submitting
    component.topicForm.patchValue({
      title: 'Valid Title',
      content: 'This is a valid content with enough characters to pass validation',
      categoryId: '1'
    });
    
    component.isSubmitting = true;
    component.onSubmit();
    
    expect(forumService.createTopic).not.toHaveBeenCalled();
  });

  it('should create a topic when form is valid and submitted', () => {
    // Set up a valid form
    component.topicForm.patchValue({
      title: 'Valid Title',
      content: 'This is a valid content with enough characters to pass validation',
      categoryId: '1'
    });
    
    component.onSubmit();
    
    expect(component.isSubmitting).toBeTruthy();
    expect(forumService.createTopic).toHaveBeenCalledWith(
      'Valid Title',
      'This is a valid content with enough characters to pass validation',
      '1'
    );
    
    // Since our mock returns a value synchronously in this test, isSubmitting should be false again
    expect(component.isSubmitting).toBeFalsy();
    expect(router.navigate).toHaveBeenCalledWith(['/topic', '123']);
  });
  
  it('should handle error when creating topic fails', () => {
    // Setup forum service to return error
    forumService.createTopic.and.returnValue(of(null));
    
    // Set up a valid form
    component.topicForm.patchValue({
      title: 'Valid Title',
      content: 'This is a valid content with enough characters to pass validation',
      categoryId: '1'
    });
    
    component.onSubmit();
    
    // Even though error occurred, isSubmitting should be reset
    expect(component.isSubmitting).toBeFalsy();
    // Router should not navigate
    expect(router.navigate).not.toHaveBeenCalled();
  });
  
  it('should render form elements in the template', () => {
    const formElement = fixture.debugElement.query(By.css('form'));
    const titleInput = fixture.debugElement.query(By.css('[formControlName="title"]'));
    const contentTextarea = fixture.debugElement.query(By.css('[formControlName="content"]'));
    const categorySelect = fixture.debugElement.query(By.css('[formControlName="categoryId"]'));
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(formElement).toBeTruthy();
    expect(titleInput).toBeTruthy();
    expect(contentTextarea).toBeTruthy();
    expect(categorySelect).toBeTruthy();
    expect(submitButton).toBeTruthy();
  });
  
  it('should render category options in the select dropdown', () => {
    const categoryOptions = fixture.debugElement.queryAll(By.css('option:not([value=""])'));
    
    expect(categoryOptions.length).toBe(2);
    expect(categoryOptions[0].nativeElement.textContent).toContain('Technology');
    expect(categoryOptions[1].nativeElement.textContent).toContain('Sports');
  });
});