import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-create-topic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-topic.component.html',
  styleUrl: './create-topic.component.scss'
})
export class CreateTopicComponent implements OnInit {
  topicForm: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;
  
  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.topicForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      categoryId: ['', Validators.required]
    });
    
    this.categories = this.forumService.categories;
  }
  
  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Pre-select category if provided in query params
    this.route.queryParams.subscribe(params => {
      const categoryId = params['categoryId'];
      if (categoryId) {
        this.topicForm.patchValue({ categoryId });
      }
    });
  }
  
  onSubmit(): void {
    if (this.topicForm.invalid || this.isSubmitting) {
      this.topicForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    const { title, content, categoryId } = this.topicForm.value;
    
    const newTopic = this.forumService.createTopic(title, content, categoryId);
    
    if (newTopic) {
      // Show success message or redirect to the new topic
      this.router.navigate(['/topic', newTopic.id]);
    } else {
      // Handle error
      this.isSubmitting = false;
    }
  }
}
