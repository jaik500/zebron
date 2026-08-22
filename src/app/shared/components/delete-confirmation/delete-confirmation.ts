import {
  Component,
  Inject,
  Optional,
} from '@angular/core';

import {
  HotToastRef,
} from '@ngxpert/hot-toast';


export interface DeleteConfirmationData {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}


@Component({
  selector: 'app-delete-confirmation',
  standalone: true,

  template: `
    <div
      class="w-full"
    >

      <!-- Confirmation heading -->
      <h3
        class="text-base font-semibold text-gray-900"
      >
        {{ toastRef.data.title }}
      </h3>


      <!-- Confirmation message -->
      <p
        class="mt-2 text-sm leading-5 text-gray-600"
      >
        {{ toastRef.data.message }}
      </p>


      <!-- Actions -->
      <div
        class="mt-5 flex justify-end gap-2"
      >

        <!-- Cancel -->
        <button
          type="button"
          (click)="cancel()"
          [disabled]="deleting"
          class="rounded-md border border-gray-300
                 bg-white px-3 py-1.5
                 text-xs font-medium
                 text-gray-700
                 transition
                 hover:bg-gray-50
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
        >
          Cancel
        </button>


        <!-- Delete -->
        <button
          type="button"
          (click)="confirm()"
          [disabled]="deleting"
          class="rounded-md bg-red-600
                 px-3 py-1.5
                 text-xs font-medium
                 text-white
                 transition
                 hover:bg-red-700
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
        >
          {{
            deleting
              ? 'Deleting...'
              : 'Delete'
          }}
        </button>

      </div>

    </div>
  `,
})
export class DeleteConfirmationComponent {

  protected deleting = false;


  constructor(
    @Optional()
    @Inject(HotToastRef)
    public readonly toastRef:
      HotToastRef<DeleteConfirmationData>,
  ) {}


  /**
   * Cancel the delete operation.
   */
  protected cancel(): void {

    if (this.deleting) {
      return;
    }

    this.toastRef.close();
  }


  /**
   * Confirm the delete operation.
   */
  protected async confirm(): Promise<void> {

    if (this.deleting) {
      return;
    }

    this.deleting = true;

    try {

      await this.toastRef.data.onConfirm();

      // The toast is closed after the delete
      // operation finishes successfully.
      this.toastRef.close();

    } catch (error) {

      console.error(
        'Delete confirmation action failed:',
        error,
      );

      // Allow the administrator to try again.
      this.deleting = false;
    }
  }
}