import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { CommunityPost } from '../../models/community-post.model';
import { COMMUNITY_REPORT_REASONS, CommunityReportReason } from '../../services/community-moderation.service';

export type CommunityPostDialogMode = 'edit' | 'report' | 'delete' | 'hide' | 'remove';

export interface CommunityPostDialogData {
  mode: CommunityPostDialogMode;
  post: CommunityPost;
}

export type CommunityPostDialogResult =
  | { mode: 'edit'; title: string; content: string; tags: string[] }
  | { mode: 'report'; reason: CommunityReportReason; details: string }
  | { mode: 'delete' }
  | { mode: 'hide' | 'remove'; reason: string };

/**
 * One small dialog for post actions: edit (author), delete (author),
 * report (anyone), hide or remove (moderators).
 */
@Component({
  selector: 'app-community-post-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ heading }}</h2>

    <mat-dialog-content class="!pt-2">
      @switch (data.mode) {
        @case ('edit') {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Title</mat-label>
            <input matInput maxlength="200" required [ngModel]="title()" (ngModelChange)="title.set($event)" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Post</mat-label>
            <textarea matInput rows="8" maxlength="10000" required [ngModel]="content()" (ngModelChange)="content.set($event)"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Tags</mat-label>
            <input matInput [ngModel]="tags()" (ngModelChange)="tags.set($event)" />
            <mat-hint>Separate with commas</mat-hint>
          </mat-form-field>
        }
        @case ('report') {
          <p class="mb-3 text-sm text-gray-600">
            Tell the moderators what is wrong with “{{ data.post.title }}”. Only they see your report.
          </p>
          <mat-radio-group class="flex flex-col gap-1" [ngModel]="reason()" (ngModelChange)="reason.set($event)">
            @for (option of reasons; track option.value) {
              <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
            }
          </mat-radio-group>
          <mat-form-field appearance="outline" class="mt-3 w-full">
            <mat-label>Details (optional)</mat-label>
            <textarea matInput rows="3" maxlength="1000" [ngModel]="details()" (ngModelChange)="details.set($event)"></textarea>
          </mat-form-field>
        }
        @case ('delete') {
          <p class="text-sm text-gray-700">Delete “{{ data.post.title }}”? It disappears from the Community. This cannot be undone.</p>
        }
        @default {
          <p class="mb-3 text-sm text-gray-700">
            @if (data.mode === 'hide') {
              Hide “{{ data.post.title }}” from the Community. You can restore it later from Moderation.
            } @else {
              Remove “{{ data.post.title }}” permanently from the Community.
            }
          </p>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Reason (kept with the moderation record)</mat-label>
            <input matInput maxlength="500" [ngModel]="details()" (ngModelChange)="details.set($event)" />
          </mat-form-field>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        type="button"
        [style.background-color]="data.mode === 'delete' || data.mode === 'remove' ? '#b91c1c' : null"
        [style.color]="data.mode === 'delete' || data.mode === 'remove' ? '#fff' : null"
        [disabled]="!valid()"
        (click)="confirm()"
      >
        {{ action }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CommunityPostDialogComponent {
  protected readonly data = inject<CommunityPostDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CommunityPostDialogComponent, CommunityPostDialogResult>);

  protected readonly reasons = COMMUNITY_REPORT_REASONS;

  protected readonly title = signal(this.data.post.title ?? '');
  protected readonly content = signal(this.data.post.content ?? '');
  protected readonly tags = signal((this.data.post.tags ?? []).map((tag) => tag.replace(/^#/, '')).join(', '));
  protected readonly reason = signal<CommunityReportReason>('spam');
  protected readonly details = signal('');

  protected readonly heading = {
    edit: 'Edit post',
    report: 'Report post',
    delete: 'Delete post',
    hide: 'Hide post',
    remove: 'Remove post',
  }[this.data.mode];

  protected readonly action = {
    edit: 'Save',
    report: 'Send report',
    delete: 'Delete',
    hide: 'Hide',
    remove: 'Remove',
  }[this.data.mode];

  protected valid(): boolean {
    if (this.data.mode === 'edit') {
      return this.title().trim().length > 0 && this.content().trim().length > 0;
    }
    return true;
  }

  protected confirm(): void {
    switch (this.data.mode) {
      case 'edit':
        this.dialogRef.close({
          mode: 'edit',
          title: this.title(),
          content: this.content(),
          tags: this.tags().split(',').map((tag) => tag.trim()).filter(Boolean),
        });
        return;
      case 'report':
        this.dialogRef.close({ mode: 'report', reason: this.reason(), details: this.details() });
        return;
      case 'delete':
        this.dialogRef.close({ mode: 'delete' });
        return;
      default:
        this.dialogRef.close({ mode: this.data.mode as 'hide' | 'remove', reason: this.details() });
    }
  }
}
