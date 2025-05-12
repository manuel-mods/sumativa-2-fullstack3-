import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';
import { ForumService } from '../../../../core/services/forum.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/models/category.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let forumService: jasmine.SpyObj<ForumService>;
  let router: jasmine.SpyObj<Router>;
  
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Technology',
      description: 'Tech topics',
      iconClass: 'fa-laptop',
      topicsCount: 5
    },
    {
      id: 'cat2',
      name: 'Sports',
      description: 'Sports topics',
      iconClass: 'fa-football',
      topicsCount: 3
    }
  ];

  beforeEach(async () => {
    // Create spies
    forumService = jasmine.createSpyObj('ForumService', ['getCategory'], {
      categories: mockCategories
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        CommonModule,
        RouterLink
      ],
      providers: [
        { provide: ForumService, useValue: forumService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories from forum service', () => {
    expect(component.categories).toEqual(mockCategories);
    expect(component.categories.length).toBe(2);
  });

  it('should navigate to category when navigateToCategory is called', () => {
    component.navigateToCategory('cat1');
    
    expect(router.navigate).toHaveBeenCalledWith(['/category', 'cat1']);
  });

  it('should display categories in the template', () => {
    const categoryElements = fixture.debugElement.queryAll(By.css('.category-card'));
    
    expect(categoryElements.length).toBe(2);
    
    const firstCategoryName = categoryElements[0].query(By.css('.category-title')).nativeElement.textContent;
    const secondCategoryName = categoryElements[1].query(By.css('.category-title')).nativeElement.textContent;
    
    expect(firstCategoryName).toContain('Technology');
    expect(secondCategoryName).toContain('Sports');
  });

  it('should display topic counts for each category', () => {
    const topicCountElements = fixture.debugElement.queryAll(By.css('.topic-count'));
    
    expect(topicCountElements.length).toBe(2);
    expect(topicCountElements[0].nativeElement.textContent).toContain('5');
    expect(topicCountElements[1].nativeElement.textContent).toContain('3');
  });
});