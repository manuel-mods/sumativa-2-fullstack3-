import { Injectable, signal } from '@angular/core';
import { Category } from '../models/category.model';
import { Topic } from '../models/topic.model';
import { Comment } from '../models/comment.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private readonly CATEGORIES_KEY = 'forum_categories';
  private readonly TOPICS_KEY = 'forum_topics';
  private readonly COMMENTS_KEY = 'forum_comments';

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

  constructor(private authService: AuthService) {
    this.loadFromStorage();

    // Initialize with mock data if no data in storage
    if (this.categoriesSignal().length === 0) {
      this.categoriesSignal.set(this.mockCategories);
      this.saveCategoriesToStorage();
    }
  }

  // Categories
  get categories() {
    return this.categoriesSignal();
  }

  getCategory(id: string): Category | undefined {
    return this.categoriesSignal().find((c) => c.id === id);
  }

  // Topics
  get allTopics() {
    return this.topicsSignal();
  }

  getTopicsByCategory(categoryId: string): Topic[] {
    return this.topicsSignal().filter(
      (t) => t.categoryId === categoryId && !t.isBanned
    );
  }

  getTopic(id: string): Topic | undefined {
    return this.topicsSignal().find((t) => t.id === id);
  }

  createTopic(
    title: string,
    content: string,
    categoryId: string
  ): Topic | null {
    const user = this.authService.currentUser;
    if (!user) return null;

    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title,
      content,
      categoryId,
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date(),
      commentsCount: 0,
    };

    const updatedTopics = [...this.topicsSignal(), newTopic];
    this.topicsSignal.set(updatedTopics);

    // Update category topic count
    this.updateCategoryTopicCount(categoryId);

    this.saveTopicsToStorage();
    return newTopic;
  }

  banTopic(topicId: string): void {
    const topics = this.topicsSignal();
    const updatedTopics = topics.map((topic) =>
      topic.id === topicId ? { ...topic, isBanned: true } : topic
    );

    this.topicsSignal.set(updatedTopics);
    this.saveTopicsToStorage();
  }

  unbanTopic(topicId: string): void {
    const topics = this.topicsSignal();
    const updatedTopics = topics.map((topic) =>
      topic.id === topicId ? { ...topic, isBanned: false } : topic
    );

    this.topicsSignal.set(updatedTopics);
    this.saveTopicsToStorage();
  }

  deleteTopic(topicId: string): void {
    const topics = this.topicsSignal();
    const topicToDelete = topics.find((t) => t.id === topicId);

    if (!topicToDelete) return;

    const updatedTopics = topics.filter((topic) => topic.id !== topicId);
    this.topicsSignal.set(updatedTopics);

    // Update category topic count
    this.updateCategoryTopicCount(topicToDelete.categoryId);

    // Also delete associated comments
    const comments = this.commentsSignal();
    const updatedComments = comments.filter(
      (comment) => comment.topicId !== topicId
    );
    this.commentsSignal.set(updatedComments);

    this.saveTopicsToStorage();
    this.saveCommentsToStorage();
  }

  // Comments
  getCommentsByTopic(topicId: string): Comment[] {
    return this.commentsSignal()
      .filter((c) => c.topicId === topicId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  createComment(topicId: string, content: string): Comment | null {
    const user = this.authService.currentUser;
    if (!user) return null;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      topicId,
      content,
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date(),
    };

    const updatedComments = [...this.commentsSignal(), newComment];
    this.commentsSignal.set(updatedComments);

    // Update topic comment count
    this.updateTopicCommentCount(topicId);

    this.saveCommentsToStorage();
    return newComment;
  }

  deleteComment(commentId: string): void {
    const comments = this.commentsSignal();
    const commentToDelete = comments.find((c) => c.id === commentId);

    if (!commentToDelete) return;

    const updatedComments = comments.filter(
      (comment) => comment.id !== commentId
    );
    this.commentsSignal.set(updatedComments);

    // Update topic comment count
    this.updateTopicCommentCount(commentToDelete.topicId);

    this.saveCommentsToStorage();
  }

  reportComment(commentId: string): void {
    const comments = this.commentsSignal();
    const updatedComments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, isReported: true } : comment
    );

    this.commentsSignal.set(updatedComments);
    this.saveCommentsToStorage();
  }

  unreportComment(commentId: string): void {
    const comments = this.commentsSignal();
    const updatedComments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, isReported: false } : comment
    );

    this.commentsSignal.set(updatedComments);
    this.saveCommentsToStorage();
  }

  // Admin functions
  getAllTopicsForAdmin(): Topic[] {
    return this.topicsSignal();
  }

  getAllCommentsForAdmin(): Comment[] {
    return this.commentsSignal();
  }

  // Private helper methods
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
    this.saveCategoriesToStorage();
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
    this.saveTopicsToStorage();
  }

  // Storage helpers
  private saveCategoriesToStorage(): void {
    localStorage.setItem(
      this.CATEGORIES_KEY,
      JSON.stringify(this.categoriesSignal())
    );
  }

  private saveTopicsToStorage(): void {
    localStorage.setItem(this.TOPICS_KEY, JSON.stringify(this.topicsSignal()));
  }

  private saveCommentsToStorage(): void {
    localStorage.setItem(
      this.COMMENTS_KEY,
      JSON.stringify(this.commentsSignal())
    );
  }

  private loadFromStorage(): void {
    // Load categories

    const storedCategories = localStorage.getItem(this.CATEGORIES_KEY);

    if (storedCategories) {
      try {
        this.categoriesSignal.set(JSON.parse(storedCategories));
      } catch (error) {
        console.error('Failed to parse stored categories', error);
      }
    }

    // Load topics
    const storedTopics = localStorage.getItem(this.TOPICS_KEY);
    if (storedTopics) {
      try {
        const topics = JSON.parse(storedTopics);
        // Convert string dates back to Date objects
        topics.forEach((topic: Topic) => {
          topic.createdAt = new Date(topic.createdAt);
        });
        this.topicsSignal.set(topics);
      } catch (error) {
        console.error('Failed to parse stored topics', error);
      }
    }

    // Load comments
    const storedComments = localStorage.getItem(this.COMMENTS_KEY);
    if (storedComments) {
      try {
        const comments = JSON.parse(storedComments);
        // Convert string dates back to Date objects
        comments.forEach((comment: Comment) => {
          comment.createdAt = new Date(comment.createdAt);
        });
        this.commentsSignal.set(comments);
      } catch (error) {
        console.error('Failed to parse stored comments', error);
      }
    }
  }
}
