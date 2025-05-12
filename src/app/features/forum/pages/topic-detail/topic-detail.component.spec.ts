import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterLink, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { TopicDetailComponent } from './topic-detail.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';
import { Category } from '../../../../core/models/category.model';

describe('TopicDetailComponent', () => {
  let component: TopicDetailComponent;
  let fixture: ComponentFixture<TopicDetailComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  
  const mockTopic: Topic = {
    id: 'topic1',
    title: 'Test Topic',
    content: 'Test Content',
    categoryId: 'cat1',
    authorId: 'user1',
    authorName: 'Test User',
    createdAt: new Date(),
    commentsCount: 2
  };
  
  const mockCategory: Category = {
    id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    iconClass: 'fa-test',
    topicsCount: 5
  };
  
  const mockComments: Comment[] = [
    {
      id: 'comment1',
      topicId: 'topic1',
      content: 'First Comment',
      authorId: 'user1',
      authorName: 'Test User',
      createdAt: new Date()
    },
    {
      id: 'comment2',
      topicId: 'topic1',
      content: 'Second Comment',
      authorId: 'user2',
      authorName: 'Another User',
      createdAt: new Date()
    }
  ];

  beforeEach(async () => {
    // Create spies
    forumService = jasmine.createSpyObj('ForumService', [
      'getTopic', 
      'getCategory', 
      'getCommentsByTopic',
      'createComment'
    ]);
    
    authService = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: true,
      currentUser: { id: 'user1', name: 'Test User' }
    });
    
    router = jasmine.createSpyObj('Router', ['navigate']);

    // Set up mock returns
    forumService.getTopic.and.returnValue(mockTopic);
    forumService.getCategory.and.returnValue(mockCategory);
    forumService.getCommentsByTopic.and.returnValue(mockComments);
    
    // Mock route params
    const activatedRouteStub = {
      params: of({ id: 'topic1' })
    };

    await TestBed.configureTestingModule({
      imports: [
        TopicDetailComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load topic, category and comments on init', () => {
    expect(component.topic).toEqual(mockTopic);
    expect(component.category).toEqual(mockCategory);
    expect(component.comments).toEqual(mockComments);
    
    // Verify service calls
    expect(forumService.getTopic).toHaveBeenCalledWith('topic1');
    expect(forumService.getCategory).toHaveBeenCalledWith('cat1');
    expect(forumService.getCommentsByTopic).toHaveBeenCalledWith('topic1');
  });

  it('should redirect if topic does not exist', () => {
    // Reset component
    TestBed.resetTestingModule();
    
    // Mock getTopic to return null
    const newForumService = jasmine.createSpyObj('ForumService', [
      'getTopic', 'getCategory', 'getCommentsByTopic'
    ]);
    newForumService.getTopic.and.returnValue(undefined);
    
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const activatedRouteStub = {
      params: of({ id: 'invalid-topic' })
    };
    
    TestBed.configureTestingModule({
      imports: [
        TopicDetailComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: newForumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: newRouter },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify navigation
    expect(newRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should redirect if topic is banned', () => {
    // Reset component
    TestBed.resetTestingModule();
    
    // Mock getTopic to return a banned topic
    const bannedTopic = { ...mockTopic, isBanned: true };
    const newForumService = jasmine.createSpyObj('ForumService', [
      'getTopic', 'getCategory', 'getCommentsByTopic'
    ]);
    newForumService.getTopic.and.returnValue(bannedTopic);
    
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const activatedRouteStub = {
      params: of({ id: 'banned-topic' })
    };
    
    TestBed.configureTestingModule({
      imports: [
        TopicDetailComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: newForumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: newRouter },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify navigation
    expect(newRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should display topic title and content', () => {
    const titleElement = fixture.debugElement.query(By.css('.topic-title'));
    const contentElement = fixture.debugElement.query(By.css('.topic-content'));
    
    expect(titleElement.nativeElement.textContent).toContain(mockTopic.title);
    expect(contentElement.nativeElement.textContent).toContain(mockTopic.content);
  });

  it('should display category name', () => {
    const categoryElement = fixture.debugElement.query(By.css('.topic-category'));
    
    expect(categoryElement.nativeElement.textContent).toContain(mockCategory.name);
  });

  it('should display comments list', () => {
    const commentElements = fixture.debugElement.queryAll(By.css('.comment-item'));
    
    expect(commentElements.length).toBe(2);
    expect(commentElements[0].query(By.css('.comment-content')).nativeElement.textContent)
      .toContain('First Comment');
    expect(commentElements[1].query(By.css('.comment-content')).nativeElement.textContent)
      .toContain('Second Comment');
  });

  it('should initialize comment form', () => {
    expect(component.commentForm).toBeDefined();
    expect(component.commentForm.get('content')).toBeDefined();
  });

  it('should not submit comment with invalid form', () => {
    // Leave comment form empty
    component.commentForm.setValue({ content: '' });
    
    // Submit form
    component.onCommentSubmit();
    
    // Verify service was not called
    expect(forumService.createComment).not.toHaveBeenCalled();
  });

  it('should redirect to login if not logged in', () => {
    // Reset component with isLoggedIn = false
    TestBed.resetTestingModule();
    
    const newForumService = jasmine.createSpyObj('ForumService', [
      'getTopic', 'getCategory', 'getCommentsByTopic', 'createComment'
    ]);
    newForumService.getTopic.and.returnValue(mockTopic);
    newForumService.getCategory.and.returnValue(mockCategory);
    newForumService.getCommentsByTopic.and.returnValue(mockComments);
    
    const newAuthService = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: false
    });
    
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const activatedRouteStub = {
      params: of({ id: 'topic1' })
    };
    
    TestBed.configureTestingModule({
      imports: [
        TopicDetailComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: newForumService },
        { provide: AuthService, useValue: newAuthService },
        { provide: Router, useValue: newRouter },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TopicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Set valid form data
    component.commentForm.setValue({ content: 'New Comment' });
    
    // Submit form
    component.onCommentSubmit();
    
    // Verify navigation to login
    expect(newRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should create comment and refresh comments list on valid submission', () => {
    // Set up mock data
    const newComment: Comment = {
      id: 'comment3',
      topicId: 'topic1',
      content: 'New Comment',
      authorId: 'user1',
      authorName: 'Test User',
      createdAt: new Date()
    };
    
    forumService.createComment.and.returnValue(newComment);
    
    // Update mock comments list with new comment
    const updatedComments = [...mockComments, newComment];
    forumService.getCommentsByTopic.and.returnValue(updatedComments);
    
    // Set valid form data
    component.commentForm.setValue({ content: 'New Comment' });
    
    // Submit form
    component.onCommentSubmit();
    
    // Verify service calls
    expect(forumService.createComment).toHaveBeenCalledWith('topic1', 'New Comment');
    expect(forumService.getCommentsByTopic).toHaveBeenCalledWith('topic1');
    
    // Verify comments list was updated
    expect(component.comments).toEqual(updatedComments);
    expect(component.comments.length).toBe(3);
    
    // Verify form was reset
    expect(component.commentForm.value.content).toBeFalsy();
  });
});