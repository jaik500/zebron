import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface StudyLesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  content: string[];
  videoUrl?: string;
}

interface StudyModule {
  id: string;
  title: string;
  description: string;
  lessons: StudyLesson[];
}

interface StudyCourse {
  slug: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  outcomes: string[];
  modules: StudyModule[];
}

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 text-slate-800">
      <header class="bg-[#032D42] text-white">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <a routerLink="/" class="flex items-center gap-2 font-bold" aria-label="Zebron home">
            <img src="/zebron-favicon.svg" alt="" class="h-8 w-8" />
            <span class="text-lg">Zebron <span class="font-normal text-cyan-200">Learning</span></span>
          </a>
          <a [routerLink]="learnerBaseRoute()" class="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            ← All courses
          </a>
        </div>
      </header>

      <section class="bg-gradient-to-br from-[#032D42] to-[#07556A] px-5 py-10 text-white sm:px-6 lg:px-8">
        <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div>
            <div class="mb-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-100">{{ course().category }}</span>
              <span class="rounded-full border border-white/20 px-3 py-1 text-xs">{{ course().level }}</span>
              <span class="rounded-full border border-white/20 px-3 py-1 text-xs">{{ course().duration }}</span>
            </div>
            <p class="text-sm font-semibold uppercase tracking-[.18em] text-cyan-200">Course</p>
            <h1 class="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{{ course().title }}</h1>
            <p class="mt-4 max-w-3xl text-base leading-7 text-slate-200">{{ course().description }}</p>
            <div class="mt-6 flex flex-wrap gap-3">
              <button type="button" (click)="startLearning()" class="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-[#032D42] hover:bg-cyan-200">
                {{ activeLesson() ? 'Continue studying' : 'Start studying' }}
              </button>
              <span class="self-center text-sm text-slate-200">{{ completedCount() }} of {{ totalLessons() }} lessons completed</span>
            </div>
            <div class="mt-4 h-2 max-w-xl overflow-hidden rounded-full bg-white/20" role="progressbar" [attr.aria-valuenow]="progressPercent()" aria-valuemin="0" aria-valuemax="100" aria-label="Course progress">
              <div class="h-full rounded-full bg-cyan-300 transition-all" [style.width.%]="progressPercent()"></div>
            </div>
          </div>
          <aside class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p class="text-sm font-semibold text-cyan-100">What you'll learn</p>
            <ul class="mt-4 space-y-3">
              @for (outcome of course().outcomes; track outcome) {
                <li class="flex gap-2 text-sm leading-5 text-white">
                  <span class="font-bold text-cyan-300">✓</span><span>{{ outcome }}</span>
                </li>
              }
            </ul>
          </aside>
        </div>
      </section>

      <div class="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section class="min-w-0">
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Course material</p>
              <h2 class="mt-1 text-2xl font-bold text-[#032D42]">Study lesson</h2>
            </div>
            @if (activeLesson()) {
              <button type="button" (click)="toggleCompleted(activeLesson()!.id)" class="rounded-lg border px-3 py-2 text-sm font-semibold" [class.border-teal-700]="isCompleted(activeLesson()!.id)" [class.text-teal-800]="isCompleted(activeLesson()!.id)" [class.border-slate-300]="!isCompleted(activeLesson()!.id)">
                {{ isCompleted(activeLesson()!.id) ? '✓ Completed' : 'Mark as complete' }}
              </button>
            }
          </div>

          @if (activeLesson(); as lesson) {
            <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              @if (lesson.videoUrl) {
                <div class="aspect-video bg-slate-950">
                  <iframe
                    class="h-full w-full"
                    [src]="safeVideoUrl(lesson.videoUrl)"
                    [title]="lesson.title + ' video lesson'"
                    loading="lazy"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen>
                  </iframe>
                </div>
              } @else {
                <div class="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-[#032D42] to-[#087C83] p-6 text-center text-white">
                  <span class="mb-3 grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/10 text-2xl" aria-hidden="true">▶</span>
                  <p class="text-lg font-bold">Video lesson slot</p>
                  <p class="mt-2 max-w-md text-sm text-cyan-50">Add a YouTube/Vimeo embed URL or a hosted MP4 URL to this lesson's <code class="rounded bg-black/20 px-1">videoUrl</code> field.</p>
                </div>
              }
              <div class="p-5 sm:p-7">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                  <span>{{ activeModuleTitle() }}</span>
                  <span>{{ lesson.duration }}</span>
                </div>
                <h2 class="mt-2 text-2xl font-bold text-[#032D42]">{{ lesson.title }}</h2>
                <p class="mt-3 leading-7 text-slate-600">{{ lesson.summary }}</p>
                <div class="mt-6 space-y-5">
                  @for (paragraph of lesson.content; track $index) {
                    <p class="leading-7 text-slate-700">{{ paragraph }}</p>
                  }
                </div>
                <div class="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
                  <button type="button" (click)="previousLesson()" [disabled]="!hasPreviousLesson()" class="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">← Previous lesson</button>
                  <button type="button" (click)="nextLesson()" [disabled]="!hasNextLesson()" class="rounded-lg bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-40">Next lesson →</button>
                </div>
              </div>
            </article>
          } @else {
            <div class="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p class="font-semibold">Select a lesson from the course outline.</p>
            </div>
          }

          <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 class="text-xl font-bold text-[#032D42]">Study notes</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">Use this area to review key ideas from the current lesson. The content below is starter material and can be replaced with your course's actual notes.</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-sm font-bold text-[#032D42]">Remember</p>
                <p class="mt-1 text-sm leading-6 text-slate-600">Study each concept, connect it to a practical example, and summarize it in your own words.</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-sm font-bold text-[#032D42]">Practice</p>
                <p class="mt-1 text-sm leading-6 text-slate-600">After each lesson, identify one thing you can explain without looking at the material.</p>
              </div>
            </div>
          </section>
        </section>

        <aside class="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="border-b border-slate-200 p-5">
            <p class="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Learning path</p>
            <h2 class="mt-1 text-xl font-bold text-[#032D42]">Course outline</h2>
            <p class="mt-1 text-sm text-slate-500">{{ totalLessons() }} lessons · {{ course().modules.length }} modules</p>
          </div>
          <div class="divide-y divide-slate-100">
            @for (module of course().modules; track module.id) {
              <div class="p-4">
                <h3 class="text-sm font-bold text-[#032D42]">{{ module.title }}</h3>
                <p class="mt-1 text-xs leading-5 text-slate-500">{{ module.description }}</p>
                <div class="mt-3 space-y-1">
                  @for (lesson of module.lessons; track lesson.id) {
                    <button type="button" (click)="selectLesson(module.id, lesson.id)" class="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50" [class.bg-teal-50]="activeLessonId() === lesson.id" [attr.aria-current]="activeLessonId() === lesson.id ? 'true' : null">
                      <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold" [class.border-teal-700]="activeLessonId() === lesson.id" [class.bg-teal-700]="isCompleted(lesson.id)" [class.text-white]="isCompleted(lesson.id)" [class.border-slate-300]="!isCompleted(lesson.id) && activeLessonId() !== lesson.id">
                        {{ isCompleted(lesson.id) ? '✓' : lessonNumber(lesson.id) }}
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold" [class.text-teal-800]="activeLessonId() === lesson.id" [class.text-slate-700]="activeLessonId() !== lesson.id">{{ lesson.title }}</span>
                        <span class="mt-1 block text-xs text-slate-500">{{ lesson.duration }}@if (lesson.videoUrl) { · Video }</span>
                      </span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </aside>
      </div>

      <footer class="border-t border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
        Study at your own pace. Your progress is kept for this page session while this course uses hardcoded sample data.
      </footer>
    </main>
  `,
})
export class CourseDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly organizationId = computed(
    () =>
      this.route.snapshot.paramMap.get('organizationId') ??
      this.route.parent?.snapshot.paramMap.get('organizationId') ??
      null,
  );

  readonly learnerBaseRoute = computed(() => {
    const organizationId = this.organizationId();
    return organizationId
      ? `/partner/org/${organizationId}/learn/test-center`
      : '/test-center';
  });

  // Hardcoded demo content for the first UI pass. Replace these records with
  // Firestore-backed course/module/lesson models when the content workflow is ready.
  readonly course = signal<StudyCourse>({
    slug: 'intro-to-cybersecurity',
    title: 'Introduction to Cybersecurity',
    category: 'Cybersecurity',
    level: 'Beginner',
    duration: 'About 2 hours',
    description:
      'Build a foundation in security concepts, common threats, safe digital habits, and the principles used to protect systems and information.',
    outcomes: [
      'Explain confidentiality, integrity, and availability.',
      'Recognize common threats such as phishing and malware.',
      'Describe practical account and device protection habits.',
      'Understand the purpose of incident reporting and response.',
    ],
    modules: [
      {
        id: 'foundations',
        title: 'Module 1 · Security foundations',
        description: 'Learn the core principles behind information security.',
        lessons: [
          {
            id: 'cia-triad',
            title: 'The CIA triad',
            duration: '8 min',
            summary: 'Confidentiality, integrity, and availability are three core goals used to reason about information security.',
            content: [
              'Confidentiality means information is accessible only to people and systems that are authorized to see it. Access controls, encryption, and careful handling of sensitive information help support confidentiality.',
              'Integrity means information remains accurate and is changed only in authorized ways. Validation, permissions, audit logs, and cryptographic checks can help detect or prevent unauthorized changes.',
              'Availability means systems and information are usable when authorized people need them. Backups, resilient design, patching, and recovery planning all contribute to availability.',
              'A single event can affect more than one goal. For example, ransomware can prevent access to files (availability) and may also expose information (confidentiality).',
            ],
          },
          {
            id: 'risk-and-assets',
            title: 'Assets, threats, and risk',
            duration: '10 min',
            summary: 'Security decisions begin by identifying what needs protection and what could harm it.',
            content: [
              'An asset is something valuable that an organization wants to protect: data, devices, applications, services, credentials, or business operations.',
              'A threat is a potential cause of harm. A vulnerability is a weakness that a threat could exploit. Risk considers the likelihood and impact of a harmful event in a particular context.',
              'Controls reduce risk but rarely eliminate it entirely. A useful security program prioritizes controls according to business impact, exposure, and the resources available.',
            ],
          },
        ],
      },
      {
        id: 'common-threats',
        title: 'Module 2 · Common threats',
        description: 'Recognize common ways attackers target people and systems.',
        lessons: [
          {
            id: 'phishing',
            title: 'Phishing and social engineering',
            duration: '12 min',
            summary: 'Attackers may manipulate people into revealing information, approving access, or opening malicious content.',
            content: [
              'Phishing messages often create urgency, imitate trusted organizations, or encourage a person to open an attachment or visit a fraudulent sign-in page.',
              'Check the sender and the destination of links carefully. Unexpected requests for passwords, payment, gift cards, authentication codes, or sensitive files deserve extra scrutiny.',
              'When a message seems suspicious, verify the request through a known, independent channel. Report it using your organization’s approved process rather than forwarding it widely.',
            ],
          },
          {
            id: 'malware',
            title: 'Malware and safe downloads',
            duration: '11 min',
            summary: 'Malware is software intended to perform harmful or unauthorized actions on a device or network.',
            content: [
              'Malware includes ransomware, spyware, trojans, and other malicious programs. It can arrive through unsafe downloads, compromised websites, malicious attachments, or exploited vulnerabilities.',
              'Install software only from trusted sources, keep systems updated, use approved endpoint protection, and avoid disabling security controls to run an unknown file.',
              'If you suspect a device is compromised, follow your organization’s incident process. Avoid attempting ad hoc cleanup that could destroy evidence or spread the problem.',
            ],
          },
        ],
      },
      {
        id: 'protect-yourself',
        title: 'Module 3 · Everyday protection',
        description: 'Apply safer authentication and device practices.',
        lessons: [
          {
            id: 'authentication',
            title: 'Passwords and multifactor authentication',
            duration: '9 min',
            summary: 'Strong authentication makes it harder for someone to access an account using a stolen password alone.',
            content: [
              'Use a unique password or passphrase for each account and consider an approved password manager. Reusing passwords means one compromised service can put other accounts at risk.',
              'Multifactor authentication adds a second proof of identity. Prefer phishing-resistant methods where supported, and never approve an unexpected authentication prompt.',
              'Never share one-time codes or recovery codes with someone who contacts you unexpectedly. Report repeated or unfamiliar prompts as a possible sign of attempted account access.',
            ],
          },
          {
            id: 'incident-response',
            title: 'Recognizing and reporting an incident',
            duration: '10 min',
            summary: 'Quick, accurate reporting helps the appropriate team contain and investigate security events.',
            content: [
              'Possible warning signs include unexpected account prompts, suspicious file changes, unusual device behavior, data sent to an unknown recipient, or a lost device that can access work information.',
              'Use your organization’s reporting channel and provide concise facts: what happened, when it happened, which device or account was involved, and what actions you already took.',
              'Follow the response team’s instructions. Do not conceal a mistake or assume an event is harmless just because you are unsure whether information was exposed.',
            ],
          },
        ],
      },
    ],
  });

  readonly activeLessonId = signal('cia-triad');
  readonly completedLessonIds = signal<string[]>([]);

  readonly allLessons = computed(() =>
    this.course().modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ module, lesson })),
    ),
  );

  readonly activeEntry = computed(
    () => this.allLessons().find((entry) => entry.lesson.id === this.activeLessonId()) ?? null,
  );

  readonly activeLesson = computed(() => this.activeEntry()?.lesson ?? null);
  readonly activeModuleTitle = computed(() => this.activeEntry()?.module.title ?? '');
  readonly totalLessons = computed(() => this.allLessons().length);
  readonly completedCount = computed(() => this.completedLessonIds().length);
  readonly progressPercent = computed(() =>
    this.totalLessons() ? Math.round((this.completedCount() / this.totalLessons()) * 100) : 0,
  );

  selectLesson(moduleId: string, lessonId: string): void {
    const exists = this.course().modules.some(
      (module) => module.id === moduleId && module.lessons.some((lesson) => lesson.id === lessonId),
    );
    if (exists) this.activeLessonId.set(lessonId);
  }

  startLearning(): void {
    if (!this.activeLesson() && this.allLessons().length) {
      this.activeLessonId.set(this.allLessons()[0].lesson.id);
    }
  }

  isCompleted(lessonId: string): boolean {
    return this.completedLessonIds().includes(lessonId);
  }

  toggleCompleted(lessonId: string): void {
    this.completedLessonIds.update((completed) =>
      completed.includes(lessonId)
        ? completed.filter((id) => id !== lessonId)
        : [...completed, lessonId],
    );
  }

  lessonNumber(lessonId: string): number {
    return this.allLessons().findIndex((entry) => entry.lesson.id === lessonId) + 1;
  }

  hasPreviousLesson(): boolean {
    const index = this.allLessons().findIndex((entry) => entry.lesson.id === this.activeLessonId());
    return index > 0;
  }

  hasNextLesson(): boolean {
    const index = this.allLessons().findIndex((entry) => entry.lesson.id === this.activeLessonId());
    return index >= 0 && index < this.allLessons().length - 1;
  }

  previousLesson(): void {
    const index = this.allLessons().findIndex((entry) => entry.lesson.id === this.activeLessonId());
    if (index > 0) this.activeLessonId.set(this.allLessons()[index - 1].lesson.id);
  }

  nextLesson(): void {
    const index = this.allLessons().findIndex((entry) => entry.lesson.id === this.activeLessonId());
    if (index >= 0 && index < this.allLessons().length - 1) {
      this.activeLessonId.set(this.allLessons()[index + 1].lesson.id);
    }
  }

  safeVideoUrl(url: string): SafeResourceUrl {
    const embedUrl = this.toEmbedUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  private toEmbedUrl(url: string): string {
    // Accept YouTube watch/share URLs, direct YouTube embed URLs, and hosted MP4 URLs.
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com') && parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
      }
      if (parsed.hostname === 'youtu.be') {
        const id = parsed.pathname.replace(/^\/+/, '');
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
      }
      if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
        return `https://www.youtube-nocookie.com${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }
}
