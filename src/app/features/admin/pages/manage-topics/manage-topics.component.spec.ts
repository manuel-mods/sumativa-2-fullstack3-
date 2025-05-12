import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ManageTopicsComponent } from './manage-topics.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Topic } from '../../../../core/models/topic.model';
import { Category } from '../../../../core/models/category.model';
import { UserRole } from '../../../../core/models/user.model';

describe('ManageTopicsComponent', () => {
  let component: ManageTopicsComponent;
  let fixture: ComponentFixture<ManageTopicsComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  
  const mockTopics: Topic[] = [
    {
      id: 'topic1',
      title: 'Regular Topic',
      content: 'Regular Content',
      categoryId: 'cat1',
      authorId: 'user1',
      authorName: 'User One',
      createdAt: new Date(),
      commentsCount: 2
    },
    {
      id: 'topic2',
      title: 'Banned Topic',
      content: 'Banned Content',
      categoryId: 'cat2',
      authorId: 'user2',
      authorName: 'User Two',
      createdAt: new Date(),
      commentsCount: 0,
      isBanned: true
    }
  ];
  
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Technology',
      description: 'Tech topics',
      iconClass: 'fa-laptop',
      topicsCount: 1
    },
    {
      id: 'cat2',
      name: 'Sports',
      description: 'Sports topics',
      iconClass: 'fa-football',
      topicsCount: 1
    }
  ];

  beforeEach(async () => {
    // Create spies
    forumService = jasmine.createSpyObj('ForumService', [
      'getAllTopicsForAdmin',
      'deleteTopic',
      'banTopic',
      'unbanTopic'
    ], {
      categories: mockCategories
    });
    
    authService = jasmine.createSpyObj('AuthService', [], {
      isAdmin: true
    });
    
    router = jasmine.createSpyObj('Router', ['navigate']);

    // Set up mock returns
    forumService.getAllTopicsForAdmin.and.returnValue(mockTopics);

    await TestBed.configureTestingModule({
      imports: [
        ManageTopicsComponent,
        CommonModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect if user is not an admin', () => {
    // Reset component with isAdmin = false
    TestBed.resetTestingModule();
    
    const newForumService = jasmine.createSpyObj('ForumService', [
      'getAllTopicsForAdmin'
    ], {
      categories: mockCategories
    });
    
    const newAuthService = jasmine.createSpyObj('AuthService', [], {
      isAdmin: false
    });
    
    const newRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [
        ManageTopicsComponent,
        CommonModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: newForumService },
        { provide: AuthService, useValue: newAuthService },
        { provide: Router, useValue: newRouter }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ManageTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verify navigation
    expect(newRouter.navigate).toHaveBeenCalledWith(['/']);
    
    // Verify services were not called
    expect(newForumService.getAllTopicsForAdmin).not.toHaveBeenCalled();
  });

  it('should load topics and create categories lookup on init', () => {
    // Verify topics loaded
    expect(component.topics).toEqual(mockTopics);
    expect(component.topics.length).toBe(2);
    
    // Verify categories lookup
    expect(component.categories['cat1']).toBeDefined();
    expect(component.categories['cat2']).toBeDefined();
    expect(component.categories['cat1'].name).toBe('Technology');
    expect(component.categories['cat2'].name).toBe('Sports');
  });

  it('should get category name from lookup', () => {
    expect(component.getCategory('cat1')).toBe('Technology');
    expect(component.getCategory('cat2')).toBe('Sports');
    expect(component.getCategory('non-existent')).toBe('Unknown Category');
  });

  it('should display topics in the template', () => {
    const topicElements = fixture.debugElement.queryAll(By.css('.topic-row'));
    
    expect(topicElements.length).toBe(2);
    
    // Check first topic details
    const firstTopicTitle = topicElements[0].query(By.css('.topic-title')).nativeElement.textContent;
    expect(firstTopicTitle).toContain('Regular Topic');
    
    // Check second topic details
    const secondTopicTitle = topicElements[1].query(By.css('.topic-title')).nativeElement.textContent;
    expect(secondTopicTitle).toContain('Banned Topic');
  });

  it('should display category names for topics', () => {
    const categoryElements = fixture.debugElement.queryAll(By.css('.topic-category'));
    
    expect(categoryElements.length).toBe(2);
    expect(categoryElements[0].nativeElement.textContent).toContain('Technology');
    expect(categoryElements[1].nativeElement.textContent).toContain('Sports');
  });

  it('should delete a topic when delete button is clicked', () => {
    // Mock return for refreshed topics list
    const updatedTopics = [mockTopics[1]]; // Only banned topic left
    forumService.getAllTopicsForAdmin.and.returnValue(updatedTopics);
    
    // Find and click delete button for first topic
    const deleteButtons = fixture.debugElement.queryAll(By.css('.btn-danger'));
    deleteButtons[0].nativeElement.click();
    
    // Verify service call
    expect(forumService.deleteTopic).toHaveBeenCalledWith('topic1');
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after delete
    
    // Verify topics list was updated
    expect(component.topics).toEqual(updatedTopics);
    expect(component.topics.length).toBe(1);
  });

  it('should ban a topic when ban button is clicked', () => {
    // Mock return for refreshed topics list with first topic now banned
    const updatedTopics = [
      { ...mockTopics[0], isBanned: true },
      mockTopics[1]
    ];
    forumService.getAllTopicsForAdmin.and.returnValue(updatedTopics);
    
    // Find and click ban button for first topic
    const banButtons = fixture.debugElement.queryAll(By.css('.btn-warning'));
    banButtons[0].nativeElement.click();
    
    // Verify service call
    expect(forumService.banTopic).toHaveBeenCalledWith('topic1');
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after ban
    
    // Verify topics list was updated
    expect(component.topics).toEqual(updatedTopics);
  });

  it('should unban a topic when unban button is clicked', () => {
    // Mock return for refreshed topics list with second topic now unbanned
    const updatedTopics = [
      mockTopics[0],
      { ...mockTopics[1], isBanned: false }
    ];
    forumService.getAllTopicsForAdmin.and.returnValue(updatedTopics);
    
    // Find and click unban button for second topic
    const unbanButtons = fixture.debugElement.queryAll(By.css('.btn-warning'));
    unbanButtons[1].nativeElement.click();
    
    // Verify service call
    expect(forumService.unbanTopic).toHaveBeenCalledWith('topic2');
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after unban
    
    // Verify topics list was updated
    expect(component.topics).toEqual(updatedTopics);
  });

  it('should navigate to topic when view button is clicked', () => {
    // Find and click view button for first topic
    const viewButtons = fixture.debugElement.queryAll(By.css('.btn-info'));
    viewButtons[0].nativeElement.click();
    
    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/topic', 'topic1']);
  });
});