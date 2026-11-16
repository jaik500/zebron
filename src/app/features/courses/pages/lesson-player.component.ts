import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CodeLabComponent } from '../../coding-lab/code-lab.component';
import { CodeExercise, CODE_LANGUAGES } from '../../coding-lab/code-lab.model';
import { CourseHeaderComponent } from '../components/course-header.component';
import { LessonMediaComponent } from '../components/lesson-media.component';
import { courseContextFromRoute, LessonBlock } from '../course.model';
import { CourseStore } from '../course.store';

/** A lesson block prepared for display. */
/** Text, or a runnable code example (```js fences) inside a text section. */
type TextPart = { kind: 'html'; html: string } | { kind: 'example'; exercise: CodeExercise };

type ViewBlock =
  | { kind: 'text'; html: string; parts: TextPart[] }
  | { kind: 'code'; id: string; exercise: CodeExercise }
  | { kind: 'tip'; html: string }
  | {
      kind: 'media';
      mediaKind: 'video' | 'audio' | 'document';
      url: string;
      start: number;
      label: string;
      caption: string;
    }
  | { kind: 'image'; url: string; alt: string; caption: string }
  | {
      kind: 'check';
      index: number;
      questions: {
        question: string;
        options: string[];
        answer: number;
        explanation?: string;
      }[];
    };
/**
 * The lesson player: course outline on the left (wide screens), the lesson
 * in a readable column, quick checks that must be answered correctly before
 * moving on, and Previous / Complete and continue at the bottom.
 */
@Component({
  selector: 'app-lesson-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterLink,
    MatIconModule,
    MatExpansionModule,
    TranslatePipe,
    CourseHeaderComponent,
    LessonMediaComponent,
    CodeLabComponent,
  ],
  template: `
    <main
      #player
      class="w-full min-w-0 overflow-x-clip bg-slate-50"
      [class]="focusMode() ? 'fixed inset-0 z-[900] overflow-y-auto overscroll-contain' : 'mt-16 min-h-screen'"
      (keydown.escape)="onEscape()"
    >
      @if (!focusMode()) {
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          {
            label: store.course()?.title ?? 'Course',
            link: coursePath(),
            translate: !store.course(),
          },
          { label: store.lesson()?.title ?? 'Lesson', translate: !store.lesson() },
        ]"
      />
      }

      <div
        class="mx-auto grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3 px-2 py-3 sm:gap-5 sm:px-5 sm:py-6 lg:gap-6 lg:px-6 2xl:px-8"
        [class]="focusMode() ? 'max-w-[110rem]' : 'max-w-7xl lg:grid-cols-[240px_minmax(0,1fr)] 2xl:max-w-[88rem]'"
      >
        <!-- Outline (wide screens; hidden in focus mode) -->
        @if (!focusMode()) {
        <nav
          class="hidden self-start rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-20 lg:block"
          [attr.aria-label]="'Course outline' | t"
        >
          @for (
            module of store.course()?.modules ?? [];
            track module.id;
            let moduleIndex = $index
          ) {
            <p class="px-2 pb-1 pt-2 text-[12px] font-bold uppercase tracking-wide text-[#007979]">
              {{ 'Module {0}' | t: [moduleIndex + 1] }}
            </p>
            @for (item of module.lessons; track item.id) {
              <a
                [routerLink]="[coursePath(), 'lessons', item.id]"
                class="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm"
                [ngClass]="
                  item.id === store.lesson()?.id
                    ? 'bg-teal-50 font-semibold text-[#007979]'
                    : 'text-slate-700 hover:bg-slate-50'
                "
                [attr.aria-current]="item.id === store.lesson()?.id ? 'page' : null"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  [ngClass]="
                    store.completedIds().has(item.id)
                      ? 'border-[#007979] bg-[#007979] text-white'
                      : 'border-slate-200'
                  "
                  aria-hidden="true"
                >
                  @if (store.completedIds().has(item.id)) {
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">check</mat-icon>
                  }
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
              </a>
            }
          }
        </nav>
        }

        <div class="w-full min-w-0">
          <!-- Where you are -->
          <div
            class="lesson-progress-sticky sticky z-10 -mx-1 bg-slate-50/95 px-2 pb-3 pt-1 backdrop-blur"
            [class]="focusMode() ? 'top-0' : 'top-16'"
          >
            <div class="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
              @if (focusMode()) {
                <a
                  [routerLink]="coursePath()"
                  (click)="exitFocusMode()"
                  class="hidden min-w-0 max-w-[40%] truncate font-semibold text-[#007979] hover:underline sm:block"
                  >{{ store.course()?.title }}</a
                >
              }
              <span class="min-w-0 flex-1">
                @if (store.lessonIndex() >= 0) {
                  {{ 'Lesson {0} of {1}' | t: [store.lessonIndex() + 1, store.outline().length] }}
                  @if (store.lesson(); as lesson) {
                    · {{ lesson.minutes }} min
                  }
                }
              </span>
              <span class="shrink-0">{{ '{percent}% of course' | t: { percent: coursePercent() } }}</span>
              <button
                type="button"
                (click)="toggleFocusMode()"
                class="-my-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                [attr.aria-pressed]="focusMode()"
                [attr.aria-label]="(focusMode() ? 'Exit full screen' : 'Full screen') | t"
                [title]="(focusMode() ? 'Exit full screen (Esc)' : 'Full screen: hide the menus and use the whole screen') | t"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ focusMode() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
                <span class="hidden sm:inline">{{ (focusMode() ? 'Exit full screen' : 'Full screen') | t }}</span>
              </button>
            </div>
            <div
              class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              [attr.aria-label]="'Course progress' | t"
              [attr.aria-valuenow]="coursePercent()"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-[width] duration-500"
                [style.width.%]="coursePercent()"
              ></div>
            </div>
          </div>

          @if (store.courseLoading() || store.lessonLoading()) {
            <div
              class="h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200/70"
              aria-hidden="true"
            ></div>
          } @else if (store.courseError() || store.lessonError()) {
            <div
              class="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center"
              role="alert"
            >
              <p class="text-slate-700">{{ (store.courseError() || store.lessonError())! | t }}</p>
              <a
                [routerLink]="coursePath()"
                class="mt-3 inline-block font-semibold text-[#007979] hover:underline"
                >{{ 'Back to the course' | t }}</a
              >
            </div>
          } @else if (store.lesson(); as lesson) {
            <article
              class="mx-auto w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white pb-5 pt-5 shadow-sm sm:pb-6 sm:pt-6"
              [class]="focusMode() ? 'max-w-7xl' : 'max-w-5xl'"
            >
              @if (moduleTitle()) {
                <p class="break-words px-4 text-[11px] font-bold uppercase tracking-wide text-[#007979] sm:px-6">
                  {{ moduleTitle() }}
                </p>
              }
              <h1
                class="mt-1 break-words px-4 text-[1.375rem] font-bold leading-tight tracking-tight text-slate-950 [overflow-wrap:anywhere] sm:px-6 sm:text-[1.75rem]"
              >
                {{ lesson.title }}
              </h1>

              <div class="mt-4 w-full min-w-0 sm:mt-5">
                <mat-accordion class="block w-full min-w-0" [multi]="true">
                  @for (block of blocks(); track $index; let blockIndex = $index) {
                    <mat-expansion-panel
                      [attr.id]="'lesson-block-' + $index"
                      class="!m-0 !w-full !min-w-0 !scroll-mt-32 !overflow-hidden !rounded-none !border-0 !border-t !border-slate-200 !bg-white !shadow-none transition-colors last:!border-b [&_.mat-expansion-panel-body]:!p-0"
                      [ngClass]="
                        focusedBlock() === $index
                          ? '!ring-2 !ring-inset !ring-[#007979]/40'
                          : ''
                      "
                      [expanded]="expandedBlocks().has($index)"
                      (opened)="openBlock($index)"
                      (closed)="closeBlock($index)"
                    >
                      <mat-expansion-panel-header
                        class="!min-h-14 !w-full !rounded-none !pl-2.5 !pr-4 transition-colors sm:!pl-4 sm:!pr-6"
                        [ngClass]="
                          expandedBlocks().has($index)
                            ? '!h-auto !bg-teal-50 !py-3 hover:!bg-teal-100/60'
                            : '!bg-white hover:!bg-slate-50'
                        "
                      >
                        <mat-panel-title class="!m-0 !flex !w-full !min-w-0 !items-center !gap-2.5 sm:!gap-3">
                          <span
                            class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors sm:h-[22px] sm:w-[22px] sm:text-xs"
                            [ngClass]="
                              isBlockDone(block, $index)
                                ? 'bg-[#007979] text-white'
                                : expandedBlocks().has($index)
                                  ? 'bg-[#007979] text-white ring-4 ring-teal-100'
                                  : 'border-[1.5px] border-slate-300 bg-white text-slate-500'
                            "
                            aria-hidden="true"
                          >
                            @if (isBlockDone(block, $index)) {
                              <mat-icon class="!h-3 !w-3 !text-[12px] sm:!h-3.5 sm:!w-3.5 sm:!text-[14px]">check</mat-icon>
                            } @else {
                              {{ $index + 1 }}
                            }
                          </span>
                          <span
                            class="block min-w-0 flex-1 whitespace-normal break-words text-left text-base font-bold [overflow-wrap:anywhere] leading-snug sm:text-lg"
                            [ngClass]="
                              expandedBlocks().has($index)
                                ? 'whitespace-normal break-words text-[#043b3b]'
                                : 'line-clamp-2 text-slate-800'
                            "
                          >
                            @if (!expandedBlocks().has($index)) {
                              <span class="font-semibold text-slate-500">{{ 'Next:' | t }} </span>
                            }
                            {{ blockTitle(block, $index) }}
                          </span>
                        </mat-panel-title>
                      </mat-expansion-panel-header>

                      <div class="ml-[18px] min-w-0 border-l-2 border-teal-200 pb-5 pt-3 sm:ml-[26px] sm:pt-4">
                        @if (block.kind === 'text') {
                          @for (part of block.parts; track $index; let partIndex = $index) {
                            @if (part.kind === 'html') {
                          <div
                            class="min-w-0 break-words pl-2 pr-4 [overflow-wrap:anywhere] text-[1.0625rem] leading-7 text-slate-800 sm:pl-3 sm:pr-6
                              [&_.kc-table-wrap]:!-ml-2 [&_.kc-table-wrap]:!-mr-4 [&_.kc-table-wrap]:!mb-4 [&_.kc-table-wrap]:!rounded-none [&_.kc-table-wrap]:!border-x-0
                              sm:[&_.kc-table-wrap]:!-ml-3 sm:[&_.kc-table-wrap]:!-mr-6
                              [&_.kc-table]:[overflow-wrap:normal] [&_.kc-table_td]:break-words
                              [&_.kc-table_th]:!bg-slate-50 [&_.kc-table_th]:!text-[11px] [&_.kc-table_th]:!uppercase [&_.kc-table_th]:!tracking-wide [&_.kc-table_th]:!text-slate-500
                              [&_.kc-table_th:first-child]:!pl-2 [&_.kc-table_td:first-child]:!pl-2
                              [&_.kc-table_th:last-child]:!pr-4 [&_.kc-table_td:last-child]:!pr-4
                              sm:[&_.kc-table_th:first-child]:!pl-3 sm:[&_.kc-table_td:first-child]:!pl-3
                              sm:[&_.kc-table_th:last-child]:!pr-6 sm:[&_.kc-table_td:last-child]:!pr-6
                              [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-[#00605f]
                              [&_h3]:mb-1.5 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-[#00605f]
                              [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc
                              [&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_li]:my-1
                              [&_a]:text-teal-700 [&_a]:underline
                              [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm
                              [&_pre]:-ml-2 [&_pre]:-mr-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:bg-slate-900 [&_pre]:py-3 [&_pre]:pl-2 [&_pre]:pr-4 [&_pre]:text-slate-50 sm:[&_pre]:-ml-3 sm:[&_pre]:-mr-6 sm:[&_pre]:pl-3 sm:[&_pre]:pr-6
                              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
                              [&>*:last-child]:mb-0"
                            [innerHTML]="partHtml(block, part.html, partIndex, blockIndex)"
                          ></div>
                            } @else if (part.kind === 'example') {
                              <!-- Runnable example: Run opens it in the Coding Lab panel -->
                              @if (openExamples().has(blockIndex + ':' + partIndex)) {
                                <div class="my-3 pl-2 pr-4 sm:pl-3 sm:pr-6">
                                  <app-code-lab [exercise]="part.exercise" mode="example" [autoRun]="true" [editorHeight]="exampleHeight(part.exercise.starter)" [labPath]="labPath()" />
                                </div>
                              } @else {
                                <div class="group relative mb-4 -ml-2 -mr-4 bg-slate-900 sm:-ml-3 sm:-mr-6">
                                  <pre class="m-0 overflow-x-auto py-3 pl-2 pr-24 text-[0.9rem] leading-6 text-slate-50 sm:pl-3"><code>{{ part.exercise.starter }}</code></pre>
                                  <button type="button" (click)="openExample(blockIndex, partIndex)" class="absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-md bg-[#12bfc3] px-2.5 text-xs font-bold text-[#032d42] shadow hover:bg-[#3fd3d6] sm:right-4" [attr.aria-label]="'Run this example' | t">
                                    <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">play_arrow</mat-icon>{{ 'Run' | t }}
                                  </button>
                                </div>
                              }
                            }
                          }
                        } @else if (block.kind === 'code') {
                          <div class="pl-2 pr-4 sm:pl-3 sm:pr-6">
                            <app-code-lab [exercise]="block.exercise" [saveKey]="exerciseKey(block.id)" [labPath]="labPath()" (passedChange)="markExercisePassed(block.id)" />
                          </div>
                        } @else if (block.kind === 'tip') {
                          <aside
                            class="flex min-w-0 gap-2 border-y border-amber-100 bg-amber-50 py-3 pl-2 pr-4 text-amber-900 sm:gap-3 sm:py-4 sm:pl-3 sm:pr-6"
                          >
                            <mat-icon class="shrink-0 text-amber-600" aria-hidden="true"
                              >lightbulb</mat-icon
                            >
                            <div
                              class="min-w-0 break-words [overflow-wrap:anywhere] text-[0.975rem] leading-7 text-amber-900
                                [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-bold
                                [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:font-bold
                                [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:ml-6 [&_ul]:list-disc
                                [&_ol]:mb-3 [&_ol]:ml-6 [&_ol]:list-decimal
                                [&_a]:text-teal-800 [&_a]:underline
                                [&>*:last-child]:mb-0"
                              [innerHTML]="block.html"
                            ></div>
                          </aside>
                        } @else if (block.kind === 'media') {
                          <app-lesson-media
                            class="block [&_.rounded-xl]:!rounded-none [&_.border]:!border-x-0 [&_figcaption]:pl-2 [&_figcaption]:pr-4 sm:[&_figcaption]:pl-3 sm:[&_figcaption]:pr-6 [&_a]:!pl-2 [&_a]:!pr-4 sm:[&_a]:!pl-3 sm:[&_a]:!pr-6"
                            [kind]="block.mediaKind"
                            [url]="block.url"
                            [start]="block.start"
                            [label]="block.label"
                            [caption]="block.caption"
                          />
                        } @else if (block.kind === 'image') {
                          <figure class="m-0">
                            <img
                              [src]="block.url"
                              [alt]="block.alt"
                              class="block w-full border-y border-slate-200"
                              loading="lazy"
                            />
                            @if (block.caption) {
                              <figcaption class="mt-2 break-words pl-2 pr-4 text-sm text-slate-500 [overflow-wrap:anywhere] sm:pl-3 sm:pr-6">
                                {{ block.caption }}
                              </figcaption>
                            }
                          </figure>
                        } @else if (block.kind === 'check') {
                          <section
                            class="min-w-0 border-y border-teal-100 bg-teal-50/40 py-4 pl-2 pr-4 sm:py-5 sm:pl-3 sm:pr-6"
                            [attr.aria-labelledby]="'check-' + block.index"
                          >
                            <h2
                              [id]="'check-' + block.index"
                              class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                            >
                              <mat-icon class="text-[#007979]" aria-hidden="true">quiz</mat-icon>
                              {{ 'Quick check' | t }}
                            </h2>

                            <div class="mt-4 space-y-6">
                              @for (
                                question of block.questions;
                                track $index;
                                let questionIndex = $index
                              ) {
                                <div class="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                  <p class="break-words font-medium text-slate-800 [overflow-wrap:anywhere]">
                                    <span
                                      class="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500"
                                    >
                                      {{ 'Question {0}' | t: [questionIndex + 1] }}
                                    </span>
                                    {{ question.question }}
                                  </p>

                                  <div class="mt-3 flex flex-col gap-2">
                                    @for (
                                      option of question.options;
                                      track $index;
                                      let optionIndex = $index
                                    ) {
                                      <button
                                        type="button"
                                        class="min-h-12 w-full min-w-0 whitespace-normal break-words rounded-xl border px-3 py-3 text-left text-sm leading-6 transition [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] focus-visible:ring-offset-2"
                                        [ngClass]="
                                          optionClass(
                                            checkAnswerKey(block.index, questionIndex),
                                            optionIndex,
                                            question.answer
                                          )
                                        "
                                        [disabled]="
                                          isSolved(
                                            checkAnswerKey(block.index, questionIndex),
                                            question.answer
                                          )
                                        "
                                        [attr.aria-pressed]="
                                          selected()[checkAnswerKey(block.index, questionIndex)] ===
                                          optionIndex
                                        "
                                        (click)="
                                          choose(
                                            checkAnswerKey(block.index, questionIndex),
                                            optionIndex,
                                            question.answer
                                          )
                                        "
                                      >
                                        {{ option }}
                                      </button>
                                    }
                                  </div>

                                  <div class="mt-2 min-h-5 break-words text-sm [overflow-wrap:anywhere]" aria-live="polite">
                                    @if (
                                      selected()[checkAnswerKey(block.index, questionIndex)] !==
                                      undefined
                                    ) {
                                      @if (
                                        selected()[checkAnswerKey(block.index, questionIndex)] ===
                                        question.answer
                                      ) {
                                        <p class="text-[#007979]">
                                          <strong>{{ 'Correct.' | t }}</strong>
                                          {{ question.explanation }}
                                        </p>
                                      } @else {
                                        <p class="text-rose-700">
                                          <strong>{{ 'Not quite.' | t }}</strong>
                                          {{ 'Have another look and try again.' | t }}
                                        </p>
                                      }
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          </section>
                        }
                      </div>
                    </mat-expansion-panel>
                  }
                </mat-accordion>
              </div>

              <div
                class="mx-4 mt-6 flex min-w-0 flex-col-reverse gap-3 pt-1 sm:mx-6 sm:mt-7 sm:flex-row sm:items-center sm:justify-between"
              >
                @if (store.previousLesson(); as previous) {
                  <a
                    [routerLink]="[coursePath(), 'lessons', previous.id]"
                    class="inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] sm:w-auto"
                  >
                    <mat-icon aria-hidden="true">arrow_back</mat-icon>{{ 'Previous' | t }}
                  </a>
                } @else {
                  <span></span>
                }

                <button
                  type="button"
                  class="cursor-pointer inline-flex h-11 w-full max-w-full items-center justify-center gap-2 rounded-xl bg-[#007979] px-5 font-semibold text-white shadow-sm transition hover:bg-[#006666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  [disabled]="!canContinue() || store.saving()"
                  (click)="complete()"
                >
                  {{ continueLabel() | t }}
                  <mat-icon aria-hidden="true">{{
                    store.nextLesson() ? 'arrow_forward' : 'flag'
                  }}</mat-icon>
                </button>
              </div>
              @if (!canContinue()) {
                <p class="mx-4 mt-3 text-center text-xs text-slate-500 sm:mx-6 sm:text-right">
                  {{ 'Answer the quick check to continue.' | t }}
                </p>
              } @else {
                <p class="mx-4 mt-3 text-center text-xs text-slate-500 sm:mx-6 sm:text-right">
                  {{ 'Your progress is saved when you continue.' | t }}
                </p>
              }
            </article>
          }
        </div>
      </div>
    </main>
  `,
})
export class LessonPlayerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);

  // ------------------------------------------------------------------
  // Full screen (focus mode): the lesson covers the app's menus and the
  // course outline, uses the full width, and the browser goes full screen
  // where it can. It stays on while moving between lessons.
  // ------------------------------------------------------------------

  private readonly document = inject(DOCUMENT);
  protected readonly focusMode = signal(false);
  /** Focus mode turned on the browser's full screen (and turns it off again). */
  private ownsBrowserFullscreen = false;
  private readonly player = viewChild<ElementRef<HTMLElement>>('player');

  /** In focus mode the lesson scrolls inside its own container, not the window. */
  private scrollPosition(): number {
    return this.focusMode() ? (this.player()?.nativeElement.scrollTop ?? 0) : window.scrollY;
  }

  private scrollToPosition(top: number, behavior: ScrollBehavior = 'auto'): void {
    const target = this.focusMode() ? this.player()?.nativeElement : window;
    target?.scrollTo({ top, behavior });
  }

  protected toggleFocusMode(): void {
    if (this.focusMode()) {
      this.exitFocusMode();
      return;
    }
    this.focusMode.set(true);
    const root = this.document.documentElement;
    if (!this.document.fullscreenElement && root.requestFullscreen) {
      root
        .requestFullscreen()
        .then(() => (this.ownsBrowserFullscreen = true))
        .catch(() => undefined); // Not allowed (e.g. iPhone): the lesson still fills the window.
    }
  }

  protected exitFocusMode(): void {
    this.focusMode.set(false);
    if (this.ownsBrowserFullscreen && this.document.fullscreenElement) {
      void this.document.exitFullscreen().catch(() => undefined);
    }
    this.ownsBrowserFullscreen = false;
  }

  /** Esc leaves focus mode (when the browser is full screen, it handles Esc itself). */
  protected onEscape(): void {
    if (this.focusMode() && !this.document.fullscreenElement) this.exitFocusMode();
  }

  /** The learner left the browser's full screen (Esc or F11): leave focus mode too. */
  private readonly onBrowserFullscreenChange = (): void => {
    if (!this.document.fullscreenElement && this.focusMode()) {
      this.ownsBrowserFullscreen = false;
      this.exitFocusMode();
    }
  };
  private readonly courseId = signal(this.route.snapshot.paramMap.get('courseId') ?? '');

  /** Chosen option per quick check (by block index). */
  protected readonly selected = signal<Record<string, number>>({});
  /** Expanded lesson sections. The first section opens when a lesson loads. */
  protected readonly expandedBlocks = signal<Set<number>>(new Set([0]));
  /** Temporarily highlights the section that has just received focus. */
  protected readonly focusedBlock = signal<number | null>(null);
  /** Sections the learner has opened in this lesson (shown with a tick once closed). */
  protected readonly visitedBlocks = signal<Set<number>>(new Set([0]));
  private focusHighlightTimer: number | undefined;
  /** First answer per quick check: right or wrong. */
  private readonly firstTry = signal<Record<string, boolean>>({});

  protected readonly coursePath = computed(
    () => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId()}`,
  );

  protected readonly coursePercent = computed(() => this.store.courseProgress()?.percent ?? 0);

  protected readonly moduleTitle = computed(() => {
    const lesson = this.store.lesson();
    return (
      this.store
        .course()
        ?.modules.find((module) => module.lessons.some((item) => item.id === lesson?.id))?.title ??
      ''
    );
  });

  protected readonly blocks = computed<ViewBlock[]>(() => {
    return (this.store.lesson()?.blocks ?? []).map((block: LessonBlock, index): ViewBlock => {
      switch (block.type) {
        case 'text':
          return { kind: 'text', html: renderKnowledgeContent(block.text), parts: textParts(block.text) };
        case 'code':
          return {
            kind: 'code',
            id: block.id,
            exercise: {
              language: block.language,
              title: block.title,
              instructions: block.instructions,
              starter: block.starter,
              tests: block.tests,
              hints: block.hints,
              solution: block.solution,
            },
          };
        case 'tip':
          return { kind: 'tip', html: renderKnowledgeContent(block.text) };
        case 'video':
          return {
            kind: 'media',
            mediaKind: 'video',
            url: block.url,
            start: block.start ?? 0,
            label: '',
            caption: block.caption ?? '',
          };
        case 'audio':
          return {
            kind: 'media',
            mediaKind: 'audio',
            url: block.url,
            start: 0,
            label: '',
            caption: block.caption ?? '',
          };
        case 'document':
          return {
            kind: 'media',
            mediaKind: 'document',
            url: block.url,
            start: 0,
            label: block.title ?? '',
            caption: block.caption ?? '',
          };
        case 'image':
          return {
            kind: 'image',
            url: /^https:\/\//i.test(block.url) ? block.url : '',
            alt: block.alt,
            caption: block.caption ?? '',
          };
        case 'check':
          return {
            kind: 'check',
            index,
            questions:
              'questions' in block && Array.isArray(block.questions) && block.questions.length
                ? block.questions
                : [
                    {
                      question: 'question' in block ? (block.question ?? '') : '',
                      options: 'options' in block ? (block.options ?? []) : [],
                      answer: 'answer' in block ? (block.answer ?? -1) : -1,
                      explanation: 'explanation' in block ? (block.explanation ?? '') : '',
                    },
                  ],
          };
      }
    });
  });

  private readonly checks = computed(() =>
    this.blocks().filter(
      (block): block is Extract<ViewBlock, { kind: 'check' }> => block.kind === 'check',
    ),
  );

  private readonly lessonDone = computed(() => {
    const lesson = this.store.lesson();
    return !!lesson && this.store.completedIds().has(lesson.id);
  });

  /** Every quick check answered correctly (or the lesson was already done). */
  protected readonly canContinue = computed(
    () =>
      this.lessonDone() ||
      this.checks().every((check) =>
        check.questions.every(
          (question, questionIndex) =>
            this.selected()[this.checkAnswerKey(check.index, questionIndex)] === question.answer,
        ),
      ),
  );

  protected readonly continueLabel = computed(() => {
    if (this.store.nextLesson()) {
      return this.lessonDone() ? 'Next lesson' : 'Complete and continue';
    }
    return this.lessonDone() ? 'Course summary' : 'Finish course';
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly tabTitle = effect(() => {
    const title = this.store.lesson()?.title;
    if (title) {
      this.pageTitle.setDocumentTitle(title);
    }
  });

  constructor() {
    this.document.addEventListener('fullscreenchange', this.onBrowserFullscreenChange);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', this.onBrowserFullscreenChange);
      // Leaving the lesson pages (course page, exam…) ends full screen.
      if (this.focusMode()) this.exitFocusMode();
      if (this.focusHighlightTimer !== undefined) {
        window.clearTimeout(this.focusHighlightTimer);
      }
    });

    this.store.setContext(this.context);

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });

    // Next and Previous reuse this page: follow the lesson in the address.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const courseId = params.get('courseId') ?? '';
      const lessonId = params.get('lessonId') ?? '';
      this.courseId.set(courseId);
      this.selected.set({});
      this.firstTry.set({});
      this.expandedBlocks.set(new Set([0]));
      this.visitedBlocks.set(new Set([0]));
      void this.load(courseId, lessonId);
    });
  }

  private async load(courseId: string, lessonId: string): Promise<void> {
    await this.store.openCourse(courseId);
    await this.store.openLesson(lessonId);
    this.scrollToPosition(0);
  }

  /** Add an index and move focus to a newly opened section after its panel animation. */
  protected openBlock(index: number): void {
    this.expandedBlocks.update((current) => new Set(current).add(index));
    this.visitedBlocks.update((current) => (current.has(index) ? current : new Set(current).add(index)));

    // The first section is opened automatically when a lesson loads. Only
    // user-opened sections need the guided focus/scroll transition.
    if (index === 0) {
      return;
    }

    // Angular Material emits (opened) after the expansion animation completes.
    // Two animation frames let the browser settle the final panel geometry
    // before measuring and performing one deliberate scroll.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const panel = document.getElementById(`lesson-block-${index}`);
        if (!panel || !this.expandedBlocks().has(index)) {
          return;
        }

        const heading = panel.querySelector<HTMLElement>('.mat-expansion-panel-header');
        if (!heading) {
          return;
        }

        // Focus without allowing the browser to perform a second, implicit scroll.
        heading.focus({ preventScroll: true });

        const stickyProgress = document.querySelector<HTMLElement>('.lesson-progress-sticky');
        const stickyBottom = stickyProgress?.getBoundingClientRect().bottom ?? 112;
        const targetTop = this.scrollPosition() + panel.getBoundingClientRect().top - stickyBottom - 16;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.scrollToPosition(Math.max(0, targetTop), reduceMotion ? 'auto' : 'smooth');

        this.focusedBlock.set(index);
        if (this.focusHighlightTimer !== undefined) {
          window.clearTimeout(this.focusHighlightTimer);
        }
        this.focusHighlightTimer = window.setTimeout(() => {
          this.focusedBlock.set(null);
          this.focusHighlightTimer = undefined;
        }, 1400);
      });
    });
  }

  protected closeBlock(index: number): void {
    this.expandedBlocks.update((current) => {
      const next = new Set(current);
      next.delete(index);
      return next;
    });
  }

  /** Prefer a heading authored in the lesson content for the collapsed title. */
  protected blockTitle(block: ViewBlock, index: number): string {
    if (block.kind === 'text' || block.kind === 'tip') {
      const heading = block.html.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
      if (heading) {
        const title = heading
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&#39;|&apos;/gi, "'")
          .replace(/&quot;/gi, '"')
          .replace(/\s+/g, ' ')
          .trim();
        if (title) {
          return title;
        }
      }
      return block.kind === 'tip' ? 'Key takeaway' : `Reading section ${index + 1}`;
    }

    if (block.kind === 'media') {
      return (
        block.label ||
        block.caption ||
        (block.mediaKind === 'video' ? 'Video' : block.mediaKind === 'audio' ? 'Audio' : 'Document')
      );
    }

    if (block.kind === 'image') {
      return block.caption || 'Image';
    }

    if (block.kind === 'code') {
      return block.exercise.title || 'Coding exercise';
    }

    return 'Quick check';
  }

  /**
   * The first heading is already represented by the expansion-panel header.
   * Remove it from the expanded text only when it matches that header title.
   */
  protected blockContentHtml(block: Extract<ViewBlock, { kind: 'text' }>, index: number): string {
    const match = block.html.match(/^\s*(<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>)/i);
    if (!match) {
      return block.html;
    }

    const headingText = match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();

    const headerText = this.blockTitle(block, index).replace(/\s+/g, ' ').trim();
    return headingText.toLocaleLowerCase() === headerText.toLocaleLowerCase()
      ? block.html.slice(match[0].length)
      : block.html;
  }

  /**
   * A section is done when its quick check is answered correctly, or, for
   * other sections, once it has been read and closed (or the lesson is done).
   */
  protected isBlockDone(block: ViewBlock, index: number): boolean {
    if (block.kind === 'check') {
      return (
        this.lessonDone() ||
        block.questions.every((question, questionIndex) =>
          this.isSolved(this.checkAnswerKey(block.index, questionIndex), question.answer),
        )
      );
    }
    if (block.kind === 'code' && this.passedExercises().has(block.id)) {
      return true;
    }
    if (this.expandedBlocks().has(index)) {
      return false;
    }
    return this.lessonDone() || this.visitedBlocks().has(index);
  }

  // ---------- Coding Lab ----------
  protected readonly openExamples = signal<Set<string>>(new Set());
  protected readonly passedExercises = signal<Set<string>>(new Set());
  protected readonly labPath = computed(() => `${this.context.basePath}/coding-lab`);

  protected openExample(blockIndex: number, partIndex: number): void {
    this.openExamples.update((open) => new Set(open).add(`${blockIndex}:${partIndex}`));
  }

  protected exampleHeight(code: string): string {
    const lines = Math.min(24, Math.max(4, code.split('\n').length + 1));
    return `${(lines * 1.6 + 1.5).toFixed(1)}em`;
  }

  /** Where a learner's work on a lesson exercise is saved. */
  protected exerciseKey(blockId: string): string {
    return `${this.store.course()?.id ?? 'course'}__${this.store.lesson()?.id ?? 'lesson'}__${blockId}`;
  }

  protected markExercisePassed(blockId: string): void {
    this.passedExercises.update((passed) => new Set(passed).add(blockId));
  }

  /** The first part loses the heading shown in the section header. */
  protected partHtml(block: Extract<ViewBlock, { kind: 'text' }>, html: string, partIndex: number, index: number): string {
    return partIndex === 0 ? this.blockContentHtml({ ...block, html }, index) : html;
  }

  protected checkAnswerKey(blockIndex: number, questionIndex: number): string {
    return `${blockIndex}:${questionIndex}`;
  }

  protected isSolved(key: string, answer: number): boolean {
    return this.selected()[key] === answer;
  }

  protected choose(key: string, option: number, answer: number): void {
    if (this.firstTry()[key] === undefined) {
      this.firstTry.update((current) => ({ ...current, [key]: option === answer }));
    }
    this.selected.update((current) => ({ ...current, [key]: option }));
  }

  protected optionClass(key: string, option: number, answer: number): string {
    const chosen = this.selected()[key];

    if (chosen === option) {
      return option === answer
        ? 'border-[#007979] bg-teal-50 font-semibold text-[#00605f]'
        : 'border-rose-300 bg-rose-50 text-rose-800';
    }

    return chosen === answer
      ? 'border-slate-200 text-slate-400'
      : 'border-slate-200 bg-white text-slate-800 hover:border-[#007979] hover:bg-teal-50/50';
  }

  protected async complete(): Promise<void> {
    if (!this.canContinue()) {
      return;
    }

    const questions = this.checks().flatMap((check) =>
      check.questions.map((question, questionIndex) => ({
        key: this.checkAnswerKey(check.index, questionIndex),
      })),
    );
    const score = questions.length
      ? (questions.filter(({ key }) => this.firstTry()[key] === true).length / questions.length) *
        100
      : null;

    const alreadyCompleted = this.store.courseProgress()?.status === 'completed';

    try {
      const result = await this.store.completeLesson(score);
      if (!result) {
        return;
      }

      const next = this.store.nextLesson();

      if (result.courseCompleted && !next) {
        // The end of the course: the summary, with Take test when there is a final exam.
        if (!alreadyCompleted) {
          this.toast.success(this.i18n.t('All lessons done. Well done!'));
        }
        await this.router.navigate([this.coursePath(), 'summary']);
      } else if (next) {
        await this.router.navigate([this.coursePath(), 'lessons', next.id]);
      } else if (result.nextLessonId) {
        // The last lesson, with earlier lessons still to do.
        this.toast.info(this.i18n.t('A few lessons are still open. Here is the next one.'));
        await this.router.navigate([this.coursePath(), 'lessons', result.nextLessonId]);
      } else {
        await this.router.navigate([this.coursePath(), 'summary']);
      }
    } catch (error) {
      this.toast.error(
        this.i18n.t((error as Error).message || 'Your progress could not be saved. Try again.'),
      );
    }
  }
}

/** Fence languages that get a Run button (the Coding Lab's languages). */
const RUNNABLE = new Map(CODE_LANGUAGES.flatMap((language) => language.fence.map((fence) => [fence, language.value] as const)));

/**
 * Split lesson text into rendered text and runnable examples: \`\`\`js and
 * \`\`\`javascript fences become examples; everything else renders as before.
 */
function textParts(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const pending: string[] = [];
  const flush = () => {
    if (pending.join('').trim()) {
      parts.push({ kind: 'html', html: renderKnowledgeContent(pending.join('\n')) });
    }
    pending.length = 0;
  };

  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const fence = /^\s*```\s*([A-Za-z]+)?\s*$/.exec(line);
    if (!fence) {
      pending.push(line);
      continue;
    }
    // Find the closing fence.
    let end = index + 1;
    while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;
    const language = RUNNABLE.get((fence[1] ?? '').toLowerCase());
    if (language && end < lines.length) {
      flush();
      const code = lines.slice(index + 1, end).join('\n');
      parts.push({
        kind: 'example',
        exercise: { language, title: '', instructions: '', starter: code, tests: [], hints: [], solution: '' },
      });
    } else {
      pending.push(...lines.slice(index, Math.min(end + 1, lines.length)));
    }
    index = end;
  }
  flush();
  return parts.length ? parts : [{ kind: 'html', html: renderKnowledgeContent(text) }];
}
