import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ChangePasswordRequest, 
  UpdateProfileRequest,
  JwtPayload 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuthState(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user && this.isTokenValid(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Login user with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => {
          // Backend returns { token, user, expiresAt } on success or { errorMessage } on error
          if (response.token && response.user) {
            this.setAuthData(response.user, response.token);
            return {
              success: true,
              user: response.user,
              token: response.token,
              expiresAt: response.expiresAt
            };
          } else {
            return {
              success: false,
              errorMessage: response.errorMessage || 'Login failed'
            };
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          // Don't auto-login after registration - let user login manually
          // This ensures proper workflow and user verification
          if (response.token && response.user && !response.errorMessage) {
            // Registration successful but don't store auth data yet
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Call logout endpoint if available
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Get current user info from server
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, profileData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Validate JWT token
   */
  validateToken(): Observable<boolean> {
    const token = this.getStoredToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    return this.http.post<{ valid: boolean }>(`${this.API_URL}/validate`, {})
      .pipe(
        map(response => response.valid),
        catchError(() => {
          this.clearAuthData();
          return throwError(() => new Error('Token validation failed'));
        })
      );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.roleName?.toLowerCase() === role.toLowerCase();
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Get authorization headers with JWT token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get stored JWT token
   */
  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Legacy method for compatibility - alias for getStoredToken
   */
  getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Legacy method for compatibility - check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = this.getStoredToken();
    return token ? this.isTokenValid(token) : false;
  }

  /**
   * Legacy method for compatibility - get current user as signal-like function
   */
  currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get stored user data
   */
  private getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  /**
   * Store authentication data
   */
  private setAuthData(user: User, token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Store user data
   */
  private storeUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Check if JWT token is valid (not expired)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeJwtPayload(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode JWT payload
   */
  private decodeJwtPayload(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    if (error.status === 401) {
      this.clearAuthData();
      this.router.navigate(['/login']);
    }
    
    return throwError(() => error);
  };
}
