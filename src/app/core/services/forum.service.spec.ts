import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum.service';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

describe('ForumService', () => {
  let service: ForumService;
  let authService: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;
  let toastrService: jasmine.SpyObj<ToastrService>;
  
  const API_URL = 'http://localhost:8080/api';

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
  };

  const mockAdmin = {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Create auth service and toastr spies
    const authServiceSpy = jasmine.createSpyObj(
      'AuthService',
      ['getToken'],
      {
        currentUser: mockUser,
        isLoggedIn: true,
        isAdmin: false
      }
    );
    authServiceSpy.getToken.and.returnValue('mock-token');

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [
        ForumService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ],
    });

    // Get services and mocks
    service = TestBed.inject(ForumService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpMock = TestBed.inject(HttpTestingController);
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  afterEach(() => {
    // Verify there are no outstanding HTTP requests
    httpMock.verify();
  });

  // Helper function to handle initial HTTP requests during service initialization
  function handleInitialRequests() {
    // Respond to any initial topics request that the service may make during initialization
    const topicReq = httpMock.match(`${API_URL}/topics`);
    topicReq.forEach(req => req.flush([]));

    // Handle any other initial requests
    const commentReq = httpMock.match(`${API_URL}/comments`);
    commentReq.forEach(req => req.flush([]));
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
    handleInitialRequests();
  });

  it('should initialize with default categories', () => {
    const categories = service.categories;
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].name).toBeTruthy();
    handleInitialRequests();
  });

  it('should get a specific category by id', () => {
    const categories = service.categories;
    const categoryId = categories[0].id;

    const category = service.getCategory(categoryId);

    expect(category).toBeTruthy();
    expect(category?.id).toBe(categoryId);
    handleInitialRequests();
  });

  describe('Topics operations', () => {
    beforeEach(() => {
      // Handle any initial requests made by the service
      handleInitialRequests();
    });

    it('should create a new topic', () => {
      const categoryId = service.categories[0].id;
      const title = 'Test Topic';
      const content = 'Test Content';

      const mockTopicDto = {
        id: 101,
        title: title,
        content: content,
        userId: 1,
        username: mockUser.name,
        createdAt: '2023-05-10T15:00:00Z',
        updatedAt: '2023-05-10T15:00:00Z',
        active: true
      };

      let result: any = null;
      service.createTopic(title, content, categoryId).subscribe(res => {
        result = res;
      });

      // Verify the HTTP request
      const req = httpMock.expectOne(`${API_URL}/topics`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title,
        content,
        userId: parseInt(mockUser.id),
        username: mockUser.name,
        active: true
      });
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');

      // Respond with mock data
      req.flush(mockTopicDto);

      // Verify the result
      expect(result).toBeTruthy();
      expect(result.id).toBe('101');
      expect(result.title).toBe(title);
      expect(result.content).toBe(content);
      expect(result.categoryId).toBe(categoryId);
      expect(result.authorId).toBe('1');
      expect(result.authorName).toBe(mockUser.name);

      // Verify toastr was called
      expect(toastrService.success).toHaveBeenCalled();

      // Verify category topic count is updated
      const category = service.getCategory(categoryId);
      expect(category?.topicsCount).toBe(1);
    });

    it('should handle topic creation failure', () => {
      const categoryId = service.categories[0].id;
      
      let result: any = {};
      service.createTopic('Title', 'Content', categoryId).subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics`);
      req.error(new ErrorEvent('error', { message: 'Error creating topic' }));

      expect(result).toBeNull();
      expect(toastrService.error).toHaveBeenCalled();
    });

    it('should load all topics', () => {
      // Clear existing requests first
      httpMock.match(`${API_URL}/topics`);

      // Force a direct call to loadAllTopics
      service.loadAllTopics();

      const mockTopicsDto = [
        {
          id: 101,
          title: 'Topic 1',
          content: 'Content 1',
          userId: 1,
          username: mockUser.name,
          createdAt: '2023-05-10T15:00:00Z',
          updatedAt: '2023-05-10T15:00:00Z',
          active: true
        },
        {
          id: 102,
          title: 'Topic 2',
          content: 'Content 2',
          userId: 2,
          username: 'Another User',
          createdAt: '2023-05-11T15:00:00Z',
          updatedAt: '2023-05-11T15:00:00Z',
          active: true
        }
      ];

      // Get the latest request after we called loadAllTopics
      const req = httpMock.expectOne(`${API_URL}/topics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopicsDto);

      expect(service.allTopics.length).toBe(2);
      expect(service.allTopics[0].title).toBe('Topic 1');
      expect(service.allTopics[1].title).toBe('Topic 2');
    });

    it('should get topics by category', () => {
      // Setup data first
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Topic 1',
          content: 'Content 1',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        },
        {
          id: '102',
          title: 'Topic 2',
          content: 'Content 2',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        },
        {
          id: '103',
          title: 'Topic 3',
          content: 'Content 3',
          categoryId: '2',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        }
      ]);

      const topics = service.getTopicsByCategory('1');

      expect(topics.length).toBe(2);
      expect(topics[0].categoryId).toBe('1');
      expect(topics[1].categoryId).toBe('1');
    });

    it('should not include banned topics in category topics', () => {
      // Setup data with a banned topic
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Normal Topic',
          content: 'Content 1',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        },
        {
          id: '102',
          title: 'Banned Topic',
          content: 'Content 2',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0,
          isBanned: true
        }
      ]);

      const topics = service.getTopicsByCategory('1');

      expect(topics.length).toBe(1);
      expect(topics[0].title).toBe('Normal Topic');
    });

    it('should get a specific topic', () => {
      const mockTopicDto = {
        id: 101,
        title: 'Topic Detail',
        content: 'Detailed content',
        userId: 1,
        username: mockUser.name,
        createdAt: '2023-05-10T15:00:00Z',
        updatedAt: '2023-05-10T15:00:00Z',
        active: true
      };

      let result: any = null;
      service.getTopic('101').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/101`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopicDto);

      expect(result).toBeTruthy();
      expect(result.id).toBe('101');
      expect(result.title).toBe('Topic Detail');
    });

    it('should handle errors when getting a topic', () => {
      let result: any = {};
      service.getTopic('999').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/999`);
      req.error(new ErrorEvent('error', { message: 'Topic not found' }));

      expect(result).toBeUndefined();
    });

    it('should ban a topic', () => {
      // Setup initial data
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Test Topic',
          content: 'Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        }
      ]);

      let result = false;
      service.banTopic('101').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/101/ban`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush({});

      expect(result).toBeTrue();
      expect(service.allTopics[0].isBanned).toBeTrue();
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should handle ban topic failure', () => {
      let result = true;
      service.banTopic('999').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/999/ban`);
      req.error(new ErrorEvent('error', { message: 'Error banning topic' }));

      expect(result).toBeFalse();
      expect(toastrService.error).toHaveBeenCalled();
    });

    it('should unban a topic locally (since API doesnt support it)', () => {
      // Setup initial data with a banned topic
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Banned Topic',
          content: 'Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0,
          isBanned: true
        }
      ]);

      let result = false;
      service.unbanTopic('101').subscribe(res => {
        result = res;
      });

      // No HTTP request expected as this is handled locally
      httpMock.expectNone(`${API_URL}/topics/101/unban`);

      expect(result).toBeTrue();
      expect(service.allTopics[0].isBanned).toBeFalse();
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should delete a topic', () => {
      // Setup initial data
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Topic to Delete',
          content: 'Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        }
      ]);

      let result = false;
      service.deleteTopic('101').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/101`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush({});

      expect(result).toBeTrue();
      expect(service.allTopics.length).toBe(0);
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should update a topic', () => {
      // Setup initial data
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Original Title',
          content: 'Original Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        }
      ]);
      
      const mockUpdatedTopicDto = {
        id: 101,
        title: 'Updated Title',
        content: 'Updated Content',
        userId: 1,
        username: mockUser.name,
        createdAt: '2023-05-10T15:00:00Z',
        updatedAt: '2023-05-11T15:00:00Z',
        active: true
      };

      let result: any = null;
      service.updateTopic('101', 'Updated Title', 'Updated Content', '2').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics/101`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      expect(req.request.body).toEqual({
        title: 'Updated Title',
        content: 'Updated Content',
        userId: 1,
        username: mockUser.name,
        active: true
      });
      req.flush(mockUpdatedTopicDto);

      expect(result).toBeTruthy();
      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated Content');
      expect(result.categoryId).toBe('2'); // Category changed
      
      // Verify topics in state are updated
      expect(service.allTopics[0].title).toBe('Updated Title');
      expect(service.allTopics[0].categoryId).toBe('2');
    });
  });

  describe('Comments operations', () => {
    beforeEach(() => {
      // Handle any initial requests made by the service
      handleInitialRequests();
    });
    it('should get comments by topic', () => {
      const mockCommentsDto = [
        {
          id: 201,
          content: 'Comment 1',
          topicId: 101,
          userId: 1,
          username: mockUser.name,
          createdAt: '2023-05-10T15:00:00Z',
          updatedAt: '2023-05-10T15:00:00Z',
          active: true
        },
        {
          id: 202,
          content: 'Comment 2',
          topicId: 101,
          userId: 2,
          username: 'Another User',
          createdAt: '2023-05-11T15:00:00Z',
          updatedAt: '2023-05-11T15:00:00Z',
          active: true
        }
      ];

      let result: any[] = [];
      service.getCommentsByTopic('101').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments/topic/101`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCommentsDto);

      expect(result.length).toBe(2);
      expect(result[0].content).toBe('Comment 1');
      expect(result[1].content).toBe('Comment 2');
      expect(result[0].topicId).toBe('101');
      expect(result[0].authorName).toBe(mockUser.name);
    });

    it('should not include inactive comments', () => {
      const mockCommentsDto = [
        {
          id: 201,
          content: 'Active Comment',
          topicId: 101,
          userId: 1,
          username: mockUser.name,
          createdAt: '2023-05-10T15:00:00Z',
          updatedAt: '2023-05-10T15:00:00Z',
          active: true
        },
        {
          id: 202,
          content: 'Inactive Comment',
          topicId: 101,
          userId: 2,
          username: 'Another User',
          createdAt: '2023-05-11T15:00:00Z',
          updatedAt: '2023-05-11T15:00:00Z',
          active: false
        }
      ];

      let result: any[] = [];
      service.getCommentsByTopic('101').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments/topic/101`);
      req.flush(mockCommentsDto);

      expect(result.length).toBe(1);
      expect(result[0].content).toBe('Active Comment');
    });

    it('should handle error when getting comments', () => {
      let result: any[] = [{ dummy: 'data' }];
      service.getCommentsByTopic('999').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments/topic/999`);
      req.error(new ErrorEvent('error', { message: 'Error getting comments' }));

      expect(result.length).toBe(0);
    });

    it('should create a new comment', () => {
      // Setup topic first
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Test Topic',
          content: 'Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 0
        }
      ]);
      
      const mockCommentDto = {
        id: 201,
        content: 'New Comment',
        topicId: 101,
        userId: 1,
        username: mockUser.name,
        createdAt: '2023-05-10T15:00:00Z',
        updatedAt: '2023-05-10T15:00:00Z',
        active: true
      };

      let result: any = null;
      service.createComment('101', 'New Comment').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      expect(req.request.body).toEqual({
        content: 'New Comment',
        topicId: 101,
        userId: 1,
        username: mockUser.name,
        active: true
      });
      req.flush(mockCommentDto);

      expect(result).toBeTruthy();
      expect(result.id).toBe('201');
      expect(result.content).toBe('New Comment');
      expect(result.topicId).toBe('101');
      expect(result.authorId).toBe('1');
      expect(result.authorName).toBe(mockUser.name);
      
      // Verify comment is added to state
      expect(service['commentsSignal']().length).toBe(1);
      
      // Verify topic comment count is updated
      expect(service.allTopics[0].commentsCount).toBe(1);
      
      // Verify toastr was called
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should handle comment creation failure', () => {
      let result: any = {};
      service.createComment('101', 'Comment').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments`);
      req.error(new ErrorEvent('error', { message: 'Error creating comment' }));

      expect(result).toBeNull();
      expect(toastrService.error).toHaveBeenCalled();
    });

    it('should delete a comment', () => {
      // Setup initial comments
      service['commentsSignal'].set([
        {
          id: '201',
          content: 'Comment to Delete',
          topicId: '101',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          isReported: false
        }
      ]);
      
      // Setup topic
      service['topicsSignal'].set([
        {
          id: '101',
          title: 'Test Topic',
          content: 'Content',
          categoryId: '1',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          commentsCount: 1
        }
      ]);

      let result = false;
      service.deleteComment('201').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments/201`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush({});

      expect(result).toBeTrue();
      expect(service['commentsSignal']().length).toBe(0);
      expect(service.allTopics[0].commentsCount).toBe(0);
      expect(toastrService.success).toHaveBeenCalled();
    });

    it('should report a comment', () => {
      // Setup initial comment
      service['commentsSignal'].set([
        {
          id: '201',
          content: 'Inappropriate Comment',
          topicId: '101',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          isReported: false
        }
      ]);

      let result = false;
      service.reportComment('201').subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/comments/201/ban`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush({});

      expect(result).toBeTrue();
      expect(service['commentsSignal']()[0].isReported).toBeTrue();
    });

    it('should unreport a comment locally (since API doesnt support it)', () => {
      // Setup initial comment as reported
      service['commentsSignal'].set([
        {
          id: '201',
          content: 'Reported Comment',
          topicId: '101',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          isReported: true
        }
      ]);

      let result = false;
      service.unreportComment('201').subscribe(res => {
        result = res;
      });

      // No HTTP request expected as this is handled locally
      httpMock.expectNone(`${API_URL}/comments/201/unban`);

      expect(result).toBeTrue();
      expect(service['commentsSignal']()[0].isReported).toBeFalse();
    });
  });

  describe('Admin functions', () => {
    beforeEach(() => {
      // Handle any initial requests made by the service
      handleInitialRequests();
    });
    it('should get all topics for admin', () => {
      const mockTopicsDto = [
        {
          id: 101,
          title: 'Topic 1',
          content: 'Content 1',
          userId: 1,
          username: mockUser.name,
          createdAt: '2023-05-10T15:00:00Z',
          updatedAt: '2023-05-10T15:00:00Z',
          active: true
        },
        {
          id: 102,
          title: 'Topic 2',
          content: 'Content 2',
          userId: 2,
          username: 'Another User',
          createdAt: '2023-05-11T15:00:00Z',
          updatedAt: '2023-05-11T15:00:00Z',
          active: false
        }
      ];

      let result: any[] = [];
      service.getAllTopicsForAdmin().subscribe(res => {
        result = res;
      });

      const req = httpMock.expectOne(`${API_URL}/topics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopicsDto);

      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Topic 1');
      expect(result[1].title).toBe('Topic 2');
      
      // Verify inactive topic is marked as banned
      expect(result[0].isBanned).toBeFalse();
      expect(result[1].isBanned).toBeTrue();
    });

    it('should get all comments for admin (from local state)', () => {
      // Setup some comments in state
      service['commentsSignal'].set([
        {
          id: '201',
          content: 'Comment 1',
          topicId: '101',
          authorId: '1',
          authorName: mockUser.name,
          createdAt: new Date(),
          isReported: false
        },
        {
          id: '202',
          content: 'Comment 2',
          topicId: '102',
          authorId: '2',
          authorName: 'Another User',
          createdAt: new Date(),
          isReported: true
        }
      ]);

      let result: any[] = [];
      service.getAllCommentsForAdmin().subscribe(res => {
        result = res;
      });

      // No HTTP request expected as this is handled locally
      httpMock.expectNone(`${API_URL}/comments`);

      expect(result.length).toBe(2);
      expect(result[0].content).toBe('Comment 1');
      expect(result[1].content).toBe('Comment 2');
      expect(result[1].isReported).toBeTrue();
    });
  });
});