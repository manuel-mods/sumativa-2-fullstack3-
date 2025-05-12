import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ManageTopicsComponent } from './manage-topics.component';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Category } from '../../../../core/models/category.model';
import {
  getCommonTestImports,
  getMockForumService,
  getMockAuthService,
  getMockRouter,
} from '../../../../core/testing/test-helpers';

describe('ManageTopicsComponent', () => {
  let component: ManageTopicsComponent;
  let fixture: ComponentFixture<ManageTopicsComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockTopics: Topic[] = [
    {
      id: '1',
      title: 'Regular Topic 1',
      content: 'Regular Content 1',
      categoryId: 'cat1',
      authorId: 'user1',
      authorName: 'User One',
      createdAt: new Date(),
      commentsCount: 2,
      isBanned: false,
    },
    {
      id: '2',
      title: 'Banned Topic',
      content: 'Banned Content',
      categoryId: 'cat2',
      authorId: 'user2',
      authorName: 'User Two',
      createdAt: new Date(),
      commentsCount: 0,
      isBanned: true,
    },
    {
      id: '3',
      title: 'Regular Topic 2',
      content: 'Regular Content 2',
      categoryId: 'cat1',
      authorId: 'user3',
      authorName: 'User Three',
      createdAt: new Date(),
      commentsCount: 5,
      isBanned: false,
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Technology',
      description: 'Tech topics',
      iconClass: 'fa-laptop',
      topicsCount: 2,
    },
    {
      id: 'cat2',
      name: 'Sports',
      description: 'Sports topics',
      iconClass: 'fa-football',
      topicsCount: 1,
    },
  ];

  beforeEach(async () => {
    // Create mock services
    forumService = getMockForumService();
    Object.defineProperty(forumService, 'categories', {
      value: mockCategories,
    });
    forumService.getAllTopicsForAdmin.and.returnValue(of(mockTopics));
    forumService.deleteTopic.and.returnValue(of(true));
    forumService.banTopic.and.returnValue(of(true));
    forumService.unbanTopic.and.returnValue(of(true));
    forumService.updateTopic.and.returnValue(
      of({ ...mockTopics[0], title: 'Updated Title' })
    );

    authService = getMockAuthService(true, true); // isLoggedIn=true, isAdmin=true
    router = getMockRouter();

    await TestBed.configureTestingModule({
      imports: [
        ...getCommonTestImports(),
        ManageTopicsComponent,
        RouterLink,
        FormsModule,
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

    fixture = TestBed.createComponent(ManageTopicsComponent);
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

  it('should load topics and categories on init', () => {
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalled();

    expect(component.topics.length).toBe(3);
    expect(component.filteredTopics.length).toBe(3);
    expect(component.categories['cat1']).toBeDefined();
    expect(component.categories['cat2']).toBeDefined();
  });

  it('should get category name by id', () => {
    expect(component.getCategory('cat1')).toBe('Technology');
    expect(component.getCategory('cat2')).toBe('Sports');
    expect(component.getCategory('unknown')).toBe('Unknown Category');
  });

  it('should get category list', () => {
    const categoryList = component.getCategoryList();
    expect(categoryList.length).toBe(2);
    expect(categoryList).toEqual(mockCategories);
  });

  it('should filter topics by search term', () => {
    component.searchTerm = 'Regular';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(2);
    expect(component.filteredTopics[0].title).toContain('Regular');
    expect(component.filteredTopics[1].title).toContain('Regular');
  });

  it('should filter topics by author name', () => {
    component.searchTerm = 'User One';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(1);
    expect(component.filteredTopics[0].authorName).toBe('User One');
  });

  it('should filter topics by category name', () => {
    component.searchTerm = 'Technology';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(2);
    expect(component.filteredTopics[0].categoryId).toBe('cat1');
    expect(component.filteredTopics[1].categoryId).toBe('cat1');
  });

  it('should filter topics by status', () => {
    component.statusFilter = 'banned';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(1);
    expect(component.filteredTopics[0].isBanned).toBeTruthy();
  });

  it('should filter topics by category id', () => {
    component.categoryFilter = 'cat2';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(1);
    expect(component.filteredTopics[0].categoryId).toBe('cat2');
  });

  it('should apply multiple filters together', () => {
    component.searchTerm = 'Regular';
    component.statusFilter = 'active';
    component.categoryFilter = 'cat1';
    component.applyFilters();

    expect(component.filteredTopics.length).toBe(2);
    expect(component.filteredTopics[0].title).toContain('Regular');
    expect(component.filteredTopics[0].isBanned).toBeFalsy();
    expect(component.filteredTopics[0].categoryId).toBe('cat1');
  });

  it('should handle pagination correctly', () => {
    // Mock 15 topics to test pagination
    const paginationTopics: Topic[] = [];
    for (let i = 1; i <= 15; i++) {
      paginationTopics.push({
        id: i.toString(),
        title: `Topic ${i}`,
        content: `Content ${i}`,
        categoryId: 'cat1',
        authorId: 'user1',
        authorName: 'User One',
        createdAt: new Date(),
        commentsCount: 0,
        isBanned: false,
      });
    }

    component.topics = paginationTopics;
    component.filteredTopics = paginationTopics;
    component.itemsPerPage = 5;

    expect(component.totalPages).toBe(3);
    expect(component.pageNumbers).toEqual([1, 2, 3]);

    // First page
    component.currentPage = 1;
    expect(component.paginatedTopics.length).toBe(5);
    expect(component.paginatedTopics[0].id).toBe('1');
    expect(component.paginatedTopics[4].id).toBe('5');

    // Navigate to second page
    component.setPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedTopics.length).toBe(5);
    expect(component.paginatedTopics[0].id).toBe('6');

    // Navigate to third page
    component.setPage(3);
    expect(component.currentPage).toBe(3);
    expect(component.paginatedTopics.length).toBe(5);
    expect(component.paginatedTopics[0].id).toBe('11');

    // Try to navigate past the last page
    component.setPage(4);
    expect(component.currentPage).toBe(3); // Should remain on last page

    // Try to navigate to page 0
    component.setPage(0);
    expect(component.currentPage).toBe(3); // Should remain on current page
  });

  it('should open delete confirmation modal', () => {
    const topic = mockTopics[0];
    component.confirmDelete(topic);

    expect(component.selectedTopic).toBe(topic);
    expect(component.showDeleteConfirmation).toBeTruthy();
  });

  it('should cancel delete operation', () => {
    component.selectedTopic = mockTopics[0];
    component.showDeleteConfirmation = true;

    component.cancelDelete();

    expect(component.selectedTopic).toBeNull();
    expect(component.showDeleteConfirmation).toBeFalsy();
  });

  it('should delete topic when confirmed', () => {
    const topic = mockTopics[0];
    component.selectedTopic = topic;
    component.showDeleteConfirmation = true;

    component.deleteTopic(topic.id);

    expect(forumService.deleteTopic).toHaveBeenCalledWith(topic.id);
    expect(component.showDeleteConfirmation).toBeFalsy();
    expect(component.selectedTopic).toBeNull();
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after delete
  });

  it('should handle delete topic failure', () => {
    forumService.deleteTopic.and.returnValue(of(false));
    spyOn(console, 'error');

    const topic = mockTopics[0];
    component.deleteTopic(topic.id);

    expect(console.error).toHaveBeenCalledWith('Failed to delete topic');
    expect(component.showDeleteConfirmation).toBeTruthy(); // Modal should remain open on error
  });

  it('should ban a topic', () => {
    const topic = mockTopics[0]; // Active topic
    component.toggleBanTopic(topic);

    expect(forumService.banTopic).toHaveBeenCalledWith(topic.id);
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after ban
  });

  it('should unban a topic', () => {
    const topic = mockTopics[1]; // Banned topic
    component.toggleBanTopic(topic);

    expect(forumService.unbanTopic).toHaveBeenCalledWith(topic.id);
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after unban
  });

  it('should navigate to topic detail', () => {
    const topicId = '1';
    component.viewTopic(topicId);

    expect(router.navigate).toHaveBeenCalledWith(['/topic', topicId]);
  });

  it('should open edit modal with topic data', () => {
    const topic = mockTopics[0];
    component.openEditModal(topic);

    expect(component.selectedTopic).toBe(topic);
    expect(component.editTopicTitle).toBe(topic.title);
    expect(component.editTopicContent).toBe(topic.content);
    expect(component.editTopicCategory).toBe(topic.categoryId);
    expect(component.showEditModal).toBeTruthy();
  });

  it('should cancel edit operation', () => {
    component.selectedTopic = mockTopics[0];
    component.editTopicTitle = 'Test';
    component.editTopicContent = 'Test';
    component.editTopicCategory = 'cat1';
    component.showEditModal = true;

    component.cancelEdit();

    expect(component.selectedTopic).toBeNull();
    expect(component.showEditModal).toBeFalsy();
    expect(component.editTopicTitle).toBe('');
    expect(component.editTopicContent).toBe('');
    expect(component.editTopicCategory).toBe('');
  });

  it('should reset edit form', () => {
    component.editTopicTitle = 'Test';
    component.editTopicContent = 'Test';
    component.editTopicCategory = 'cat1';
    component.isSubmitting = true;

    component.resetEditForm();

    expect(component.editTopicTitle).toBe('');
    expect(component.editTopicContent).toBe('');
    expect(component.editTopicCategory).toBe('');
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should not save topic if required fields are missing', () => {
    component.selectedTopic = mockTopics[0];

    // Empty title
    component.editTopicTitle = '';
    component.editTopicContent = 'Content';
    component.editTopicCategory = 'cat1';

    component.saveTopic();
    expect(forumService.updateTopic).not.toHaveBeenCalled();

    // Empty content
    component.editTopicTitle = 'Title';
    component.editTopicContent = '';

    component.saveTopic();
    expect(forumService.updateTopic).not.toHaveBeenCalled();

    // No selected topic
    component.selectedTopic = null;
    component.editTopicTitle = 'Title';
    component.editTopicContent = 'Content';

    component.saveTopic();
    expect(forumService.updateTopic).not.toHaveBeenCalled();
  });

  it('should save topic successfully', () => {
    const topic = mockTopics[0];
    component.selectedTopic = topic;
    component.editTopicTitle = 'Updated Title';
    component.editTopicContent = 'Updated Content';
    component.editTopicCategory = 'cat2';

    component.saveTopic();

    expect(component.isSubmitting).toBeTruthy();
    expect(forumService.updateTopic).toHaveBeenCalledWith(
      topic.id,
      'Updated Title',
      'Updated Content',
      'cat2'
    );

    // After successful update
    expect(component.showEditModal).toBeFalsy();
    expect(component.selectedTopic).toBeNull();
    expect(component.editTopicTitle).toBe('');
    expect(component.editTopicContent).toBe('');
    expect(component.editTopicCategory).toBe('');
    expect(component.isSubmitting).toBeFalsy();
    expect(forumService.getAllTopicsForAdmin).toHaveBeenCalledTimes(2); // Initial + after save
  });

  it('should handle save topic failure', () => {
    forumService.updateTopic.and.returnValue(of(null));
    spyOn(console, 'error');

    const topic = mockTopics[0];
    component.selectedTopic = topic;
    component.editTopicTitle = 'Updated Title';
    component.editTopicContent = 'Updated Content';
    component.editTopicCategory = 'cat2';

    component.saveTopic();

    expect(console.error).toHaveBeenCalledWith('Failed to update topic');
    expect(component.isSubmitting).toBeFalsy();
    expect(component.showEditModal).toBeTruthy(); // Modal should stay open on error
  });

  // UI Interaction Tests
  it('should call applyFilters when search input changes', () => {
    spyOn(component, 'applyFilters');

    const searchInput = fixture.debugElement.query(
      By.css('#search')
    ).nativeElement;
    searchInput.value = 'Test';
    searchInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should call applyFilters when status filter changes', () => {
    spyOn(component, 'applyFilters');

    const statusSelect = fixture.debugElement.query(
      By.css('#status-filter')
    ).nativeElement;
    statusSelect.value = statusSelect.options[1].value; // 'active' option
    statusSelect.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should call applyFilters when category filter changes', () => {
    spyOn(component, 'applyFilters');

    const categorySelect = fixture.debugElement.query(
      By.css('#category-filter')
    ).nativeElement;
    categorySelect.value = categorySelect.options[1].value; // first category option
    categorySelect.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should call confirmDelete when delete button is clicked', () => {
    spyOn(component, 'confirmDelete');

    if (fixture.debugElement.queryAll(By.css('tbody tr')).length > 0) {
      const deleteButton = fixture.debugElement.query(
        By.css('.btn-danger')
      ).nativeElement;
      deleteButton.click();

      expect(component.confirmDelete).toHaveBeenCalled();
    }
  });

  it('should call toggleBanTopic when ban button is clicked', () => {
    spyOn(component, 'toggleBanTopic');

    if (fixture.debugElement.queryAll(By.css('tbody tr')).length > 0) {
      const banButton = fixture.debugElement.query(
        By.css('.btn-warning, .btn-success')
      ).nativeElement;
      banButton.click();

      expect(component.toggleBanTopic).toHaveBeenCalled();
    }
  });

  it('should call viewTopic when view button is clicked', () => {
    spyOn(component, 'viewTopic');

    if (fixture.debugElement.queryAll(By.css('tbody tr')).length > 0) {
      const viewButton = fixture.debugElement.query(
        By.css('.btn-primary')
      ).nativeElement;
      viewButton.click();

      expect(component.viewTopic).toHaveBeenCalled();
    }
  });

  it('should call openEditModal when edit button is clicked', () => {
    spyOn(component, 'openEditModal');

    if (fixture.debugElement.queryAll(By.css('tbody tr')).length > 0) {
      const editButton = fixture.debugElement.query(
        By.css('.btn-info')
      ).nativeElement;
      editButton.click();

      expect(component.openEditModal).toHaveBeenCalled();
    }
  });
});
