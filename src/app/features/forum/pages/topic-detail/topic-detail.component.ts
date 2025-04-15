import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Comment } from '../../../../core/models/comment.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './topic-detail.component.html',
  styleUrl: './topic-detail.component.scss'
})
export class TopicDetailComponent implements OnInit {
  topic: Topic | undefined;
  category: Category | undefined;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isSubmitting = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3)]]
    });
  }
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const topicId = params['id'];
      this.topic = this.forumService.getTopic(topicId);
      
      if (!this.topic || this.topic.isBanned) {
        this.router.navigate(['/']);
        return;
      }
      
      this.category = this.forumService.getCategory(this.topic.categoryId);
      this.comments = this.forumService.getCommentsByTopic(topicId);
    });
  }
  
  onCommentSubmit(): void {
    if (this.commentForm.invalid || !this.topic || this.isSubmitting) {
      this.commentForm.markAllAsTouched();
      return;
    }
    
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.isSubmitting = true;
    const { content } = this.commentForm.value;
    
    const newComment = this.forumService.createComment(this.topic.id, content);
    
    if (newComment) {
      this.comments = this.forumService.getCommentsByTopic(this.topic.id);
      this.commentForm.reset();
    }
    
    this.isSubmitting = false;
  }
}
