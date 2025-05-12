import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { DatePipe } from '@angular/common';

import { ManageCommentsComponent } from './manage-comments.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';
import {
  getCommonTestImports,
  getMockForumService,
  getMockAuthService,
  getMockRouter,
} from '../../../../core/testing/test-helpers';

describe('ManageCommentsComponent', () => {
  let component: ManageCommentsComponent;
  let fixture: ComponentFixture<ManageCommentsComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    // Create mock services
    forumService = getMockForumService();
    forumService.getAllTopicsForAdmin.and.returnValue(of(mockTopics));
    forumService.getAllCommentsForAdmin.and.returnValue(of(mockComments));
    forumService.deleteComment.and.returnValue(of(true));
    forumService.reportComment.and.returnValue(of(true));
    forumService.unreportComment.and.returnValue(of(true));

    authService = getMockAuthService(true, true); // isLoggedIn=true, isAdmin=true
    router = getMockRouter();

    await TestBed.configureTestingModule({
      imports: [
        ...getCommonTestImports(),
        ManageCommentsComponent,
        RouterLink,
        DatePipe,
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}), // puedes simular parámetros si los usas
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to home if user is not admin', () => {
    // Override authService.isAdmin to return false
    Object.defineProperty(authService, 'isAdmin', { get: () => false });

    // Re-trigger ngOnInit
    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should load topics and comments on init', () => {
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalled();
    expect(forumService.getAllCommentsForAdmin).toHaveBeenCalled();

    expect(component.topics['1']).toEqual(mockTopics[0]);
    expect(component.topics['2']).toEqual(mockTopics[1]);
    expect(component.comments.length).toBe(3);
  });

  it('should toggle reported filter', () => {
    expect(component.showReportedOnly).toBeFalsy();
    expect(component.comments.length).toBe(3);

    component.toggleReportedFilter();

    expect(component.showReportedOnly).toBeTruthy();
    expect(forumService.getAllCommentsForAdmin).toHaveBeenCalledTimes(2);
  });

  it('should get topic title by id', () => {
    expect(component.getTopic('1')).toBe('Topic 1');
    expect(component.getTopic('2')).toBe('Topic 2');
    expect(component.getTopic('999')).toBe('Unknown Topic');
  });

  it('should delete comment', () => {
    const commentId = '1';
    component.deleteComment(commentId);

    expect(forumService.deleteComment).toHaveBeenCalledWith(commentId);
    expect(forumService.getAllCommentsForAdmin).toHaveBeenCalledTimes(2);
  });

  it('should report comment', () => {
    const comment = { ...mockComments[0] }; // Comment that's not reported
    component.toggleReportComment(comment);

    expect(forumService.reportComment).toHaveBeenCalledWith(comment.id);
    expect(forumService.getAllCommentsForAdmin).toHaveBeenCalledTimes(2);
  });

  it('should unreport comment', () => {
    const comment = { ...mockComments[1] }; // Comment that's already reported
    component.toggleReportComment(comment);

    expect(forumService.unreportComment).toHaveBeenCalledWith(comment.id);
    expect(forumService.getAllCommentsForAdmin).toHaveBeenCalledTimes(2);
  });

  it('should navigate to topic detail page', () => {
    const topicId = '1';
    component.viewTopic(topicId);

    expect(router.navigate).toHaveBeenCalledWith(['/topic', topicId]);
  });

  it('should display comments in the template', () => {
    const commentRows = fixture.debugElement.queryAll(
      By.css('tbody tr:not(:first-child)')
    );
    expect(commentRows.length).toBe(3);

    // Check content of first comment
    const firstCommentContent = commentRows[0].query(
      By.css('td:first-child div')
    ).nativeElement.textContent;
    expect(firstCommentContent).toContain('Comment 1');

    // Check status indicators
    const normalStatus = commentRows[0].query(By.css('.bg-green-100'));
    const reportedStatus = commentRows[1].query(By.css('.bg-red-100'));

    expect(normalStatus).toBeTruthy();
    expect(reportedStatus).toBeTruthy();
  });

  it('should have action buttons for each comment', () => {
    const firstCommentRow = fixture.debugElement.queryAll(
      By.css('tbody tr')
    )[1];
    const actionButtons = firstCommentRow.queryAll(By.css('button'));

    expect(actionButtons.length).toBe(3);
    expect(actionButtons[0].nativeElement.textContent.trim()).toContain(
      'View Topic'
    );
    expect(actionButtons[1].nativeElement.textContent.trim()).toContain(
      'Report'
    );
    expect(actionButtons[2].nativeElement.textContent.trim()).toContain(
      'Delete'
    );
  });

  it('should call correct methods when action buttons are clicked', () => {
    spyOn(component, 'viewTopic');
    spyOn(component, 'toggleReportComment');
    spyOn(component, 'deleteComment');

    const firstCommentRow = fixture.debugElement.queryAll(
      By.css('tbody tr')
    )[1];
    const actionButtons = firstCommentRow.queryAll(By.css('button'));

    actionButtons[0].nativeElement.click();
    expect(component.viewTopic).toHaveBeenCalledWith('1');

    actionButtons[1].nativeElement.click();
    expect(component.toggleReportComment).toHaveBeenCalled();

    actionButtons[2].nativeElement.click();
    expect(component.deleteComment).toHaveBeenCalledWith('1');
  });

  it('should show filter toggle button', () => {
    const filterButton = fixture.debugElement.query(
      By.css('button[class*="px-4 py-2 border"]')
    ).nativeElement;
    expect(filterButton.textContent.trim()).toContain('Show Reported Only');

    component.showReportedOnly = true;
    fixture.detectChanges();

    expect(filterButton.textContent.trim()).toContain('Show All Comments');
  });

  it('should filter comments when showReportedOnly is true', () => {
    component.showReportedOnly = true;
    component.loadComments();

    // Mock implementation for filtering
    const reportedComments = mockComments.filter((c) => c.isReported);
    forumService.getAllCommentsForAdmin.and.returnValue(of(mockComments));
    fixture.detectChanges();

    expect(component.comments.length).toBe(1);
    expect(component.comments[0].id).toBe('2');
  });

  it('should handle empty comments array', () => {
    forumService.getAllCommentsForAdmin.and.returnValue(of([]));
    component.loadComments();
    fixture.detectChanges();

    expect(component.comments.length).toBe(0);

    const noCommentsMessage = fixture.debugElement.query(
      By.css('tbody tr td.text-center')
    );
    expect(noCommentsMessage.nativeElement.textContent.trim()).toBe(
      'No comments found'
    );
  });
});
