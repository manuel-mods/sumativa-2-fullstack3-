import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  categoriesCount = 0;
  topicsCount = 0;
  bannedTopicsCount = 0;
  commentsCount = 0;
  reportedCommentsCount = 0;
  usersCount = 2; // Mock value for demo
  
  constructor(
    private forumService: ForumService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin) {
      this.router.navigate(['/']);
      return;
    }
    
    // Get counts
    this.categoriesCount = this.forumService.categories.length;
    
    const allTopics = this.forumService.getAllTopicsForAdmin();
    this.topicsCount = allTopics.length;
    this.bannedTopicsCount = allTopics.filter(t => t.isBanned).length;
    
    const allComments = this.forumService.getAllCommentsForAdmin();
    this.commentsCount = allComments.length;
    this.reportedCommentsCount = allComments.filter(c => c.isReported).length;
  }
  
  navigateToManageTopics(): void {
    this.router.navigate(['/admin/topics']);
  }
  
  navigateToManageComments(): void {
    this.router.navigate(['/admin/comments']);
  }
}
