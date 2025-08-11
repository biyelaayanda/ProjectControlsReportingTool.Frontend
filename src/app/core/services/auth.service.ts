import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponseDto, 
  UserDto, 
  ChangePasswordDto, 
  UpdateProfileDto 
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/user`;
  private readonly tokenKey = 'projectcontrols_token';
  private readonly userKey = 'projectcontrols_user';

  // Reactive signals for modern Angular
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for reactive UI
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<UserDto | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * User Registration
   */
  register(registerDto: RegisterDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/register`, registerDto)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(this.handleError)
      );
  }

  /**
   * User Login
   */
  login(loginDto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, loginDto)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(this.handleError)
      );
  }

  /**
   * User Logout
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<UserDto> {
    const userId = this.getCurrentUserId();
    return this.http.get<UserDto>(`${this.apiUrl}/${userId}`)
      .pipe(
        tap(user => {
          this.currentUser.set(user);
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update user profile
   */
  updateProfile(updateDto: UpdateProfileDto): Observable<UserDto> {
    const userId = this.getCurrentUserId();
    return this.http.put<UserDto>(`${this.apiUrl}/${userId}`, updateDto)
      .pipe(
        tap(user => {
          this.currentUser.set(user);
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Change password
   */
  changePassword(changePasswordDto: ChangePasswordDto): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.post(`${this.apiUrl}/${userId}/change-password`, changePasswordDto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all users (admin/manager function)
   */
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get users by department
   */
  getUsersByDepartment(department: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/department/${department}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    const user = this.currentUser();
    if (!user) throw new Error('No current user found');
    return user.id;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: number): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }

  /**
   * Check if current user is in specific department
   */
  isInDepartment(department: number): boolean {
    const user = this.currentUser();
    return user ? user.department === department : false;
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponseDto): void {
    localStorage.setItem(this.tokenKey, response.token);
    this.saveUserToStorage(response.user);
    this.currentUserSubject.next(response.user);
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
  }

  /**
   * Load user from localStorage on app start
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.userKey);
    
    if (token && userJson && this.isLoggedIn()) {
      try {
        const user: UserDto = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
        this.currentUser.set(user);
      } catch {
        this.logout();
      }
    }
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage(user: UserDto): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid credentials';
        this.logout();
      } else if (error.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else {
        errorMessage = `Server error: ${error.status}`;
      }
    }
    
    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
