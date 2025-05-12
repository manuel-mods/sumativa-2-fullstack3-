import { Injectable, signal } from '@angular/core';
import { Category } from '../models/category.model';
import { Topic } from '../models/topic.model';
import { Comment } from '../models/comment.model';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface TopicDto {
  id: number;
  title: string;
  content: string;
  userId: number;
  username: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

interface CommentDto {
  id: number;
  content: string;
  topicId: number;
  userId: number;
  username: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  readonly CATEGORIES_KEY = 'forum_categories';
  private readonly API_URL = 'http://localhost:8080/api';

  private categoriesSignal = signal<Category[]>([]);
  private topicsSignal = signal<Topic[]>([]);
  private commentsSignal = signal<Comment[]>([]);

  private mockCategories: Category[] = [
    {
      id: '1',
      name: 'Programación',
      description:
        'Discute lenguajes de programación, frameworks y prácticas de codificación',
      iconClass: 'fas fa-code',
      topicsCount: 0,
    },
    {
      id: '2',
      name: 'Videojuegos',
      description: 'Discusión sobre videojuegos, noticias y recomendaciones',
      iconClass: 'fas fa-gamepad',
      topicsCount: 0,
    },
    {
      id: '3',
      name: 'Tecnología',
      description: 'Últimas noticias de tecnología, gadgets e innovaciones',
      iconClass: 'fas fa-microchip',
      topicsCount: 0,
    },
    {
      id: '4',
      name: 'Películas y TV',
      description:
        'Discute tus programas, películas y contenido en streaming favoritos',
      iconClass: 'fas fa-film',
      topicsCount: 0,
    },
    {
      id: '5',
      name: 'Música',
      description:
        'Comparte tus artistas, álbumes y recomendaciones musicales favoritos',
      iconClass: 'fas fa-music',
      topicsCount: 0,
    },
  ];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.loadCategories();
    this.loadAllTopics();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Categories
  get categories() {
    return this.categoriesSignal();
  }

  loadCategories(): void {
    // Since there's no category endpoint in the API, we'll use mock categories
    this.categoriesSignal.set(this.mockCategories);
    
    // Load topic counts for each category
    this.loadAllTopics();
  }

  getCategory(id: string): Category | undefined {
    return this.categoriesSignal().find((c) => c.id === id);
  }

  // Topics
  get allTopics() {
    return this.topicsSignal();
  }

  loadAllTopics(): void {
    this.http.get<TopicDto[]>(`${this.API_URL}/topics`)
      .subscribe(topicsDto => {
        const topics = topicsDto.map(dto => this.mapTopicFromDto(dto));
        this.topicsSignal.set(topics);
        
        // Update category topic counts
        this.updateCategoryTopicCounts();
      });
  }

  getTopicsByCategory(categoryId: string): Topic[] {
    // Since the API doesn't have categories, we'll filter client-side
    return this.topicsSignal().filter(
      (t) => t.categoryId === categoryId && !t.isBanned
    );
  }

  getTopic(id: string): Observable<Topic | undefined> {
    return this.http.get<TopicDto>(`${this.API_URL}/topics/${id}`)
      .pipe(
        map(dto => this.mapTopicFromDto(dto)),
        catchError(error => {
          console.error('Error fetching topic', error);
          return of(undefined);
        })
      );
  }

  createTopic(
    title: string,
    content: string,
    categoryId: string
  ): Observable<Topic | null> {
    const user = this.authService.currentUser;
    if (!user) return of(null);

    const topicDto = {
      title,
      content,
      userId: parseInt(user.id),
      username: user.name,
      active: true
    };

    const headers = this.getAuthHeaders();

    return this.http.post<TopicDto>(`${this.API_URL}/topics`, topicDto, { headers })
      .pipe(
        map(dto => {
          const newTopic = this.mapTopicFromDto(dto);
          newTopic.categoryId = categoryId; // Add category since API doesn't support it

          const updatedTopics = [...this.topicsSignal(), newTopic];
          this.topicsSignal.set(updatedTopics);

          // Update category topic count
          this.updateCategoryTopicCount(categoryId);

          this.toastr.success('El tema ha sido creado correctamente', 'Tema creado');
          return newTopic;
        }),
        catchError(error => {
          console.error('Error creating topic', error);
          this.toastr.error('Ocurrió un error al crear el tema', 'Error');
          return of(null);
        })
      );
  }

  banTopic(topicId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.put<void>(`${this.API_URL}/topics/${topicId}/ban`, {}, { headers })
      .pipe(
        tap(() => {
          const topics = this.topicsSignal();
          const updatedTopics = topics.map(topic =>
            topic.id === topicId ? { ...topic, isBanned: true } : topic
          );
          this.topicsSignal.set(updatedTopics);

          // Update category counts
          this.updateCategoryTopicCounts();
          this.toastr.success('El tema ha sido bloqueado correctamente', 'Tema bloqueado');
        }),
        map(() => true),
        catchError(error => {
          console.error('Error banning topic', error);
          this.toastr.error('Ocurrió un error al bloquear el tema', 'Error');
          return of(false);
        })
      );
  }

  unbanTopic(topicId: string): Observable<boolean> {
    // This would require an API endpoint to unban a topic
    // For now, we'll just update the local state
    const topics = this.topicsSignal();
    const topicToUpdate = topics.find(t => t.id === topicId);

    if (!topicToUpdate) {
      this.toastr.error('No se encontró el tema', 'Error');
      return of(false);
    }

    const updatedTopics = topics.map(topic =>
      topic.id === topicId ? { ...topic, isBanned: false } : topic
    );

    this.topicsSignal.set(updatedTopics);
    this.updateCategoryTopicCounts();

    this.toastr.success('El tema ha sido desbloqueado correctamente', 'Tema desbloqueado');
    return of(true);
  }

  deleteTopic(topicId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const topics = this.topicsSignal();
    const topicToDelete = topics.find(t => t.id === topicId);

    if (!topicToDelete) {
      this.toastr.error('No se encontró el tema', 'Error');
      return of(false);
    }

    return this.http.delete<void>(`${this.API_URL}/topics/${topicId}`, { headers })
      .pipe(
        tap(() => {
          const updatedTopics = topics.filter(topic => topic.id !== topicId);
          this.topicsSignal.set(updatedTopics);

          // Update category topic count
          this.updateCategoryTopicCount(topicToDelete.categoryId);

          // Also refresh comments as the API will delete associated comments
          this.loadCommentsByTopic(topicId);

          this.toastr.success('El tema ha sido eliminado correctamente', 'Tema eliminado');
        }),
        map(() => true),
        catchError(error => {
          console.error('Error deleting topic', error);
          this.toastr.error('Ocurrió un error al eliminar el tema', 'Error');
          return of(false);
        })
      );
  }

  updateTopic(topicId: string, title: string, content: string, categoryId: string): Observable<Topic | null> {
    const headers = this.getAuthHeaders();
    const topics = this.topicsSignal();
    const topicToUpdate = topics.find(t => t.id === topicId);

    if (!topicToUpdate) {
      return of(null);
    }

    const topicDto = {
      title,
      content,
      userId: parseInt(topicToUpdate.authorId),
      username: topicToUpdate.authorName,
      active: !topicToUpdate.isBanned
    };

    return this.http.put<TopicDto>(`${this.API_URL}/topics/${topicId}`, topicDto, { headers })
      .pipe(
        map(dto => {
          const updatedTopic = this.mapTopicFromDto(dto);
          updatedTopic.categoryId = categoryId; // Add category since API doesn't support it

          // Update local state
          const updatedTopics = topics.map(topic =>
            topic.id === topicId ? updatedTopic : topic
          );
          this.topicsSignal.set(updatedTopics);

          // If category changed, update category topic counts
          if (topicToUpdate.categoryId !== categoryId) {
            this.updateCategoryTopicCount(topicToUpdate.categoryId);
            this.updateCategoryTopicCount(categoryId);
          }

          return updatedTopic;
        }),
        catchError(error => {
          console.error('Error updating topic', error);
          return of(null);
        })
      );
  }

  // Comments
  getCommentsByTopic(topicId: string): Observable<Comment[]> {
    return this.http.get<CommentDto[]>(`${this.API_URL}/comments/topic/${topicId}`)
      .pipe(
        map(commentsDto => {
          const comments = commentsDto
            .filter(dto => dto.active)
            .map(dto => this.mapCommentFromDto(dto, topicId))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          
          // Update local cache
          this.updateCommentsForTopic(topicId, comments);
          
          return comments;
        }),
        catchError(error => {
          console.error('Error fetching comments', error);
          return of([]);
        })
      );
  }

  loadCommentsByTopic(topicId: string): void {
    this.getCommentsByTopic(topicId).subscribe();
  }

  private updateCommentsForTopic(topicId: string, newComments: Comment[]): void {
    // Replace comments for this topic while keeping comments for other topics
    const otherComments = this.commentsSignal().filter(c => c.topicId !== topicId);
    this.commentsSignal.set([...otherComments, ...newComments]);
    
    // Update topic comment count
    this.updateTopicCommentCount(topicId);
  }

  createComment(topicId: string, content: string): Observable<Comment | null> {
    const user = this.authService.currentUser;
    if (!user) return of(null);

    const commentDto = {
      content,
      topicId: parseInt(topicId),
      userId: parseInt(user.id),
      username: user.name,
      active: true
    };

    const headers = this.getAuthHeaders();

    return this.http.post<CommentDto>(`${this.API_URL}/comments`, commentDto, { headers })
      .pipe(
        map(dto => {
          const newComment = this.mapCommentFromDto(dto, topicId);

          const updatedComments = [...this.commentsSignal(), newComment];
          this.commentsSignal.set(updatedComments);

          // Update topic comment count
          this.updateTopicCommentCount(topicId);

          this.toastr.success('Tu comentario ha sido añadido', 'Comentario creado');
          return newComment;
        }),
        catchError(error => {
          console.error('Error creating comment', error);
          this.toastr.error('No se pudo crear el comentario', 'Error');
          return of(null);
        })
      );
  }

  deleteComment(commentId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const comments = this.commentsSignal();
    const commentToDelete = comments.find(c => c.id === commentId);

    if (!commentToDelete) {
      this.toastr.error('No se encontró el comentario', 'Error');
      return of(false);
    }

    return this.http.delete<void>(`${this.API_URL}/comments/${commentId}`, { headers })
      .pipe(
        tap(() => {
          const updatedComments = comments.filter(comment => comment.id !== commentId);
          this.commentsSignal.set(updatedComments);

          // Update topic comment count
          this.updateTopicCommentCount(commentToDelete.topicId);

          this.toastr.success('El comentario ha sido eliminado', 'Comentario eliminado');
        }),
        map(() => true),
        catchError(error => {
          console.error('Error deleting comment', error);
          this.toastr.error('No se pudo eliminar el comentario', 'Error');
          return of(false);
        })
      );
  }

  reportComment(commentId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<void>(`${this.API_URL}/comments/${commentId}/ban`, {}, { headers })
      .pipe(
        tap(() => {
          const comments = this.commentsSignal();
          const updatedComments = comments.map(comment => 
            comment.id === commentId ? { ...comment, isReported: true } : comment
          );
          this.commentsSignal.set(updatedComments);
        }),
        map(() => true),
        catchError(error => {
          console.error('Error reporting comment', error);
          return of(false);
        })
      );
  }

  unreportComment(commentId: string): Observable<boolean> {
    // This would require an API endpoint to unban a comment
    // For now, we'll just update the local state
    const comments = this.commentsSignal();
    const updatedComments = comments.map(comment =>
      comment.id === commentId ? { ...comment, isReported: false } : comment
    );
    
    this.commentsSignal.set(updatedComments);
    return of(true);
  }

  // Admin functions
  getAllTopicsForAdmin(): Observable<Topic[]> {
    return this.http.get<TopicDto[]>(`${this.API_URL}/topics`)
      .pipe(
        map(topicsDto => {
          const topics = topicsDto.map(dto => this.mapTopicFromDto(dto));
          this.topicsSignal.set(topics);
          return topics;
        }),
        catchError(error => {
          console.error('Error fetching topics for admin', error);
          return of([]);
        })
      );
  }

  getAllCommentsForAdmin(): Observable<Comment[]> {
    // There's no endpoint to get all comments, so we'll get them by user for all users
    // In a real app, there would be an admin endpoint for this
    return of(this.commentsSignal());
  }

  // Private helper methods
  private updateCategoryTopicCounts(): void {
    const categories = this.categoriesSignal();
    const topics = this.topicsSignal();
    
    const updatedCategories = categories.map(category => {
      const count = topics.filter(
        t => t.categoryId === category.id && !t.isBanned
      ).length;
      
      return { ...category, topicsCount: count };
    });
    
    this.categoriesSignal.set(updatedCategories);
  }

  private updateCategoryTopicCount(categoryId: string): void {
    const topics = this.topicsSignal().filter(
      (t) => t.categoryId === categoryId && !t.isBanned
    );
    const categories = this.categoriesSignal();

    const updatedCategories = categories.map((category) =>
      category.id === categoryId
        ? { ...category, topicsCount: topics.length }
        : category
    );

    this.categoriesSignal.set(updatedCategories);
  }

  private updateTopicCommentCount(topicId: string): void {
    const comments = this.commentsSignal().filter((c) => c.topicId === topicId);
    const topics = this.topicsSignal();

    const updatedTopics = topics.map((topic) =>
      topic.id === topicId
        ? { ...topic, commentsCount: comments.length }
        : topic
    );

    this.topicsSignal.set(updatedTopics);
  }

  // Mapper methods
  private mapTopicFromDto(dto: TopicDto): Topic {
    return {
      id: dto.id.toString(),
      title: dto.title,
      content: dto.content,
      categoryId: '1', // Default category since API doesn't support categories
      authorId: dto.userId.toString(),
      authorName: dto.username,
      createdAt: new Date(dto.createdAt),
      commentsCount: 0, // This will be updated when comments are loaded
      isBanned: !dto.active
    };
  }

  private mapCommentFromDto(dto: CommentDto, topicId: string): Comment {
    return {
      id: dto.id.toString(),
      topicId: topicId,
      content: dto.content,
      authorId: dto.userId.toString(),
      authorName: dto.username,
      createdAt: new Date(dto.createdAt),
      isReported: !dto.active
    };
  }
}