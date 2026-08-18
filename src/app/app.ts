import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <h1>Hello, {{ title() }}</h1>
    <div class="bg-sky-500/10">
      <h1 class="text-3xl font-bold underline bg-sky-500/10">Hello00 world!</h1>
    </div>
    
  

    <router-outlet />
  `,
  styles: [],
})
export class App {
  protected readonly title = signal('zebron');
}
