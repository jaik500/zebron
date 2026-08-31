import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "./core/components/footer/footer.components";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  template: `
   <div class="flex min-h-screen flex-col">

      <main class="flex-1">
        <router-outlet />
      </main>

      <app-footer />

    </div>
  `,
  styles: [],
})
export class App {}