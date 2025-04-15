import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-manage-topics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-topics.component.html',
  styleUrl: './manage-topics.component.scss'
})
export class ManageTopicsComponent implements OnInit {
  topics: Topic[] = [];
  categories: { [key: string]: Category } = {};
  
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
    
    // Load topics and categories
    this.topics = this.forumService.getAllTopicsForAdmin();
    
    // Create a lookup object for categories
    this.forumService.categories.forEach(category => {
      this.categories[category.id] = category;
    });
  }
  
  getCategory(categoryId: string): string {
    return this.categories[categoryId]?.name || 'Unknown Category';
  }
  
  deleteTopic(topicId: string): void {
    console.log('Deleting topic:', topicId);
    this.forumService.deleteTopic(topicId);
    this.topics = this.forumService.getAllTopicsForAdmin();
  }
  
  toggleBanTopic(topic: Topic): void {
    console.log(`${topic.isBanned ? 'Unbanning' : 'Banning'} topic:`, topic.id);
    
    if (topic.isBanned) {
      this.forumService.unbanTopic(topic.id);
    } else {
      this.forumService.banTopic(topic.id);
    }
    
    this.topics = this.forumService.getAllTopicsForAdmin();
  }
  
  viewTopic(topicId: string): void {
    this.router.navigate(['/topic', topicId]);
  }
}
