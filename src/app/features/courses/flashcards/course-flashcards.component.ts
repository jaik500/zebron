import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { Course, courseContextFromRoute, progressId } from '../course.model';
import { CourseService } from '../course.service';

import { BOX_COUNT, buildDeck, CardState, Flashcard, FlashcardService, isDue, nextState } from './flashcard.service';

type Scope = 'studied' | 'all';

/** Cards per session, so a review stays short. */
const SESSION_SIZE = 20;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/**
 * Course flashcards (/courses/:courseId/flashcards, and the organization
 * equivalent): review the course's Quick Check questions as cards, with
 * spaced repetition (see flashcard.service.ts).
 * Keys: Space or Enter shows the answer; 1 = Again, 2 = Got it.
 */
@Component({
  selector: 'app-course-flashcards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: course()?.title ?? 'Course', link: coursePath(), translate: !course() },
          { label: 'Flashcards' }
        ]"
      />

      <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        @if (loading()) {
          <div class="h-72 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (error()) {
          <div class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</div>
        } @else if (!deck().length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">style</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">{{ 'This course has no flashcards yet.' | t }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ 'Cards are made from the Quick Check questions in its lessons.' | t }}</p>
            <a [routerLink]="coursePath()" class="mt-4 inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Back to the course' | t }}</a>
          </div>
        } @else {
          <!-- Summary and scope -->
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="flex flex-1 items-center gap-2 text-xl font-bold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">style</mat-icon>
              {{ 'Flashcards' | t }}
            </h1>
            @if (hasStudied()) {
              <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm" role="group" [attr.aria-label]="'Which cards' | t">
                <button type="button" (click)="setScope('studied')" class="rounded-md px-3 py-1.5 font-medium" [class]="scope() === 'studied' ? 'bg-[#007979] text-white' : 'text-slate-600 hover:bg-slate-50'" [attr.aria-pressed]="scope() === 'studied'">{{ 'Lessons I finished' | t }}</button>
                <button type="button" (click)="setScope('all')" class="rounded-md px-3 py-1.5 font-medium" [class]="scope() === 'all' ? 'bg-[#007979] text-white' : 'text-slate-600 hover:bg-slate-50'" [attr.aria-pressed]="scope() === 'all'">{{ 'Whole course' | t }}</button>
              </div>
            }
          </div>
          <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-xl bg-white p-3 shadow-sm"><dt class="text-xs text-slate-500">{{ 'Due now' | t }}</dt><dd class="text-xl font-bold text-slate-900">{{ dueCount() }}</dd></div>
            <div class="rounded-xl bg-white p-3 shadow-sm"><dt class="text-xs text-slate-500">{{ 'Learning' | t }}</dt><dd class="text-xl font-bold text-amber-700">{{ learningCount() }}</dd></div>
            <div class="rounded-xl bg-white p-3 shadow-sm"><dt class="text-xs text-slate-500">{{ 'Known' | t }}</dt><dd class="text-xl font-bold text-emerald-700">{{ knownCount() }} / {{ deck().length }}</dd></div>
          </dl>

          @if (current(); as card) {
            <!-- The card -->
            <p class="mt-5 text-sm text-slate-500" aria-live="polite">{{ 'Card {0} of {1}' | t: [position(), sessionTotal()] }}</p>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div class="h-full rounded-full bg-[#007979] transition-all" [style.width.%]="(position() - 1) / sessionTotal() * 100"></div>
            </div>

            <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.lessonTitle }}</p>
              <h2 class="mt-2 text-lg font-semibold leading-snug text-slate-900">{{ card.question }}</h2>

              @if (flipped()) {
                <div class="mt-5 border-t border-slate-100 pt-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">{{ 'Answer' | t }}</p>
                  <p class="mt-1 font-semibold text-slate-900">{{ card.answer }}</p>
                  @if (card.explanation) {
                    <p class="mt-2 text-sm text-slate-600">{{ card.explanation }}</p>
                  }
                  <a [routerLink]="[coursePath(), 'lessons', card.lessonId]" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#007979] hover:underline">
                    {{ 'Open the lesson' | t }}<mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
                  </a>
                </div>
              } @else {
                <p class="mt-5 text-sm text-slate-500">{{ 'Answer in your head, then check.' | t }}</p>
              }
            </section>

            <div class="mt-4 flex flex-wrap gap-2">
              @if (!flipped()) {
                <button type="button" (click)="flip()" class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]">
                  <mat-icon aria-hidden="true">visibility</mat-icon>{{ 'Show answer' | t }}
                </button>
              } @else {
                <button type="button" (click)="answer(false)" [disabled]="saving()" class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60">
                  <mat-icon aria-hidden="true">replay</mat-icon>{{ 'Again' | t }}
                </button>
                <button type="button" (click)="answer(true)" [disabled]="saving()" class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  <mat-icon aria-hidden="true">check</mat-icon>{{ 'Got it' | t }}
                </button>
              }
            </div>
            <p class="mt-2 hidden text-center text-xs text-slate-400 sm:block">{{ 'Keys: Space shows the answer, 1 = Again, 2 = Got it' | t }}</p>
          } @else {
            <!-- Session done, or nothing due -->
            <section class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <mat-icon class="!h-10 !w-10 !text-[40px] text-emerald-600" aria-hidden="true">task_alt</mat-icon>
              <p class="mt-2 font-semibold text-emerald-900">
                {{ (reviewed() ? 'Session done: {0} cards reviewed.' : 'Nothing is due right now.') | t: [reviewed()] }}
              </p>
              @if (nextDue(); as next) {
                <p class="mt-1 text-sm text-emerald-800">{{ 'Next cards are due {0}.' | t: [next] }}</p>
              }
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                @if (dueCount()) {
                  <button type="button" (click)="start()" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Review due cards' | t }}</button>
                }
                <button type="button" (click)="start(true)" class="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-[#007979]">{{ 'Practice anyway' | t }}</button>
                <a [routerLink]="coursePath()" class="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-white">{{ 'Back to the course' | t }}</a>
              </div>
            </section>
          }
        }
      </div>
    </main>
  `,
})
export class CourseFlashcardsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly courses = inject(CourseService);
  private readonly flashcards = inject(FlashcardService);
  private readonly notify = inject(NotificationService);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly courseId = this.route.snapshot.paramMap.get('courseId') ?? '';

  protected readonly course = signal<Course | null>(null);
  private readonly allCards = signal<Flashcard[]>([]);
  private readonly finishedLessons = signal<Set<string>>(new Set());
  private readonly states = signal<Record<string, CardState>>({});
  protected readonly scope = signal<Scope>('all');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  private readonly queue = signal<Flashcard[]>([]);
  protected readonly flipped = signal(false);
  protected readonly reviewed = signal(0);
  protected readonly sessionTotal = signal(0);
  /** Cards already shown "Again" this session (each repeats once). */
  private readonly repeated = new Set<string>();

  protected readonly coursePath = computed(() => `${this.context.basePath}/${this.course()?.id ?? this.courseId}`);
  protected readonly hasStudied = computed(() => this.allCards().some((card) => this.finishedLessons().has(card.lessonId)));
  protected readonly deck = computed(() =>
    this.scope() === 'studied' ? this.allCards().filter((card) => this.finishedLessons().has(card.lessonId)) : this.allCards(),
  );
  protected readonly current = computed(() => this.queue()[0] ?? null);
  protected readonly position = computed(() => Math.min(this.sessionTotal(), this.sessionTotal() - this.queue().length + 1));
  protected readonly dueCount = computed(() => this.deck().filter((card) => isDue(this.states()[card.id])).length);
  protected readonly knownCount = computed(() => this.deck().filter((card) => (this.states()[card.id]?.b ?? 0) >= 3).length);
  protected readonly learningCount = computed(() => this.deck().filter((card) => {
    const box = this.states()[card.id]?.b ?? 0;
    return box > 0 && box < 3;
  }).length);
  protected readonly nextDue = computed(() => {
    const times = this.deck().map((card) => this.states()[card.id]?.d).filter((time): time is number => typeof time === 'number' && time > Date.now());
    if (!times.length) return null;
    return new Date(Math.min(...times)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  });

  async ngOnInit(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      this.error.set('Sign in to use flashcards.');
      this.loading.set(false);
      return;
    }
    try {
      const course = await this.courses.getCourse(this.context, this.courseId);
      if (!course) {
        this.error.set('This course is not available.');
        return;
      }
      const [lessons, progress, states] = await Promise.all([
        this.courses.listLessons(course),
        this.courses.getProgress(uid, progressId(course)).catch(() => null),
        this.flashcards.load(uid, course).catch(() => ({})),
      ]);
      this.course.set(course);
      this.allCards.set(buildDeck(lessons));
      this.finishedLessons.set(new Set(progress?.completedLessonIds ?? []));
      this.states.set(states);
      // Start with what the learner has studied, when there is any.
      this.scope.set(this.hasStudied() ? 'studied' : 'all');
      this.start();
    } catch (error) {
      console.error('[Flashcards] Could not load the course', error);
      this.error.set('Flashcards could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected setScope(scope: Scope): void {
    this.scope.set(scope);
    this.start();
  }

  /** A new session: due cards (new ones first in lesson order, then the rest), or every card when practicing. */
  protected start(practice = false): void {
    const states = this.states();
    const cards = practice ? shuffle(this.deck()) : this.deck().filter((card) => isDue(states[card.id]));
    const ordered = practice ? cards : [...cards.filter((card) => !states[card.id]), ...shuffle(cards.filter((card) => states[card.id]))];
    const session = ordered.slice(0, SESSION_SIZE);
    this.repeated.clear();
    this.queue.set(session);
    this.sessionTotal.set(session.length);
    this.reviewed.set(0);
    this.flipped.set(false);
  }

  protected flip(): void {
    if (this.current()) this.flipped.set(true);
  }

  protected async answer(knewIt: boolean): Promise<void> {
    const card = this.current();
    const course = this.course();
    const uid = this.auth.firebaseUser()?.uid;
    if (!card || !course || !uid || !this.flipped()) return;

    this.states.update((states) => ({ ...states, [card.id]: nextState(states[card.id], knewIt) }));
    const [, ...rest] = this.queue();
    // "Again": the card comes back once, later in this session.
    if (!knewIt && !this.repeated.has(card.id)) {
      this.repeated.add(card.id);
      this.queue.set([...rest, card]);
      this.sessionTotal.update((total) => total + 1);
    } else {
      this.queue.set(rest);
    }
    this.reviewed.update((count) => count + 1);
    this.flipped.set(false);

    this.saving.set(true);
    try {
      await this.flashcards.save(uid, course, this.states(), new Set(this.allCards().map((item) => item.id)));
    } catch (error) {
      console.warn('[Flashcards] Could not save progress', error);
      this.notify.error('Your flashcard progress could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;
    if (!this.current()) return;
    if (!this.flipped() && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      this.flip();
    } else if (this.flipped() && event.key === '1') {
      void this.answer(false);
    } else if (this.flipped() && event.key === '2') {
      void this.answer(true);
    }
  }

  protected readonly boxCount = BOX_COUNT;
}
