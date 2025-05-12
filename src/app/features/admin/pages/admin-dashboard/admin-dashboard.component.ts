import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';

interface ActivityItem {
  id: string;
  title: string;
  type: 'topic' | 'comment';
  authorName: string;
  date: Date;
  status?: {
    isBanned?: boolean;
    isReported?: boolean;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  categoriesCount = 0;
  topicsCount = 0;
  bannedTopicsCount = 0;
  commentsCount = 0;
  reportedCommentsCount = 0;
  usersCount = 2; // Mock value for demo
  isLoading = false;
  recentActivity: ActivityItem[] = [];

  constructor(
    private forumService: ForumService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.verifyAdminAccess();
    this.loadData();
  }

  verifyAdminAccess(): void {
    // Check if user is admin
    if (!this.authService.isAdmin) {
      this.router.navigate(['/']);
      return;
    }
  }

  loadData(): void {
    this.isLoading = true;

    // Get categories count
    this.categoriesCount = this.forumService.categories.length;

    // Load topics data
    this.forumService
      .getAllTopicsForAdmin()
      .pipe(
        catchError((err) => {
          this.toastr.error('Error cargando temas', 'Error');
          console.error('Error loading topics:', err);
          return of([]);
        })
      )
      .subscribe((allTopics) => {
        this.topicsCount = allTopics.length;
        this.bannedTopicsCount = allTopics.filter((t) => t.isBanned).length;
        this.processTopicsForActivity(allTopics);
      });

    // Load comments data
    this.forumService
      .getAllCommentsForAdmin()
      .pipe(
        catchError((err) => {
          this.toastr.error('Error cargando comentarios', 'Error');
          console.error('Error loading comments:', err);
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((allComments) => {
        this.commentsCount = allComments.length;
        this.reportedCommentsCount = allComments.filter(
          (c) => c.isReported
        ).length;
        this.processCommentsForActivity(allComments);
      });
  }

  refreshData(): void {
    this.recentActivity = [];
    this.loadData();
  }

  private processTopicsForActivity(topics: Topic[]): void {
    const topicActivities: ActivityItem[] = topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      type: 'topic' as const,
      authorName: topic.authorName,
      date: topic.createdAt,
      status: {
        isBanned: topic.isBanned,
      },
    }));

    this.updateRecentActivity(topicActivities);
  }

  private processCommentsForActivity(comments: Comment[]): void {
    const commentActivities: ActivityItem[] = comments.map((comment) => ({
      id: comment.id,
      title: `Comment on Topic ${comment.topicId}`,
      type: 'comment' as const,
      authorName: comment.authorName,
      date: comment.createdAt,
      status: {
        isReported: comment.isReported,
      },
    }));

    this.updateRecentActivity(commentActivities);
  }

  private updateRecentActivity(newItems: ActivityItem[]): void {
    this.recentActivity = [...this.recentActivity, ...newItems]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10); // Limit to most recent 10 items
  }

  navigateToManageTopics(): void {
    this.router.navigate(['/admin/topics']);
  }

  navigateToManageComments(): void {
    this.router.navigate(['/admin/comments']);
  }

  viewTopic(topicId: string): void {
    this.router.navigate(['/topic', topicId]);
  }
}
