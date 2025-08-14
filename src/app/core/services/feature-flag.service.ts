import { Injectable, signal } from '@angular/core';

export interface FeatureFlags {
  richTextEditor: boolean;
  advancedFileUpload: boolean;
  enhancedWorkflow: boolean;
  templateSystem: boolean;
  advancedSearch: boolean;
  mobileOptimizations: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  // Feature flags with safe defaults
  private flags = signal<FeatureFlags>({
    richTextEditor: false,          // Disabled - causing focus and UI issues
    advancedFileUpload: true,       // Ready to test
    enhancedWorkflow: false,        // Will enable when ready
    templateSystem: false,          // Will enable when ready
    advancedSearch: false,          // Will enable when ready
    mobileOptimizations: true       // CSS improvements are safe
  });

  // Environment-based overrides
  private environmentFlags: Partial<FeatureFlags> = {
    // Production flags (more conservative)
    ...(this.isProduction() ? {
      richTextEditor: false,        // Keep disabled in production until issues resolved
      advancedFileUpload: false,
      enhancedWorkflow: false,
      templateSystem: false
    } : {}),
    
    // Development flags (more permissive)
    ...(this.isDevelopment() ? {
      richTextEditor: true,
      advancedFileUpload: true,
      enhancedWorkflow: true,
      templateSystem: true,
      advancedSearch: true
    } : {})
  };

  constructor() {
    this.initializeFlags();
  }

  private initializeFlags(): void {
    // Merge default flags with environment-specific flags
    const currentFlags = this.flags();
    const mergedFlags = { ...currentFlags, ...this.environmentFlags };
    this.flags.set(mergedFlags);
    
    // Log enabled features for debugging
    if (this.isDevelopment()) {
      console.log('🚀 Feature Flags Enabled:', this.getEnabledFeatures());
    }
  }

  // Public methods to check feature flags
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags()[feature];
  }

  isRichTextEditorEnabled(): boolean {
    return this.isEnabled('richTextEditor');
  }

  isAdvancedFileUploadEnabled(): boolean {
    return this.isEnabled('advancedFileUpload');
  }

  isEnhancedWorkflowEnabled(): boolean {
    return this.isEnabled('enhancedWorkflow');
  }

  isTemplateSystemEnabled(): boolean {
    return this.isEnabled('templateSystem');
  }

  isAdvancedSearchEnabled(): boolean {
    return this.isEnabled('advancedSearch');
  }

  isMobileOptimizationsEnabled(): boolean {
    return this.isEnabled('mobileOptimizations');
  }

  // Admin methods (for development/testing)
  enableFeature(feature: keyof FeatureFlags): void {
    if (this.isDevelopment()) {
      const currentFlags = this.flags();
      this.flags.set({ ...currentFlags, [feature]: true });
      console.log(`✅ Feature enabled: ${feature}`);
    }
  }

  disableFeature(feature: keyof FeatureFlags): void {
    if (this.isDevelopment()) {
      const currentFlags = this.flags();
      this.flags.set({ ...currentFlags, [feature]: false });
      console.log(`❌ Feature disabled: ${feature}`);
    }
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags() };
  }

  getEnabledFeatures(): string[] {
    const flags = this.flags();
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
  }

  // Environment detection
  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           (window.location.hostname === 'your-production-domain.com' ||
            !window.location.hostname.includes('localhost'));
  }

  private isDevelopment(): boolean {
    return !this.isProduction();
  }

  // For debugging in development
  debugLog(message: string, data?: any): void {
    if (this.isDevelopment()) {
      console.log(`🏃‍♂️ Feature Flag Debug: ${message}`, data);
    }
  }
}
