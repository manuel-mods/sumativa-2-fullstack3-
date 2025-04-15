import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../core/services/forum.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  categories: Category[] = [];
  
  constructor(
    private forumService: ForumService,
    private router: Router
  ) {
    this.categories = this.forumService.categories;
  }
  
  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/category', categoryId]);
  }
}
