import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Comment } from '../../../../core/models/comment.model';
import { Topic } from '../../../../core/models/topic.model';

@Component({
  selector: 'app-manage-comments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-comments.component.html',
  styleUrl: './manage-comments.component.scss'
})
export class ManageCommentsComponent implements OnInit {
  comments: Comment[] = [];
  topics: { [key: string]: Topic } = {};
  showReportedOnly = false;
  
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
    
    // Load comments and topics
    this.loadComments();
    
    // Create a lookup object for topics
    this.forumService.getAllTopicsForAdmin().forEach(topic => {
      this.topics[topic.id] = topic;
    });
  }
  
  loadComments(): void {
    const allComments = this.forumService.getAllCommentsForAdmin();
    this.comments = this.showReportedOnly 
      ? allComments.filter(comment => comment.isReported)
      : allComments;
  }
  
  toggleReportedFilter(): void {
    this.showReportedOnly = !this.showReportedOnly;
    this.loadComments();
  }
  
  getTopic(topicId: string): string {
    return this.topics[topicId]?.title || 'Unknown Topic';
  }
  
  deleteComment(commentId: string): void {
    console.log('Deleting comment:', commentId);
    this.forumService.deleteComment(commentId);
    this.loadComments();
  }
  
  toggleReportComment(comment: Comment): void {
    console.log(`${comment.isReported ? 'Unreporting' : 'Reporting'} comment:`, comment.id);
    
    if (comment.isReported) {
      this.forumService.unreportComment(comment.id);
    } else {
      this.forumService.reportComment(comment.id);
    }
    
    this.loadComments();
  }
  
  viewTopic(topicId: string): void {
    this.router.navigate(['/topic', topicId]);
  }
}
