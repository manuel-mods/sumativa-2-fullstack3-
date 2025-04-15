import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgClass, NgIf],
  template: `
    <nav class="bg-primary text-white p-3 shadow">
      <div class="container d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <a routerLink="/home" class="navbar-brand fs-4 fw-bold text-white text-decoration-none">ForoDuoc</a>
        </div>

        <div class="d-flex align-items-center gap-3" *ngIf="authService.isLoggedIn">
          <a routerLink="/home" class="nav-link text-white text-decoration-none">Inicio</a>
          <a routerLink="/create-topic" class="nav-link text-white text-decoration-none">Nuevo Tema</a>

          <div class="dropdown">
            <button
              class="btn btn-primary dropdown-toggle d-flex align-items-center"
              type="button"
              (click)="toggleDropdown()"
              aria-expanded="false"
            >
              {{ authService.currentUser?.name }}
            </button>

            <ul
              class="dropdown-menu dropdown-menu-end"
              [ngClass]="{'show': dropdownOpen}"
              style="min-width: 10rem;"
            >
              <li>
                <a
                  routerLink="/profile/edit"
                  class="dropdown-item"
                  (click)="closeDropdown()"
                >Perfil</a>
              </li>

              <li *ngIf="authService.isAdmin">
                <a
                  routerLink="/admin"
                  class="dropdown-item"
                  (click)="closeDropdown()"
                >Panel de Administrador</a>
              </li>
              
              <li><hr class="dropdown-divider"></li>
              
              <li>
                <button
                  (click)="logout()"
                  class="dropdown-item text-danger"
                >
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .transition-all {
        transition: all 0.2s ease-in-out;
      }
    `,
  ],
})
export class NavbarComponent {
  dropdownOpen = false;

  constructor(public authService: AuthService, private router: Router) {}

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }
}
