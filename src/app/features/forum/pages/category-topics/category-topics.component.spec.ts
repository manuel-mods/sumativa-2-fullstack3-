import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryTopicsComponent } from './category-topics.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import {
  getCommonTestImports,
  getMockActivatedRoute,
  getMockRouter,
  getMockAuthService,
  getMockForumService,
} from '../../../../core/testing/test-helpers';
import { Category } from '../../../../core/models/category.model';
import { Topic } from '../../../../core/models/topic.model';
import { of } from 'rxjs';

describe('CategoryTopicsComponent', () => {
  let component: CategoryTopicsComponent;
  let fixture: ComponentFixture<CategoryTopicsComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockCategory: Category = {
    id: 'cat1',
    name: 'Technology',
    description: 'Tech topics',
    iconClass: 'fa-laptop',
    topicsCount: 2,
  };

  const mockTopics: Topic[] = [
    {
      id: '1',
      title: 'Topic 1',
      content: 'Content for topic 1',
      authorId: '1',
      authorName: 'User1',
      createdAt: new Date(),
      categoryId: 'cat1',
      commentsCount: 5,
    },
    {
      id: '2',
      title: 'Topic 2',
      content: 'Content for topic 2',
      authorId: '2',
      authorName: 'User2',
      createdAt: new Date(),
      categoryId: 'cat1',
      commentsCount: 5,
    },
  ];

  beforeEach(async () => {
    // Create spies
    forumService = getMockForumService();
    forumService.getCategory.and.returnValue(mockCategory);
    forumService.getTopicsByCategory.and.returnValue(mockTopics);

    authService = getMockAuthService();
    router = getMockRouter();
    activatedRoute = getMockActivatedRoute({ id: 'cat1' });

    await TestBed.configureTestingModule({
      imports: [
        ...getCommonTestImports(),
        CategoryTopicsComponent,
        CommonModule,
        RouterLink,
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load category and topics on init', () => {
    expect(forumService.getCategory).toHaveBeenCalledWith('cat1');
    expect(forumService.getTopicsByCategory).toHaveBeenCalledWith('cat1');
    expect(component.category).toEqual(mockCategory);
    expect(component.topics).toEqual(mockTopics);
  });
});
