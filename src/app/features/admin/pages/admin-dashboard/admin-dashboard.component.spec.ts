import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';
import { Category } from '../../../../core/models/category.model';
import { ToastrService } from 'ngx-toastr';
import {
  getCommonTestImports,
  getMockForumService,
  getMockAuthService,
  getMockRouter,
  getMockToastrService,
} from '../../../../core/testing/test-helpers';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Technology',
      description: 'Tech topics',
      iconClass: 'fa-laptop',
      topicsCount: 5,
    },
    {
      id: '2',
      name: 'Sports',
      description: 'Sports topics',
      iconClass: 'fa-football',
      topicsCount: 3,
    },
  ];

  const mockTopics: Topic[] = [
    {
      id: '1',
      title: 'Topic 1',
      content: 'Content 1',
      categoryId: '1',
      authorId: '1',
      authorName: 'User 1',
      createdAt: new Date(),
      commentsCount: 2,
      isBanned: false,
    },
    {
      id: '2',
      title: 'Topic 2',
      content: 'Content 2',
      categoryId: '1',
      authorId: '2',
      authorName: 'User 2',
      createdAt: new Date(),
      commentsCount: 1,
      isBanned: true,
    },
    {
      id: '3',
      title: 'Topic 3',
      content: 'Content 3',
      categoryId: '2',
      authorId: '1',
      authorName: 'User 1',
      createdAt: new Date(),
      commentsCount: 0,
      isBanned: false,
    },
  ];

  const mockComments: Comment[] = [
    {
      id: '1',
      topicId: '1',
      authorId: '2',
      authorName: 'User 2',
      content: 'Comment 1',
      createdAt: new Date(),
      isReported: false,
    },
    {
      id: '2',
      topicId: '1',
      authorId: '1',
      authorName: 'User 1',
      content: 'Comment 2',
      createdAt: new Date(),
      isReported: true,
    },
    {
      id: '3',
      topicId: '2',
      authorId: '1',
      authorName: 'User 1',
      content: 'Comment 3',
      createdAt: new Date(),
      isReported: false,
    },
  ];

  function setupTestBed(isAdmin = true, loadDataSuccess = true) {
    // Create mock services
    forumService = getMockForumService();
    Object.defineProperty(forumService, 'categories', {
      value: mockCategories,
    });

    if (loadDataSuccess) {
      forumService.getAllTopicsForAdmin.and.returnValue(of(mockTopics));
      forumService.getAllCommentsForAdmin.and.returnValue(of(mockComments));
    } else {
      forumService.getAllTopicsForAdmin.and.returnValue(
        throwError(() => new Error('Failed to load topics'))
      );
      forumService.getAllCommentsForAdmin.and.returnValue(
        throwError(() => new Error('Failed to load comments'))
      );
    }

    authService = getMockAuthService(true, isAdmin); // isLoggedIn=true, isAdmin depends on param
    router = getMockRouter();
    toastrService = getMockToastrService();

    TestBed.configureTestingModule({
      imports: [...getCommonTestImports(), AdminDashboardComponent, RouterLink],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastrService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}), // puedes simular parámetros si los usas
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Component initialization and access control', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should redirect to home if user is not admin', () => {
      // Reset TestBed with non-admin user
      TestBed.resetTestingModule();
      setupTestBed(false);

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should verify admin status on initialization', () => {
      spyOn(component, 'verifyAdminAccess').and.callThrough();
      component.ngOnInit();
      expect(component.verifyAdminAccess).toHaveBeenCalled();
    });
  });

  describe('Data loading', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should load categories count from forum service', () => {
      expect(component.categoriesCount).toBe(2);
    });

    it('should load topics counts from forum service', () => {
      expect(component.topicsCount).toBe(3);
      expect(component.bannedTopicsCount).toBe(1);
      expect(forumService.getAllTopicsForAdmin).toHaveBeenCalled();
    });

    it('should load comments counts from forum service', () => {
      expect(component.commentsCount).toBe(3);
      expect(component.reportedCommentsCount).toBe(1);
      expect(forumService.getAllCommentsForAdmin).toHaveBeenCalled();
    });

    it('should handle error while loading topics data', waitForAsync(() => {
      TestBed.resetTestingModule();
      setupTestBed(true, false);

      expect(toastrService.error).toHaveBeenCalled();
      expect(component.topicsCount).toBe(0);
      expect(component.bannedTopicsCount).toBe(0);
    }));

    it('should handle error while loading comments data', waitForAsync(() => {
      TestBed.resetTestingModule();
      setupTestBed(true, false);

      expect(toastrService.error).toHaveBeenCalled();
      expect(component.commentsCount).toBe(0);
      expect(component.reportedCommentsCount).toBe(0);
    }));

    it('should load most recent activity data properly', () => {
      // Clear any previous calls
      forumService.getAllTopicsForAdmin.calls.reset();
      forumService.getAllCommentsForAdmin.calls.reset();

      component.loadData();

      expect(forumService.getAllTopicsForAdmin).toHaveBeenCalled();
      expect(forumService.getAllCommentsForAdmin).toHaveBeenCalled();
      expect(component.recentActivity.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation methods', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should navigate to manage topics page when navigateToManageTopics is called', () => {
      component.navigateToManageTopics();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/topics']);
    });

    it('should navigate to manage comments page when navigateToManageComments is called', () => {
      component.navigateToManageComments();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/comments']);
    });

    it('should navigate to topic detail when viewTopic is called', () => {
      component.viewTopic('1');
      expect(router.navigate).toHaveBeenCalledWith(['/topic', '1']);
    });
  });

  describe('UI elements and interaction', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should display counts in the template', () => {
      fixture.detectChanges(); // Re-render after values are set

      const categoriesCountElement = fixture.debugElement.query(
        By.css('.card:nth-of-type(1) p.fs-2')
      ).nativeElement;
      expect(categoriesCountElement.textContent.trim()).toBe('2');

      const topicsCountElement = fixture.debugElement.query(
        By.css('.card:nth-of-type(2) p.fs-2')
      ).nativeElement;
      expect(topicsCountElement.textContent.trim()).toBe('3');

      const topicsBannedText = fixture.debugElement.query(
        By.css('.card:nth-of-type(2) p.text-secondary')
      ).nativeElement;
      expect(topicsBannedText.textContent).toContain('1');

      const commentsCountElement = fixture.debugElement.query(
        By.css('.card:nth-of-type(3) p.fs-2')
      ).nativeElement;
      expect(commentsCountElement.textContent.trim()).toBe('3');

      const commentsReportedText = fixture.debugElement.query(
        By.css('.card:nth-of-type(3) p.text-secondary')
      ).nativeElement;
      expect(commentsReportedText.textContent).toContain('1');
    });

    it('should have buttons that navigate to corresponding routes', () => {
      const manageTopicsButton = fixture.debugElement.query(
        By.css('.card:nth-of-type(2) button')
      );
      expect(manageTopicsButton).toBeTruthy();

      const manageCommentsButton = fixture.debugElement.query(
        By.css('.card:nth-of-type(3) button')
      );
      expect(manageCommentsButton).toBeTruthy();

      const homeLink = fixture.debugElement.query(By.css('a[routerLink="/"]'));
      expect(homeLink).toBeTruthy();
    });

    it('should trigger navigation when manage topics button is clicked', () => {
      const manageTopicsButton = fixture.debugElement.query(
        By.css('.card:nth-of-type(2) button')
      ).nativeElement;
      manageTopicsButton.click();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/topics']);
    });

    it('should trigger navigation when manage comments button is clicked', () => {
      const manageCommentsButton = fixture.debugElement.query(
        By.css('.card:nth-of-type(3) button')
      ).nativeElement;
      manageCommentsButton.click();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/comments']);
    });

    it('should call viewTopic when clicking on a topic in recent activity', () => {
      spyOn(component, 'viewTopic');

      // Ensure we have recent activity data
      expect(component.recentActivity.length).toBeGreaterThan(0);

      const firstTopicLink = fixture.debugElement.query(
        By.css('tbody tr:first-child button')
      ).nativeElement;
      firstTopicLink.click();

      expect(component.viewTopic).toHaveBeenCalled();
    });
  });

  describe('Recent activity display', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should display the recent activity table', () => {
      const tableElement = fixture.debugElement.query(By.css('table.table'));
      expect(tableElement).toBeTruthy();

      const tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(tableRows.length).toBeGreaterThan(0);
    });

    it('should show topic titles in recent activity', () => {
      const firstRow = fixture.debugElement.query(
        By.css('tbody tr:first-child')
      );
      expect(firstRow.nativeElement.textContent).toContain(mockTopics[0].title);
    });

    it('should show activity type in recent activity', () => {
      const firstRow = fixture.debugElement.query(
        By.css('tbody tr:first-child')
      );
      expect(firstRow.nativeElement.textContent).toContain('Tema');
    });

    it('should sort recent activity by date', () => {
      // Verify sorting logic works correctly
      const sortedItems = [
        ...mockTopics.map((t) => ({
          id: t.id,
          title: t.title,
          type: 'topic',
          authorName: t.authorName,
          date: t.createdAt,
        })),
        ...mockComments.map((c) => ({
          id: c.id,
          title: `Comment on Topic ${c.topicId}`,
          type: 'comment',
          authorName: c.authorName,
          date: c.createdAt,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      expect(component.recentActivity.length).toBe(sortedItems.length);

      // Dates should be in descending order
      let lastTime = Infinity;
      component.recentActivity.forEach((item) => {
        const time = item.date.getTime();
        expect(time).toBeLessThanOrEqual(lastTime);
        lastTime = time;
      });
    });

    it('should display appropriate status indicators', () => {
      const bannedTopicRow = fixture.debugElement
        .queryAll(By.css('tbody tr'))
        .find((row) =>
          row.nativeElement.textContent.includes(mockTopics[1].title)
        );
      const reportedCommentRow = fixture.debugElement
        .queryAll(By.css('tbody tr'))
        .find((row) =>
          row.nativeElement.textContent.includes(
            `Comment on Topic ${mockComments[1].topicId}`
          )
        );

      // Verify the banned topic has a status indicator
      expect(bannedTopicRow?.query(By.css('.badge-danger'))).toBeTruthy();

      // Verify the reported comment has a status indicator
      expect(reportedCommentRow?.query(By.css('.badge-warning'))).toBeTruthy();
    });
  });

  describe('Activity processing methods', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should correctly process topics for activity', () => {
      // Clear existing activity
      component.recentActivity = [];

      // Process topics manually
      component['processTopicsForActivity'](mockTopics);

      // Verify the activity items were created correctly
      expect(component.recentActivity.length).toBe(mockTopics.length);

      // Check that the topic data is mapped correctly
      mockTopics.forEach((topic) => {
        const activityItem = component.recentActivity.find(
          (item) => item.id === topic.id
        );
        expect(activityItem).toBeTruthy();
        expect(activityItem?.title).toBe(topic.title);
        expect(activityItem?.type).toBe('topic');
        expect(activityItem?.authorName).toBe(topic.authorName);
        expect(activityItem?.date).toBe(topic.createdAt);
        expect(activityItem?.status?.isBanned).toBe(topic.isBanned);
      });
    });

    it('should correctly process comments for activity', () => {
      // Clear existing activity
      component.recentActivity = [];

      // Process comments manually
      component['processCommentsForActivity'](mockComments);

      // Verify the activity items were created correctly
      expect(component.recentActivity.length).toBe(mockComments.length);

      // Check that the comment data is mapped correctly
      mockComments.forEach((comment) => {
        const activityItem = component.recentActivity.find(
          (item) => item.id === comment.id
        );
        expect(activityItem).toBeTruthy();
        expect(activityItem?.title).toBe(`Comment on Topic ${comment.topicId}`);
        expect(activityItem?.type).toBe('comment');
        expect(activityItem?.authorName).toBe(comment.authorName);
        expect(activityItem?.date).toBe(comment.createdAt);
        expect(activityItem?.status?.isReported).toBe(comment.isReported);
      });
    });

    it('should update recent activity with new items sorted by date', () => {
      // Create some sample activity items with different dates
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const existingItems = [
        {
          id: '1',
          title: 'Existing Item 1',
          type: 'topic' as const,
          authorName: 'User 1',
          date: yesterday,
          status: { isBanned: false },
        },
      ];

      const newItems = [
        {
          id: '2',
          title: 'New Item 1',
          type: 'topic' as const,
          authorName: 'User 2',
          date: now,
          status: { isBanned: false },
        },
        {
          id: '3',
          title: 'New Item 2',
          type: 'comment' as const,
          authorName: 'User 3',
          date: twoDaysAgo,
          status: { isReported: true },
        },
      ];

      // Set existing items and update with new items
      component.recentActivity = [...existingItems];
      component['updateRecentActivity'](newItems);

      // Verify we have all items
      expect(component.recentActivity.length).toBe(3);

      // Verify they are sorted by date (newest first)
      expect(component.recentActivity[0].id).toBe('2'); // newest
      expect(component.recentActivity[1].id).toBe('1');
      expect(component.recentActivity[2].id).toBe('3'); // oldest
    });

    it('should limit recent activity to the most recent 10 items', () => {
      // Create 15 items with descending dates
      const items = Array.from({ length: 15 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - i); // Each item is 1 hour older

        return {
          id: `${i + 1}`,
          title: `Item ${i + 1}`,
          type: 'topic' as const,
          authorName: `User ${i + 1}`,
          date: date,
          status: { isBanned: false },
        };
      });

      // Clear existing activity and update with all items
      component.recentActivity = [];
      component['updateRecentActivity'](items);

      // Verify only 10 items are kept
      expect(component.recentActivity.length).toBe(10);

      // Verify the newest items are kept (item IDs 1 through 10)
      for (let i = 0; i < 10; i++) {
        expect(component.recentActivity[i].id).toBe(`${i + 1}`);
      }

      // Verify the oldest items are removed (no items with IDs 11-15)
      const hasOldItems = component.recentActivity.some(
        (item) => parseInt(item.id) > 10 && parseInt(item.id) <= 15
      );
      expect(hasOldItems).toBeFalse();
    });
  });

  describe('Admin dashboard functionality', () => {
    beforeEach(waitForAsync(() => {
      setupTestBed();
    }));

    it('should refresh data when refreshData is called', () => {
      forumService.getAllTopicsForAdmin.calls.reset();
      forumService.getAllCommentsForAdmin.calls.reset();

      component.refreshData();

      expect(forumService.getAllTopicsForAdmin).toHaveBeenCalled();
      expect(forumService.getAllCommentsForAdmin).toHaveBeenCalled();
    });

    it('should display page title correctly', () => {
      const pageTitle = fixture.debugElement.query(By.css('h1')).nativeElement;
      expect(pageTitle.textContent).toContain('Panel de Administración');
    });

    it('should format dates in a readable format', () => {
      const dateCell = fixture.debugElement.query(
        By.css('tbody tr:first-child td:nth-child(4)')
      ).nativeElement;
      expect(dateCell.textContent.trim()).not.toBe('');

      // Date should be in a readable format, not a raw date object
      const rawDateString = mockTopics[0].createdAt.toString();
      expect(dateCell.textContent.trim()).not.toBe(rawDateString);
    });
  });
});
