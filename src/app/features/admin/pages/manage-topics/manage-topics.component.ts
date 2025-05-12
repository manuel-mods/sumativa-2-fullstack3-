import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../../core/services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Topic } from '../../../../core/models/topic.model';
import { Category } from '../../../../core/models/category.model';
// Note: Make sure to include Bootstrap icons in your Angular project
// Either by importing in styles.scss or by installing bootstrap-icons package

@Component({
  selector: 'app-manage-topics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './manage-topics.component.html',
  styleUrl: './manage-topics.component.scss',
})
export class ManageTopicsComponent implements OnInit {
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];
  categories: { [key: string]: Category } = {};
  searchTerm: string = '';
  statusFilter: string = 'all';
  categoryFilter: string = 'all';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  selectedTopic: Topic | null = null;
  showDeleteConfirmation: boolean = false;
  showEditModal: boolean = false;

  // Edit form fields
  editTopicTitle: string = '';
  editTopicContent: string = '';
  editTopicCategory: string = '';
  isSubmitting: boolean = false;

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
    this.loadData();
  }

  loadData(): void {
    this.forumService.getAllTopicsForAdmin().subscribe((topics) => {
      this.topics = topics;
      this.applyFilters();
    });

    // Create a lookup object for categories
    this.forumService.categories.forEach((category) => {
      this.categories[category.id] = category;
    });

    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredTopics = this.topics.filter((topic) => {
      // Apply search filter
      const matchesSearch =
        this.searchTerm === '' ||
        topic.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        topic.authorName
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        this.getCategory(topic.categoryId)
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'banned' && topic.isBanned) ||
        (this.statusFilter === 'active' && !topic.isBanned);

      // Apply category filter
      const matchesCategory =
        this.categoryFilter === 'all' ||
        topic.categoryId === this.categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  getCategory(categoryId: string): string {
    return this.categories[categoryId]?.name || 'Unknown Category';
  }

  getCategoryList(): Category[] {
    return Object.values(this.categories);
  }

  confirmDelete(topic: Topic): void {
    this.selectedTopic = topic;
    this.showDeleteConfirmation = true;
  }

  cancelDelete(): void {
    this.selectedTopic = null;
    this.showDeleteConfirmation = false;
  }

  deleteTopic(topicId: string): void {
    console.log('Deleting topic:', topicId);
    this.forumService.deleteTopic(topicId).subscribe((success) => {
      if (success) {
        this.showDeleteConfirmation = false;
        this.selectedTopic = null;
        this.loadData();
      } else {
        // Handle error case
        console.error('Failed to delete topic');
        // Could display an error message to the user here
      }
    });
  }

  toggleBanTopic(topic: Topic): void {
    console.log(`${topic.isBanned ? 'Unbanning' : 'Banning'} topic:`, topic.id);

    if (topic.isBanned) {
      this.forumService.unbanTopic(topic.id);
    } else {
      this.forumService.banTopic(topic.id);
    }

    this.loadData();
  }

  viewTopic(topicId: string): void {
    this.router.navigate(['/topic', topicId]);
  }

  openEditModal(topic: Topic): void {
    this.selectedTopic = topic;
    this.editTopicTitle = topic.title;
    this.editTopicContent = topic.content;
    this.editTopicCategory = topic.categoryId;
    this.showEditModal = true;
  }

  cancelEdit(): void {
    this.showEditModal = false;
    this.selectedTopic = null;
    this.resetEditForm();
  }

  resetEditForm(): void {
    this.editTopicTitle = '';
    this.editTopicContent = '';
    this.editTopicCategory = '';
    this.isSubmitting = false;
  }

  saveTopic(): void {
    if (
      !this.selectedTopic ||
      !this.editTopicTitle.trim() ||
      !this.editTopicContent.trim()
    ) {
      return;
    }

    this.isSubmitting = true;

    this.forumService
      .updateTopic(
        this.selectedTopic.id,
        this.editTopicTitle.trim(),
        this.editTopicContent.trim(),
        this.editTopicCategory
      )
      .subscribe((updatedTopic) => {
        this.isSubmitting = false;

        if (updatedTopic) {
          this.showEditModal = false;
          this.selectedTopic = null;
          this.resetEditForm();
          this.loadData();
        } else {
          // Handle error case
          console.error('Failed to update topic');
          // Could display an error message to the user here
        }
      });
  }

  get paginatedTopics(): Topic[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTopics.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTopics.length / this.itemsPerPage);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Make Math available to the template
  get Math() {
    return Math;
  }
}
