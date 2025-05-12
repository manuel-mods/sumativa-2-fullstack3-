import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum.service';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

describe('ForumService', () => {
  let service: ForumService;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
  };

  const mockAdmin = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Create auth service spy
    const authServiceSpy = jasmine.createSpyObj(
      'AuthService',
      ['login', 'logout', 'register'],
      {
        currentUser: mockUser,
        isLoggedIn: true,
      }
    );

    TestBed.configureTestingModule({
      providers: [
        ForumService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    // Get services
    service = TestBed.inject(ForumService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Clear localStorage to ensure clean state
    localStorage.removeItem(service.CATEGORIES_KEY);
    localStorage.removeItem(service.TOPICS_KEY);
    localStorage.removeItem(service.COMMENTS_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default categories', () => {
    const categories = service.categories;
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].name).toBeTruthy();
  });

  it('should get a specific category by id', () => {
    const categories = service.categories;
    const categoryId = categories[0].id;

    const category = service.getCategory(categoryId);

    expect(category).toBeTruthy();
    expect(category?.id).toBe(categoryId);
  });

  it('should create a new topic', () => {
    const categoryId = service.categories[0].id;
    const title = 'Test Topic';
    const content = 'Test Content';

    const topic = service.createTopic(title, content, categoryId) as any;

    expect(topic).toBeTruthy();
    expect(topic.id).toBeTruthy();
    expect(topic.title).toBe(title);
    expect(topic.content).toBe(content);
    expect(topic.categoryId).toBe(categoryId);
    expect(topic.authorId).toBe(mockUser.id);
    expect(topic.authorName).toBe(mockUser.name);

    // Verify topic exists in service
    const foundTopic = service.getTopic(topic.id);
    expect(foundTopic).toBeTruthy();
    expect(foundTopic?.title).toBe(title);

    // Verify category topic count update
    const category = service.getCategory(categoryId);
    expect(category?.topicsCount).toBeGreaterThan(0);
  });

  it('should get topics by category', () => {
    const categoryId = service.categories[0].id;

    // Create two topics in same category
    service.createTopic('Topic 1', 'Content 1', categoryId);
    service.createTopic('Topic 2', 'Content 2', categoryId);

    // Create one topic in different category
    const otherCategoryId = service.categories[1].id;
    service.createTopic('Other Topic', 'Other Content', otherCategoryId);

    const topics = service.getTopicsByCategory(categoryId);

    expect(topics.length).toBe(2);
    expect(topics[0].categoryId).toBe(categoryId);
    expect(topics[1].categoryId).toBe(categoryId);
  });

  it('should create and retrieve comments for a topic', () => {
    // Create topic
    const categoryId = service.categories[0].id;
    const topic = service.createTopic(
      'Test Topic',
      'Test Content',
      categoryId
    ) as any;

    // Create comments
    const comment1 = service.createComment(topic.id, 'Comment 1');
    const comment2 = service.createComment(topic.id, 'Comment 2');

    // Get comments
    const comments = service.getCommentsByTopic(topic.id);

    expect(comments.length).toBe(2);
    expect(comments[0].content).toBe('Comment 1');
    expect(comments[1].content).toBe('Comment 2');
    expect(comments[0].topicId).toBe(topic.id);
    expect(comments[0].authorId).toBe(mockUser.id);

    // Verify topic comment count update
    const updatedTopic = service.getTopic(topic.id);
    expect(updatedTopic?.commentsCount).toBe(2);
  });

  it('should delete a comment', () => {
    // Create topic and comments
    const topic = service.createTopic(
      'Test Topic',
      'Test Content',
      service.categories[0].id
    ) as any;
    const comment = service.createComment(topic.id, 'Test Comment') as any;

    // Delete comment
    service.deleteComment(comment.id);

    // Verify comment was deleted
    const comments = service.getCommentsByTopic(topic.id);
    expect(comments.length).toBe(0);

    // Verify topic comment count update
    const updatedTopic = service.getTopic(topic.id);
    expect(updatedTopic?.commentsCount).toBe(0);
  });

  it('should report and unreport comments', () => {
    // Create topic and comment
    const topic = service.createTopic(
      'Test Topic',
      'Test Content',
      service.categories[0].id
    ) as any;
    const comment = service.createComment(topic.id, 'Test Comment') as any;

    // Report comment
    service.reportComment(comment.id);

    // Verify comment is reported
    let comments = service.getCommentsByTopic(topic.id);
    expect(comments[0].isReported).toBeTrue();

    // Unreport comment
    service.unreportComment(comment.id);

    // Verify comment is no longer reported
    comments = service.getCommentsByTopic(topic.id);
    expect(comments[0].isReported).toBeFalse();
  });

  it('should ban and unban topics', () => {
    // Create topic
    const topic = service.createTopic(
      'Test Topic',
      'Test Content',
      service.categories[0].id
    ) as any;

    // Ban topic
    service.banTopic(topic.id);

    // Verify topic is banned
    let updatedTopic = service.getTopic(topic.id) as any;
    expect(updatedTopic?.isBanned).toBeTrue();

    // Unban topic
    service.unbanTopic(topic.id);

    // Verify topic is no longer banned
    updatedTopic = service.getTopic(topic.id);
    expect(updatedTopic?.isBanned).toBeFalse();
  });

  it('should delete a topic and its comments', () => {
    // Create topic and comments
    const topic = service.createTopic(
      'Test Topic',
      'Test Content',
      service.categories[0].id
    ) as any;
    service.createComment(topic.id, 'Comment 1');
    service.createComment(topic.id, 'Comment 2');

    // Delete topic
    service.deleteTopic(topic.id);

    // Verify topic was deleted
    const foundTopic = service.getTopic(topic.id);
    expect(foundTopic).toBeUndefined();

    // Verify comments were deleted
    const comments = service.getCommentsByTopic(topic.id);
    expect(comments.length).toBe(0);

    // Verify category topic count update
    const category = service.getCategory(topic.categoryId);
    expect(category?.topicsCount).toBe(0);
  });

  it('should get all topics for admin', () => {
    // Create topics in different categories
    const category1 = service.categories[0].id;
    const category2 = service.categories[1].id;

    service.createTopic('Topic 1', 'Content 1', category1);
    service.createTopic('Topic 2', 'Content 2', category1);
    service.createTopic('Topic 3', 'Content 3', category2);

    const allTopics = service.getAllTopicsForAdmin();

    expect(allTopics.length).toBe(3);
  });

  it('should get all comments for admin', () => {
    // Create topics and comments
    const topic1 = service.createTopic(
      'Topic 1',
      'Content 1',
      service.categories[0].id
    ) as any;
    const topic2 = service.createTopic(
      'Topic 2',
      'Content 2',
      service.categories[1].id
    ) as any;

    service.createComment(topic1.id, 'Comment 1');
    service.createComment(topic1.id, 'Comment 2');
    service.createComment(topic2.id, 'Comment 3');

    const allComments = service.getAllCommentsForAdmin();

    expect(allComments.length).toBe(3);
  });

  it('should persist data to localStorage', () => {
    // Create topic and comment
    const topic = service.createTopic(
      'Persistent Topic',
      'Content',
      service.categories[0].id
    ) as any;
    service.createComment(topic.id, 'Persistent Comment');

    // Create new instance of service to simulate page reload
    TestBed.resetTestingModule();
    const newAuthServiceSpy = jasmine.createSpyObj(
      'AuthService',
      ['login', 'logout', 'register'],
      {
        currentUser: mockUser,
        isLoggedIn: true,
      }
    );

    TestBed.configureTestingModule({
      providers: [
        ForumService,
        { provide: AuthService, useValue: newAuthServiceSpy },
      ],
    });

    const newService = TestBed.inject(ForumService);

    // Verify data persisted
    const persistedTopic = newService.getTopic(topic.id);
    expect(persistedTopic).toBeTruthy();
    expect(persistedTopic?.title).toBe('Persistent Topic');

    const persistedComments = newService.getCommentsByTopic(topic.id);
    expect(persistedComments.length).toBe(1);
    expect(persistedComments[0].content).toBe('Persistent Comment');
  });
});
