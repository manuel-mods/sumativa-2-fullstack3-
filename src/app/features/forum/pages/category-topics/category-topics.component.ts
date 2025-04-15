import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { Category } from '../../../../core/models/category.model';
import { Topic } from '../../../../core/models/topic.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-category-topics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-topics.component.html',
  styleUrl: './category-topics.component.scss'
})
export class CategoryTopicsComponent implements OnInit {
  category: Category | undefined;
  topics: Topic[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    public authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const categoryId = params['id'];
      this.category = this.forumService.getCategory(categoryId);
      
      if (!this.category) {
        this.router.navigate(['/']);
        return;
      }
      
      this.topics = this.forumService.getTopicsByCategory(categoryId);
    });
  }
  
  navigateToTopicDetail(topicId: string): void {
    this.router.navigate(['/topic', topicId]);
  }
  
  createNewTopic(): void {
    if (this.category) {
      this.router.navigate(['/create-topic'], { 
        queryParams: { categoryId: this.category.id } 
      });
    }
  }
}
