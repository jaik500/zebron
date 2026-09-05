import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-collapsible-record',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <section
      cdkDrag
      [cdkDragData]="dragData"
      class="
        business-dashboard-drag-card
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
      "
    >

      <!-- ============================================================
           RECORD HEADER
           ============================================================ -->
      <div
        class="
          flex
          items-center
          justify-between
          gap-2
          border-b
          border-gray-100
          px-3
          py-2
        "
      >

        <!-- ==========================================================
             LEFT SIDE
             Drag Handle + Title / Subtitle / Header Metadata
             ========================================================== -->
        <div
          class="
            flex
            min-w-0
            flex-1
            items-center
            gap-1.5
          "
        >

          <!-- ========================================================
               DRAG AND DROP HANDLE

               Only this small button starts the CDK drag operation.
               The parent component supplies cdkDrag and cdkDropList.
               ======================================================== -->
          @if (showDragHandle) {
            <button
              mat-icon-button
              type="button"
              class="
                record-drag-handle
                shrink-0
                text-gray-400
                hover:bg-gray-100
                hover:text-[#007979]
              "
              cdkDragHandle
              matTooltip="Drag to reorder"
              aria-label="Drag to reorder"
              (click)="$event.stopPropagation()"
            >
              <mat-icon class="record-drag-icon">
                drag_indicator
              </mat-icon>
            </button>
          }

          <!-- ========================================================
               TITLE AREA

               Clicking the title toggles the record open/closed.
               Keyboard Enter and Space provide the same behavior.
               ======================================================== -->
          <div class="min-w-0 flex-1">

            <div
              class="
                flex
                min-w-0
                flex-wrap
                items-center
                gap-x-1.5
                gap-y-1
              "
            >

              <h3
                class="
                  min-w-0
                  truncate
                  cursor-pointer
                  text-base
                  font-semibold
                  text-[#032D42]
                  hover:text-[#007979]
                "
                role="button"
                tabindex="0"
                [attr.aria-expanded]="expanded"
                (click)="toggle($event)"
                (keydown.enter)="toggle($event)"
                (keydown.space)="toggle($event)"
              >
                {{ title }}
              </h3>

              <!--
                Status buttons, badges, or other metadata can be
                projected here from the parent component.
              -->
              <!-- <ng-content
                select="[record-header-meta]"
              ></ng-content> -->

            </div>

            @if (subtitle) {
              <p
                class="
                  mt-0.5
                  truncate
                  text-xs
                  text-gray-500
                "
              >
                {{ subtitle }}
              </p>
            }

          </div>

        </div>


        <!-- ==========================================================
             RIGHT SIDE
             More Actions + Expand / Collapse
             ========================================================== -->
        <div
          class="
            flex
            shrink-0
            items-center
            gap-0.5
          "
        >

          <!-- ========================================================
               MORE ACTIONS

               Edit and Delete are intentionally kept inside the
               three-dot menu to keep the record header compact.
               ======================================================== -->
          @if (edit.observers.length > 0 || remove.observers.length > 0) {
            <button
              mat-icon-button
              type="button"
              class="
                record-icon-button
                text-gray-500
                hover:bg-gray-100
                hover:text-[#007979]
              "
              [matMenuTriggerFor]="recordActionsMenu"
              matTooltip="More actions"
              aria-label="More actions"
              (click)="$event.stopPropagation()"
            >
              <mat-icon class="record-icon">
                more_vert
              </mat-icon>
            </button>

            <mat-menu #recordActionsMenu="matMenu">

              <!-- Edit -->
              @if (edit.observers.length > 0) {
                <button
                  mat-menu-item
                  type="button"
                  (click)="onEdit($event)"
                >
                  <mat-icon>
                    edit
                  </mat-icon>

                  <span>
                    {{ editTooltip }}
                  </span>
                </button>
              }

              <!-- Delete -->
              @if (remove.observers.length > 0) {
                <button
                  mat-menu-item
                  type="button"
                  (click)="onRemove($event)"
                >
                  <mat-icon>
                    delete
                  </mat-icon>

                  <span>
                    {{ deleteTooltip }}
                  </span>
                </button>
              }

            </mat-menu>
          }


          <!-- ========================================================
               EXPAND / COLLAPSE
               ======================================================== -->
          <button
            mat-icon-button
            type="button"
            class="
              record-icon-button
              text-gray-500
              hover:bg-gray-100
              hover:text-[#007979]
            "
            matTooltip="Expand / collapse"
            aria-label="Expand or collapse record"
            [attr.aria-expanded]="expanded"
            (click)="toggle($event)"
          >
            <mat-icon class="record-icon">
              {{ expanded ? 'expand_less' : 'expand_more' }}
            </mat-icon>
          </button>

        </div>

      </div>


      <!-- ============================================================
           RECORD BODY

           Existing Activity / Compliance content is projected here.
           ============================================================ -->
      @if (expanded) {
        <div
          class="
            px-4
            pb-5
            pt-4
          "
        >
          <ng-content></ng-content>
        </div>
      }

    </section>
  `,

  styles: [`

    /* ================================================================
       CDK DRAG & DROP
       ================================================================ */

    /*
     * The reusable record owns cdkDrag. This keeps the drag handle,
     * draggable element, preview, placeholder, and animation in the
     * same Angular component and avoids parent/child drag-boundary
     * issues.
     */
    .business-dashboard-drag-card {
      position: relative;
      width: 100%;
      cursor: default;
    }

    /*
     * Do not add a transform transition to the normal draggable
     * element. Angular CDK controls its transform while dragging.
     */
    .business-dashboard-drag-card.cdk-drag {
      transition: none;
    }

    /*
     * The preview follows the pointer immediately.
     */
    .business-dashboard-drag-card.cdk-drag-preview {
      opacity: 0.95;
      transition: none;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
    }

    /*
     * Leave a visible placeholder while the record is being moved.
     */
    .business-dashboard-drag-card.cdk-drag-placeholder {
      opacity: 0.25;
      transition: opacity 120ms ease;
    }

    /*
     * Animate neighboring records as the dragged record moves
     * through the list.
     */
    .cdk-drop-list-dragging
      .business-dashboard-drag-card:not(.cdk-drag-placeholder) {
      transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
    }

    /*
     * Smoothly settle the record into its final position after drop.
     */
    .business-dashboard-drag-card.cdk-drag-animating {
      transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
    }


    /* ================================================================
       COMPACT HEADER ACTION BUTTONS
       ================================================================ */

    /*
     * Compact Material icon buttons for:
     * - More actions
     * - Expand / collapse
     */
    .record-icon-button {
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;

      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .record-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      line-height: 16px;
    }


    /* ================================================================
       COMPACT DRAG HANDLE
       ================================================================ */

    /*
     * The drag handle is intentionally smaller than the action
     * buttons because it is a utility control.
     */
    .record-drag-handle {
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      padding: 0;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      cursor: grab;
    }

    .record-drag-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
      line-height: 14px;
    }

    [cdkDragHandle]:active {
      cursor: grabbing;
    }


    /* ================================================================
       COMPACT STATUS / HEADER METADATA
       ================================================================ */

    /*
     * Status controls projected through [record-header-meta]
     * remain compact so they do not overpower the record title.
     */
    :host ::ng-deep [record-header-meta] {
      display: inline-flex;
      align-items: center;
    }

    :host ::ng-deep [record-header-meta] button {
      min-height: 22px;
      height: 22px;
      padding: 0 7px;
      font-size: 11px;
      line-height: 22px;
      border-radius: 9999px;
    }

    :host ::ng-deep [record-header-meta] mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
      line-height: 14px;
    }


    /* ================================================================
       FLEX BEHAVIOR
       ================================================================ */

    .shrink-0 {
      flex-shrink: 0;
    }

  `],
})
export class CollapsibleRecord {

  /**
   * Main record title.
   */
  @Input() title = '';

  /**
   * Optional secondary text displayed beneath the title.
   */
  @Input() subtitle = '';

  /**
   * Whether the record body is currently expanded.
   *
   * Records start collapsed by default.
   */
  @Input() expanded = false;

  /**
   * Displays the CDK drag-and-drop handle in the record header.
   *
   * This component owns cdkDrag. The parent only needs to provide
   * the cdkDropList container.
   */
  @Input() showDragHandle = false;

  /**
   * Optional data attached to the CDK drag operation.
   *
   * Parent components can use this to associate the draggable
   * record with the underlying Activity or Compliance object.
   */
  @Input() dragData: unknown = null;

  /**
 * Highlights this record while another record is being
 * dragged over it.
 *
 * The Business Operations dashboard controls this value.
 */
@Input() dropTargetActive = false;

  /**
   * Tooltip for the edit action.
   */
  @Input() editTooltip = 'Edit';

  /**
   * Tooltip for the delete action.
   */
  @Input() deleteTooltip = 'Delete';

  /**
   * Emitted when the user requests editing.
   */
  @Output() edit = new EventEmitter<void>();

  /**
   * Emitted when the user requests deletion.
   */
  @Output() remove = new EventEmitter<void>();

  /**
   * Emitted whenever the expanded state changes.
   */
  @Output() expandedChange = new EventEmitter<boolean>();


  /**
   * Toggle the record body.
   *
   * This is called by:
   * - The record title
   * - The expand/collapse button
   * - Keyboard Enter
   * - Keyboard Space
   */
  toggle(event?: Event): void {
    event?.stopPropagation();

    this.expanded = !this.expanded;

    this.expandedChange.emit(this.expanded);
  }


  /**
   * Handle the Edit action from the three-dot menu.
   */
  onEdit(event: Event): void {
    event.stopPropagation();

    this.edit.emit();
  }


  /**
   * Handle the Delete action from the three-dot menu.
   */
  onRemove(event: Event): void {
    event.stopPropagation();

    this.remove.emit();
  }
}
