import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuillModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="rich-text-editor-container">
      <!-- Editor Toolbar (Custom) -->
      <div class="editor-toolbar" *ngIf="showToolbar">
        <div class="toolbar-section">
          <span class="toolbar-label">Format:</span>
          <button mat-icon-button 
                  matTooltip="Bold" 
                  (click)="formatText('bold')"
                  [class.active]="isFormatActive('bold')">
            <mat-icon>format_bold</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Italic" 
                  (click)="formatText('italic')"
                  [class.active]="isFormatActive('italic')">
            <mat-icon>format_italic</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Underline" 
                  (click)="formatText('underline')"
                  [class.active]="isFormatActive('underline')">
            <mat-icon>format_underlined</mat-icon>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-section">
          <span class="toolbar-label">Lists:</span>
          <button mat-icon-button 
                  matTooltip="Bullet List" 
                  (click)="formatText('list', 'bullet')">
            <mat-icon>format_list_bulleted</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Numbered List" 
                  (click)="formatText('list', 'ordered')">
            <mat-icon>format_list_numbered</mat-icon>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-section">
          <span class="toolbar-label">Text:</span>
          <button mat-icon-button 
                  matTooltip="Heading 1" 
                  (click)="formatText('header', 1)">
            <mat-icon>title</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Heading 2" 
                  (click)="formatText('header', 2)">
            <mat-icon>format_size</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Quote" 
                  (click)="formatText('blockquote')">
            <mat-icon>format_quote</mat-icon>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-section">
          <span class="toolbar-label">Tools:</span>
          <button mat-icon-button 
                  matTooltip="Clear Format" 
                  (click)="clearFormat()">
            <mat-icon>format_clear</mat-icon>
          </button>
          <button mat-icon-button 
                  matTooltip="Word Count" 
                  (click)="showWordCount = !showWordCount">
            <mat-icon>analytics</mat-icon>
          </button>
        </div>
      </div>

      <!-- Editor Container -->
      <div class="editor-wrapper" [class.error]="hasError">
        <!-- Fallback textarea for graceful degradation -->
        <textarea 
          *ngIf="!quillEnabled" 
          class="fallback-textarea"
          [placeholder]="placeholder"
          [value]="value"
          (input)="onTextareaChange($event)"
          [disabled]="disabled"
          [rows]="minRows">
        </textarea>

        <!-- Quill Editor -->
        <quill-editor 
          *ngIf="quillEnabled"
          [(ngModel)]="value"
          [placeholder]="placeholder"
          [readOnly]="disabled"
          (onContentChanged)="onContentChanged($event)"
          (onSelectionChanged)="onSelectionChanged($event)"
          (onEditorCreated)="onEditorCreated($event)"
          [style.min-height.px]="minHeight">
        </quill-editor>

        <!-- Loading overlay -->
        <div *ngIf="isLoading" class="loading-overlay">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
      </div>

      <!-- Word Count & Status -->
      <div class="editor-footer" *ngIf="showWordCount || hasError">
        <div class="word-count" *ngIf="showWordCount">
          Words: {{ wordCount }} | Characters: {{ characterCount }}
          <span *ngIf="maxLength" [class.warning]="characterCount > maxLength * 0.9">
            / {{ maxLength }}
          </span>
        </div>
        
        <div class="error-message" *ngIf="hasError">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rich-text-editor-container {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      background: white;
    }

    .rich-text-editor-container:focus-within {
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }

    .rich-text-editor-container.error {
      border-color: #f44336;
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      flex-wrap: wrap;
      gap: 8px;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-label {
      font-size: 0.75rem;
      color: #666;
      margin-right: 4px;
      white-space: nowrap;
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: #ddd;
      margin: 0 4px;
    }

    .editor-toolbar button {
      width: 32px;
      height: 32px;
      border-radius: 4px;
    }

    .editor-toolbar button.active {
      background-color: #2196f3;
      color: white;
    }

    .editor-toolbar button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .editor-wrapper {
      position: relative;
      min-height: 120px;
    }

    .fallback-textarea {
      width: 100%;
      border: none;
      outline: none;
      padding: 12px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
      background: transparent;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: flex-start;
      z-index: 10;
    }

    .editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      font-size: 0.75rem;
      color: #666;
    }

    .word-count .warning {
      color: #ff9800;
      font-weight: 500;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f44336;
    }

    .error-message mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Quill Editor Customization */
    :host ::ng-deep .ql-editor {
      padding: 12px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
    }

    :host ::ng-deep .ql-editor.ql-blank::before {
      color: #999;
      font-style: normal;
    }

    :host ::ng-deep .ql-toolbar {
      display: none; /* We use our custom toolbar */
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .editor-toolbar {
        padding: 6px 8px;
      }

      .toolbar-section {
        gap: 2px;
      }

      .toolbar-label {
        display: none;
      }

      .toolbar-divider {
        margin: 0 2px;
      }

      .editor-toolbar button {
        width: 28px;
        height: 28px;
      }
    }

    /* Hide Quill's internal tooltips and dialog inputs */
    :host ::ng-deep .ql-tooltip {
      display: none !important;
    }
    
    :host ::ng-deep .ql-tooltip input {
      display: none !important;
    }
    
    :host ::ng-deep .ql-editing {
      display: none !important;
    }
  `]
})
export class RichTextEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder: string = 'Enter your content here...';
  @Input() showToolbar: boolean = true;
  @Input() minHeight: number = 120;
  @Input() minRows: number = 6;
  @Input() maxLength?: number;
  @Input() disabled: boolean = false;
  @Input() quillEnabled: boolean = true; // Feature flag

  @Output() contentChange = new EventEmitter<string>();
  @Output() wordCountChange = new EventEmitter<number>();

  // Internal state
  value: string = '';
  isLoading: boolean = false;
  showWordCount: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Editor references
  private quillEditor: any;
  private activeFormats: Set<string> = new Set();
  
  // Debouncing and loop prevention
  private destroy$ = new Subject<void>();
  private contentChanged$ = new Subject<string>();
  private isInternalUpdate = false;
  private lastEmittedValue = '';

  // ControlValueAccessor functions
  private onChange = (value: string) => {};
  private onTouched = () => {};

  // Computed properties
  get wordCount(): number {
    return this.value ? this.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  }

  get characterCount(): number {
    return this.value ? this.value.length : 0;
  }

  // Quill configuration
  quillConfig = {
    toolbar: false, // We use custom toolbar
    theme: 'snow',
    modules: {
      toolbar: false,
      history: {
        delay: 1000,
        maxStack: 50,
        userOnly: false
      },
      keyboard: {
        bindings: {
          // Override some default Quill behaviors that might trap focus
          tab: {
            key: 9,
            handler: () => {
              // Allow tab to work normally for accessibility
              return true;
            }
          }
        }
      }
    },
    formats: [
      // Only include formats we actually use in our custom toolbar
      'bold', 'italic', 'underline', 'strike',
      'header', 'blockquote',
      'list', 'bullet', 'indent',
      'color', 'background',
      'align'
    ]
  };

  ngOnInit(): void {
    // Validate quill availability
    if (this.quillEnabled && typeof window !== 'undefined') {
      try {
        // Test if Quill is available
        import('quill').catch(() => {
          console.warn('Quill not available, falling back to textarea');
          this.quillEnabled = false;
        });
      } catch (error) {
        console.warn('Error loading Quill:', error);
        this.quillEnabled = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    const newValue = value || '';
    this.value = newValue;
    this.validateContent();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Editor event handlers
  onContentChanged(event: any): void {
    const newValue = event.html || '';
    
    // Always notify the form to ensure sync
    this.value = newValue;
    this.validateContent();
    this.onChange(newValue);
    this.contentChange.emit(newValue);
    this.wordCountChange.emit(this.wordCount);
    this.onTouched();
  }

  onSelectionChanged(event: any): void {
    if (this.quillEditor) {
      this.updateActiveFormats();
    }
  }

  onEditorCreated(editor: any): void {
    this.quillEditor = editor;
    
    // Add custom keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  onTextareaChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    
    if (newValue !== this.value) {
      this.value = newValue;
      this.validateContent();
      this.onChange(newValue);  // Immediately notify form
      this.contentChange.emit(newValue);
      this.wordCountChange.emit(this.wordCount);
      this.onTouched();
    }
  }

  // Formatting methods
  formatText(format: string, value?: any): void {
    if (!this.quillEditor || this.disabled) return;

    try {
      if (format === 'list') {
        this.quillEditor.format('list', value);
      } else if (format === 'header') {
        this.quillEditor.format('header', value);
      } else {
        const currentFormat = this.quillEditor.getFormat();
        const isActive = currentFormat[format];
        this.quillEditor.format(format, !isActive);
      }
      
      this.updateActiveFormats();
      // Removed automatic focus - let user control focus naturally
    } catch (error) {
      console.error('Error formatting text:', error);
    }
  }

  clearFormat(): void {
    if (!this.quillEditor || this.disabled) return;

    try {
      const selection = this.quillEditor.getSelection();
      if (selection) {
        this.quillEditor.removeFormat(selection.index, selection.length);
      }
      this.updateActiveFormats();
    } catch (error) {
      console.error('Error clearing format:', error);
    }
  }

  isFormatActive(format: string): boolean {
    return this.activeFormats.has(format);
  }

  // Private methods
  private updateActiveFormats(): void {
    if (!this.quillEditor) return;

    try {
      const formats = this.quillEditor.getFormat();
      this.activeFormats.clear();
      
      Object.keys(formats).forEach(format => {
        if (formats[format]) {
          this.activeFormats.add(format);
        }
      });
    } catch (error) {
      console.error('Error updating active formats:', error);
    }
  }

  private setupKeyboardShortcuts(): void {
    if (!this.quillEditor) return;

    // Add custom keyboard shortcuts
    this.quillEditor.keyboard.addBinding({
      key: 'K',
      ctrlKey: true
    }, () => {
      // Custom shortcut for clearing format
      this.clearFormat();
    });
  }

  private validateContent(): void {
    this.hasError = false;
    this.errorMessage = '';

    if (this.maxLength && this.characterCount > this.maxLength) {
      this.hasError = true;
      this.errorMessage = `Content exceeds maximum length of ${this.maxLength} characters`;
    }
  }

  // Public utility methods
  insertText(text: string): void {
    if (!this.quillEditor || this.disabled) {
      // Fallback for textarea
      this.value += text;
      this.onChange(this.value);
      return;
    }

    try {
      const selection = this.quillEditor.getSelection();
      const index = selection ? selection.index : this.quillEditor.getLength();
      this.quillEditor.insertText(index, text);
    } catch (error) {
      console.error('Error inserting text:', error);
    }
  }

  focus(): void {
    if (this.quillEditor) {
      this.quillEditor.focus();
    }
  }

  getPlainText(): string {
    if (this.quillEditor) {
      return this.quillEditor.getText();
    }
    return this.value.replace(/<[^>]*>/g, ''); // Strip HTML tags for fallback
  }
}
