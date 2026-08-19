import { Component, inject, signal } from '@angular/core';
import { Resource } from '../../../../core/models/resource.model';
import { ResourceService } from '../../../../core/services/resource.service';
import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [ResourceCardComponent],
  template: `
    <main class="p-8">
      <h1 class="text-3xl font-bold">Resources</h1>

      <p class="mt-2 text-gray-600">Browse available resources.</p>

      @if (loading()) {
        <p class="mt-6">Loading resources...</p>
      }

      @if (error()) {
        <p class="mt-6 text-red-600">
          {{ error() }}
        </p>
      }

      @if (!loading() && !error() && resources().length === 0) {
        <p class="mt-6 text-gray-600">No resources are currently available.</p>
      }

      @if (!loading() && !error() && resources().length > 0) {
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (resource of resources(); track resource.id) {
            <app-resource-card [resource]="resource" />
          }
        </div>
      }
    </main>
  `,
  styles: [],
})
export class ResourceListComponent {
  private readonly resourceService = inject(ResourceService);

  protected readonly resources = signal<Resource[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.loadResources();
  }

  private async loadResources(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const resources = await this.resourceService.getPublishedResources();

      this.resources.set(resources);
    } catch (error) {
      console.error('Failed to load resources:', error);

      this.error.set('Unable to load resources. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }
}
