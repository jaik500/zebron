import { Component, DOCUMENT, DestroyRef, afterNextRender, computed, effect, inject, signal } from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import { Params, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { collection, getCountFromServer, query, where } from 'firebase/firestore';

import { firestore } from '../../../../core/services/firebase-config';
import { LocalizationService } from '../../../../core/services/localization.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

import { HomeText, homeText } from './home.i18n';
import { BlogService } from '../../../blog/blog.service';
import { BLOG_COVERS, BlogCover, BlogPost, blogDate, isBlogImageSource } from '../../../blog/blog.model';
import { POPULAR_SEARCHES, RESOURCE_NEEDS } from '../../../resources/resource-needs';

/** How many blog posts the home page shows. */
const HOME_BLOG_POSTS = 3;

/** Posts the live feed listens to (pinned ones are moved to the front). */
const BLOG_FEED_SIZE = 12;

/** A post counts as "New" for this many days after it is published. */
const NEW_POST_DAYS = 7;

/** Topics shown as quick links in the hero, with their icons. */
const HERO_TOPICS: { key: string; icon: string }[] = [
  { key: 'food', icon: 'restaurant' },
  { key: 'housing', icon: 'home' },
  { key: 'jobs', icon: 'work' },
  { key: 'bootcamps', icon: 'code' },
  { key: 'health', icon: 'local_hospital' },
  { key: 'mental-health', icon: 'psychology' },
  { key: 'legal', icon: 'gavel' },
  { key: 'education', icon: 'school' },
];

/** The cards in "Explore Zebron". Text comes from home.i18n.ts. */
const EXPLORE_CARDS: { route: string; icon: string; title: keyof HomeText; text: keyof HomeText; link: keyof HomeText }[] = [
  { route: '/resources', icon: 'explore', title: 'resourcesTitle', text: 'resourcesText', link: 'exploreResources' },
  { route: '/jobs', icon: 'work_outline', title: 'jobsTitle', text: 'jobsText', link: 'jobsLink' },
  { route: '/find/training', icon: 'school', title: 'trainingTitle', text: 'trainingText', link: 'trainingLink' },
  { route: '/blog', icon: 'article', title: 'blogCardTitle', text: 'blogCardText', link: 'blogCardLink' },
  { route: '/tax-calculator', icon: 'calculate', title: 'taxTitle', text: 'taxText', link: 'taxLink' },
  { route: '/organizations/apply', icon: 'business', title: 'organizationTitle', text: 'organizationText', link: 'organizationLink' },
];

interface HomeStat {
  label: keyof HomeText;
  icon: string;
  route: string;
  value: number;
}

@Component({
  selector: 'app-home',
  standalone: true,

  imports: [RouterLink, MatIconModule, RevealDirective],

  template: `
    <main class="overflow-x-clip">
      <!-- =========================================================
           HERO
           ========================================================= -->

      <section class="relative overflow-hidden bg-[#032D42]">
        <!-- Moving background: two drifting rings and a soft glow -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
          <div class="home-drift absolute -right-24 -top-24 h-72 w-72 rounded-full border-[40px] border-[#007979]/20"></div>
          <div class="home-drift-slow absolute -bottom-32 -left-24 h-80 w-80 rounded-full border-[50px] border-[#007979]/10"></div>
          <div class="home-glow absolute left-[calc(50%-12rem)] top-1/3 h-96 w-96 rounded-full bg-[#12BFC3]/10 blur-3xl"></div>
        </div>

        <div class="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8 lg:py-20">
          <div class="min-w-0">
            <!-- Live blog ticker: the newest post, updates by itself -->
            @if (latestPost(); as post) {
              <a
                [routerLink]="['/blog', post.id]"
                class="home-rise group mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3 text-xs text-white/85 backdrop-blur transition hover:border-[#12BFC3]/60 hover:bg-white/15"
                style="--rise-delay: 0ms"
              >
                <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#12BFC3] px-2 py-0.5 font-bold text-[#032D42]">
                  <span class="relative flex h-1.5 w-1.5">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#032D42] opacity-60 motion-reduce:animate-none"></span>
                    <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#032D42]"></span>
                  </span>
                  {{ isNew(post) ? t().blogNew : t().blogLatest }}
                </span>
                <span class="truncate">{{ post.title }}</span>
                <mat-icon aria-hidden="true" class="!m-0 !h-4 !w-4 shrink-0 !text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</mat-icon>
              </a>
            }

            <!-- Wordmark: the mirrored "e" is the brand treatment -->
            <div
              aria-label="Zebron"
              class="home-rise flex items-center text-7xl font-black leading-none text-white sm:text-8xl lg:text-[10rem]"
              style="--rise-delay: 60ms"
            >
              <span>Z</span>
              <span aria-hidden="true" class="home-e mx-[-0.01em] inline-block text-[#12BFC3]">e</span>
              <span>bron</span>
            </div>

            <h1
              class="home-rise mt-5 max-w-4xl text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl"
              style="--rise-delay: 140ms"
            >
              {{ t().heroTitle }}
            </h1>

            <p class="home-rise mt-6 max-w-3xl text-lg leading-8 text-white/80 sm:text-xl" style="--rise-delay: 220ms">
              {{ t().heroText }}
            </p>

            <!-- Search: goes straight to the resource directory -->
            <form
              role="search"
              (submit)="search($event, searchBox.value)"
              class="home-rise mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/20 ring-1 ring-white/10 focus-within:ring-4 focus-within:ring-[#12BFC3]/40"
              style="--rise-delay: 300ms"
            >
              <mat-icon aria-hidden="true" class="ml-2 shrink-0 !h-5 !w-5 !text-[20px] text-gray-400">search</mat-icon>
              <label for="home-search" class="sr-only">{{ t().searchLabel }}</label>
              <input
                #searchBox
                id="home-search"
                type="search"
                autocomplete="off"
                [placeholder]="t().searchTry + ' “' + example() + '”'"
                class="min-w-0 flex-1 bg-transparent py-2 text-base text-[#032D42] placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#007979] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#008989]"
              >
                <span class="hidden sm:inline">{{ t().searchButton }}</span>
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
              </button>
            </form>

            <!-- Actions -->
            <div class="home-rise mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style="--rise-delay: 420ms">
              <a
                routerLink="/resources"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-[#008989]"
              >
                {{ t().exploreResources }}
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
              </a>

              @if (signedOut()) {
                <a
                  routerLink="/register"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-[#032D42] shadow-lg shadow-black/10 transition hover:bg-[#E5F4F4]"
                >
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">person_add</mat-icon>
                  {{ t().register }}
                </a>

                <a
                  routerLink="/login"
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">login</mat-icon>
                  {{ t().signIn }}
                </a>
              } @else {
                <a
                  routerLink="/find"
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {{ t().findOpportunities }}
                </a>
              }

              <a
                routerLink="/blog"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">article</mat-icon>
                {{ t().blogLink }}
              </a>

              <a
                routerLink="/donate"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-[#65CFCF]/50 bg-[#65CFCF]/10 px-4 py-1.5 text-sm font-bold text-[#B9F0ED] transition hover:bg-[#65CFCF]/20"
              >
                {{ t().donate }}
              </a>
            </div>
          </div>

          <!-- Orbit of topics around the brand "e" (large screens) -->
          <div aria-hidden="true" class="relative mx-auto hidden aspect-square w-full max-w-sm lg:block">
            <div class="absolute inset-0 rounded-full border border-dashed border-white/15"></div>
            <div class="absolute inset-[18%] rounded-full border border-white/10"></div>

            <div class="home-orbit absolute inset-0">
              @for (topic of heroTopics; track topic.key; let i = $index) {
                <div class="absolute left-1/2 top-1/2 h-0 w-0" [style.transform]="'rotate(' + i * 45 + 'deg) translateY(-11.5rem)'">
                  <div [style.transform]="'rotate(' + -i * 45 + 'deg)'">
                    <div class="home-orbit-counter -ml-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-[#0b3b52] shadow-lg shadow-black/20">
                      <mat-icon class="!text-[22px] text-[#65CFCF]">{{ topic.icon }}</mat-icon>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="absolute inset-[30%] grid place-items-center rounded-full bg-[#007979] shadow-2xl shadow-[#12BFC3]/30">
              <span class="home-pulse absolute inset-0 rounded-full bg-[#12BFC3]/30"></span>
              <!-- A lowercase "e" sits low in its line box; the nudge centres it in the circle. -->
              <span class="relative block h-[1em] text-8xl font-black leading-[1em] text-white" style="transform: translateY(-0.1em) scaleX(-1)">e</span>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           LIVE NUMBERS
           ========================================================= -->

      @if (stats().length) {
        <section class="relative z-10 -mt-8 px-5 sm:px-6 lg:px-8">
          <div appReveal class="reveal-group mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-4">
            @for (stat of stats(); track stat.label) {
              <a [routerLink]="stat.route" class="group flex items-center gap-3 bg-white px-4 py-4 transition hover:bg-[#F2FAFA] sm:px-5">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F4] text-[#007979] transition group-hover:bg-[#007979] group-hover:text-white">
                  <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-[20px]">{{ stat.icon }}</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-2xl font-extrabold tabular-nums leading-tight text-[#032D42]">{{ shown(stat) }}</span>
                  <span class="block truncate text-xs font-medium text-gray-500">{{ t()[stat.label] }}</span>
                </span>
              </a>
            }
          </div>
        </section>
      }

      <!-- =========================================================
           EXPLORE ZEBRON
           ========================================================= -->

      <section class="bg-white">
        <div class="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div appReveal class="max-w-2xl">
            <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ t().exploreEyebrow }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-[#032D42]">{{ t().exploreTitle }}</h2>
            <p class="mt-4 text-sm leading-6 text-gray-600 sm:text-base">{{ t().exploreText }}</p>
          </div>

          <div appReveal class="reveal-group mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            @for (card of exploreCards; track card.route) {
              <a
                [routerLink]="card.route"
                class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-[#E5F4F4] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#007979]/40 hover:shadow-lg"
              >
                <!-- Sheen that sweeps across on hover -->
                <span aria-hidden="true" class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-150"></span>

                <div class="relative flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white transition duration-300 group-hover:rotate-[-6deg] group-hover:bg-[#007979]">
                    <mat-icon aria-hidden="true" class="!text-[#007979] transition group-hover:!text-white">{{ card.icon }}</mat-icon>
                  </div>
                  <h3 class="min-w-0 text-xl font-bold text-[#032D42]">{{ t()[card.title] }}</h3>
                </div>

                <p class="relative mt-4 text-sm leading-6 text-gray-600">{{ t()[card.text] }}</p>

                <span class="relative mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#007979]">
                  {{ t()[card.link] }}
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[17px] transition-transform group-hover:translate-x-1">arrow_forward</mat-icon>
                </span>
              </a>
            }
          </div>

          <div class="mt-8 flex justify-center">
            <a
              routerLink="/apps"
              class="inline-flex items-center gap-2 rounded-xl border border-[#007979]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#007979] shadow-sm transition hover:border-[#007979] hover:bg-[#E5F4F4]"
            >
              <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">apps</mat-icon>
              {{ t().allAppsLink }}
            </a>
          </div>
        </div>
      </section>

      <!-- =========================================================
           HOW IT WORKS
           ========================================================= -->

      <section class="bg-gray-50">
        <div class="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-14 lg:px-8">
          <div appReveal class="text-center">
            <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ t().howEyebrow }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-[#032D42]">{{ t().howTitle }}</h2>
          </div>

          <div appReveal class="reveal-group relative mt-12 grid gap-8 md:grid-cols-3">
            <!-- Dashed line joining the steps -->
            <div aria-hidden="true" class="absolute left-[16.66%] right-[16.66%] top-6 hidden border-t-2 border-dashed border-[#007979]/30 md:block"></div>

            @for (step of steps(); track step.number) {
              <div class="relative text-center">
                <div
                  class="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ring-8 ring-gray-50 {{ step.number === 3 ? 'bg-[#007979]' : 'bg-[#032D42]' }}"
                >
                  @if (step.number === 3) {
                    <span aria-hidden="true" class="home-pulse absolute inset-0 rounded-full bg-[#12BFC3]/40"></span>
                  }
                  <span class="relative">{{ step.number }}</span>
                </div>
                <h3 class="mt-5 text-lg font-bold text-[#032D42]">{{ step.title }}</h3>
                <p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600">{{ step.text }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- =========================================================
           VALUE
           ========================================================= -->

      <section class="bg-white">
        <div class="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-14 lg:px-8">
          <div class="grid items-center gap-10 lg:grid-cols-2">
            <div appReveal>
              <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ t().valueEyebrow }}</p>
              <h2 class="mt-2 text-3xl font-bold tracking-tight text-[#032D42] sm:text-4xl">{{ t().valueTitle }}</h2>
              <p class="mt-5 text-sm leading-7 text-gray-600 sm:text-base">{{ t().valueText }}</p>
              <div class="mt-7">
                <a routerLink="/resources" class="inline-flex items-center gap-2 text-sm font-bold text-[#007979] hover:underline">
                  {{ t().startExploring }}
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
                </a>
              </div>
            </div>

            <div appReveal class="relative min-h-[280px] overflow-hidden rounded-2xl bg-[#032D42] p-7">
              <div aria-hidden="true" class="home-drift absolute -right-16 -top-16 h-48 w-48 rounded-full border-[28px] border-[#007979]/30"></div>

              <div class="relative grid gap-3">
                @for (row of valueRows(); track row.route; let i = $index) {
                  <a
                    [routerLink]="row.route"
                    class="home-bob group block rounded-xl border border-white/10 bg-white/10 p-4 transition hover:border-[#12BFC3]/60 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#12BFC3]"
                    [class.ml-8]="i === 1"
                    [class.ml-16]="i === 2"
                    [style.animation-delay]="i * 0.8 + 's'"
                  >
                    <div class="flex items-center gap-3">
                      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#007979]">
                        <mat-icon aria-hidden="true" class="!text-white">{{ row.icon }}</mat-icon>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs text-white/50">{{ row.step }}</p>
                        <p class="text-sm font-semibold text-white">{{ row.title }}</p>
                      </div>
                      <mat-icon aria-hidden="true" class="!text-white/40 transition group-hover:translate-x-0.5 group-hover:!text-white">arrow_forward</mat-icon>
                    </div>
                  </a>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           FROM THE BLOG (live: new posts appear without a refresh)
           ========================================================= -->

      @if (blogLoading() || blogPosts().length) {
        <section class="bg-gray-50" aria-labelledby="home-blog-title">
          <div class="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-14 lg:px-8">
            <div appReveal class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#007979]">
                  {{ t().blogEyebrow }}
                  <span class="inline-flex items-center gap-1 rounded-full bg-[#007979]/10 px-2 py-0.5 text-[10px] tracking-wider">
                    <span class="relative flex h-1.5 w-1.5">
                      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#007979] opacity-60 motion-reduce:animate-none"></span>
                      <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#007979]"></span>
                    </span>
                    {{ t().blogLive }}
                  </span>
                </p>
                <h2 id="home-blog-title" class="mt-2 text-3xl font-bold tracking-tight text-[#032D42]">{{ t().blogTitle }}</h2>
                <p class="mt-2 text-sm text-gray-600">{{ t().blogText }}</p>
              </div>
              <a
                routerLink="/blog"
                class="inline-flex items-center gap-2 rounded-xl bg-[#032D42] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b3b52]"
              >
                {{ t().blogViewAll }}
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
              </a>
            </div>

            <div class="mt-8 grid gap-5 md:grid-cols-3" aria-live="polite">
              @if (blogLoading()) {
                @for (item of [1, 2, 3]; track item) {
                  <div class="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white"></div>
                }
              } @else {
                @for (post of blogPosts(); track post.id) {
                  <a
                    [routerLink]="['/blog', post.id]"
                    class="home-pop group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007979]/40"
                  >
                    <div class="relative h-40 overflow-hidden" aria-hidden="true">
                      <div class="absolute inset-0 transition-transform duration-500 group-hover:scale-105" [style.background]="cover(post.cover)">
                        @if (photo(post); as src) {
                          <img [src]="src" alt="" loading="lazy" decoding="async" class="h-full w-full object-cover" />
                        }
                      </div>
                      <div class="absolute left-3 top-3 flex gap-1.5">
                        @if (post.pinned) {
                          <span class="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#007979]">{{ t().blogPinned }}</span>
                        }
                        @if (isNew(post)) {
                          <span class="rounded-full bg-[#12BFC3] px-2 py-0.5 text-[11px] font-bold text-[#032D42]">{{ t().blogNew }}</span>
                        }
                      </div>
                    </div>
                    <div class="flex flex-1 flex-col gap-2 p-5">
                      <span class="text-[11px] font-bold uppercase tracking-wider text-[#007979]">{{ post.topic }}</span>
                      <h3 class="text-lg font-bold leading-snug text-[#032D42] group-hover:text-[#007979]">{{ post.title }}</h3>
                      @if (post.excerpt) {
                        <p class="line-clamp-2 text-sm text-gray-600">{{ post.excerpt }}</p>
                      }
                      <p class="mt-auto pt-2 text-xs text-gray-500">
                        {{ post.authorName }} · {{ postDate(post) }} · {{ post.readingMinutes }} {{ t().minRead }}
                      </p>
                    </div>
                  </a>
                }
              }
            </div>
          </div>
        </section>
      }

      <!-- =========================================================
           ORGANIZATION CTA (the Support Zebron band sits inside it on purpose)
           ========================================================= -->

      <section class="bg-[#E5F4F4]">
        <div appReveal class="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div class="max-w-2xl">
            <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ t().forOrganizations }}</p>
            <h2 class="mt-2 text-2xl font-bold tracking-tight text-[#032D42]">{{ t().forOrganizationsTitle }}</h2>
            <p class="mt-3 text-sm leading-6 text-gray-600">{{ t().forOrganizationsText }}</p>
          </div>

          <a
            routerLink="/submit"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007979] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#006666]"
          >
            {{ t().addResource }}
            <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
          </a>

          <!-- SUPPORT ZEBRON -->
          <section class="relative overflow-hidden bg-[#032D42]">
            <div aria-hidden="true" class="home-drift-slow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[36px] border-[#007979]/20"></div>

            <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-10 lg:px-8">
              <div class="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                <div class="max-w-2xl">
                  <p class="text-sm font-bold uppercase tracking-wider text-[#65CFCF]">{{ t().supportZebron }}</p>
                  <h2 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{{ t().supportTitle }}</h2>
                  <p class="mt-3 text-sm leading-6 text-white/70 sm:text-base">{{ t().supportText }}</p>
                </div>

                <a
                  routerLink="/donate"
                  class="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007979] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#008989]"
                >
                  {{ t().supportZebron }}
                  <mat-icon aria-hidden="true" class="home-heart !m-0 !h-5 !w-5 !text-[18px]">favorite</mat-icon>
                </a>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  `,

  styles: [
    `
      /* Hero entrance: each piece rises in after the one before. */
      .home-rise {
        animation: home-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        animation-delay: var(--rise-delay, 0ms);
      }
      @keyframes home-rise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: none; }
      }

      /* The mirrored brand "e" with a gentle wobble now and then. */
      .home-e {
        transform: scaleX(-1);
        animation: home-e 6s ease-in-out 1.2s infinite;
      }
      @keyframes home-e {
        0%, 86%, 100% { transform: scaleX(-1) rotate(0); }
        90% { transform: scaleX(-1) rotate(-10deg); }
        94% { transform: scaleX(-1) rotate(6deg); }
      }

      /* Background rings drift; the glow breathes. */
      .home-drift { animation: home-drift 14s ease-in-out infinite alternate; }
      .home-drift-slow { animation: home-drift 22s ease-in-out infinite alternate-reverse; }
      @keyframes home-drift {
        from { transform: translate(0, 0) rotate(0); }
        to { transform: translate(-24px, 18px) rotate(12deg); }
      }
      .home-glow { animation: home-glow 8s ease-in-out infinite alternate; }
      @keyframes home-glow {
        from { opacity: 0.5; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1.1); }
      }

      /* Topic icons circle the "e"; each icon turns back so it stays upright. */
      .home-orbit { animation: home-spin 60s linear infinite; }
      .home-orbit-counter { animation: home-spin 60s linear infinite reverse; }
      @keyframes home-spin { to { transform: rotate(360deg); } }

      .home-pulse { animation: home-pulse 2.8s ease-out infinite; }
      @keyframes home-pulse {
        from { opacity: 0.8; transform: scale(1); }
        to { opacity: 0; transform: scale(1.6); }
      }

      .home-bob { animation: home-bob 5s ease-in-out infinite; }
      @keyframes home-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      /* A blog card that arrives in the live feed pops in. */
      .home-pop { animation: home-pop 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
      @keyframes home-pop {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }

      .group:hover .home-heart { animation: home-heart 0.8s ease-in-out infinite; }
      @keyframes home-heart {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.25); }
      }

      /* Scroll reveal (see RevealDirective). */
      .reveal:not(.reveal-group) {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .reveal.reveal-group > * {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .reveal.is-visible:not(.reveal-group),
      .reveal.is-visible.reveal-group > * {
        opacity: 1;
        transform: none;
      }
      .reveal-group > *:nth-child(2) { transition-delay: 80ms; }
      .reveal-group > *:nth-child(3) { transition-delay: 160ms; }
      .reveal-group > *:nth-child(4) { transition-delay: 240ms; }
      .reveal-group > *:nth-child(5) { transition-delay: 320ms; }
      .reveal-group > *:nth-child(6) { transition-delay: 400ms; }
      .reveal-group > *:nth-child(7) { transition-delay: 480ms; }

      /* Respect "reduce motion": everything shows, nothing moves. */
      @media (prefers-reduced-motion: reduce) {
        .home-rise, .home-e, .home-drift, .home-drift-slow, .home-glow, .home-orbit,
        .home-orbit-counter, .home-pulse, .home-bob, .home-pop, .home-heart {
          animation: none !important;
        }
        .home-e { transform: scaleX(-1); }
        .reveal:not(.reveal-group), .reveal.reveal-group > * {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `,
  ],
})
export class HomeComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================
  // LANGUAGE
  // =========================================================

  private readonly localization = inject(LocalizationService);
  private readonly auth = inject(AuthService);

  /** Show Create account / Sign in only to visitors who aren't signed in. */
  protected readonly signedOut = computed(() => !this.auth.isLoading() && !this.auth.firebaseUser());

  /** Page text in the selected language (English fallback). */
  protected readonly t = computed(() => homeText(this.localization.language()));

  // =========================================================
  // HERO
  // =========================================================

  protected readonly heroTopics = HERO_TOPICS.flatMap(({ key, icon }) => {
    const need = RESOURCE_NEEDS.find((item) => item.key === key);
    if (!need) {
      return [];
    }
    return [
      {
        key,
        icon,
        title: need.title.replace(/ and Income$/, ''),
        link: need.route ?? '/resources',
        query: (need.route ? {} : { topic: need.key }) as Params,
      },
    ];
  });

  protected readonly exploreCards = EXPLORE_CARDS;

  /** Search placeholder example; changes every few seconds. */
  protected readonly example = signal(POPULAR_SEARCHES[0]);

  protected readonly steps = computed(() => [
    { number: 1, title: this.t().discover, text: this.t().discoverText },
    { number: 2, title: this.t().explore, text: this.t().exploreStepText },
    { number: 3, title: this.t().connect, text: this.t().connectText },
  ]);

  protected readonly valueRows = computed(() => [
    { route: '/resources', icon: 'explore', step: this.t().discover, title: this.t().resourcesServices },
    { route: '/find/training', icon: 'school', step: this.t().explore, title: this.t().trainingEducation },
    { route: '/find/job', icon: 'work_outline', step: this.t().connect, title: this.t().jobsOpportunities },
  ]);

  protected search(event: Event, text: string): void {
    event.preventDefault();
    const q = text.trim();
    void this.router.navigate(['/resources'], { queryParams: q ? { q, all: '1' } : {} });
  }

  // =========================================================
  // LIVE NUMBERS
  // =========================================================

  protected readonly stats = signal<HomeStat[]>([]);

  /** 0 → 1 while the numbers count up. */
  private readonly progress = signal(0);

  protected shown(stat: HomeStat): string {
    return Math.round(stat.value * this.progress()).toLocaleString(this.localization.language() === 'fr' ? 'fr-FR' : 'en-US');
  }

  private async loadStats(): Promise<void> {
    const count = async (name: string, field?: string, value?: string): Promise<number> => {
      try {
        const ref = collection(firestore, name);
        const snapshot = await getCountFromServer(field ? query(ref, where(field, '==', value)) : ref);
        return snapshot.data().count;
      } catch {
        return 0;
      }
    };

    const [resources, jobs, bootcamps] = await Promise.all([
      count('resources', 'status', 'published'),
      count('jobs', 'status', 'active'),
      count('bootcamps'),
    ]);

    const all: HomeStat[] = [
      { label: 'statResources', icon: 'volunteer_activism', route: '/resources', value: resources },
      { label: 'statJobs', icon: 'work', route: '/jobs', value: jobs },
      { label: 'statBootcamps', icon: 'code', route: '/bootcamps', value: bootcamps },
      { label: 'statTopics', icon: 'category', route: '/resources', value: RESOURCE_NEEDS.length },
    ];

    // Only show numbers we could actually load.
    this.stats.set(all.filter((stat) => stat.value > 0));
    this.countUp();
  }

  private countUp(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.progress.set(1);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    const step = (now: number) => {
      const linear = Math.min(1, (now - start) / duration);
      this.progress.set(1 - Math.pow(1 - linear, 3)); // ease out
      if (linear < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  // =========================================================
  // FROM THE BLOG (live)
  // =========================================================

  private readonly blog = inject(BlogService);

  protected readonly blogPosts = signal<BlogPost[]>([]);
  protected readonly blogLoading = signal(true);

  /** Newest post by date, for the ticker in the hero. */
  protected readonly latestPost = signal<BlogPost | null>(null);

  constructor() {
    // Re-applies the title and description when the language changes.
    effect(() => this.updateSeoMetadata());

    // Browser only, so server rendering never waits on Firestore.
    afterNextRender(() => {
      this.watchBlog();
      void this.loadStats();

      let index = 0;
      const timer = window.setInterval(() => {
        index = (index + 1) % POPULAR_SEARCHES.length;
        this.example.set(POPULAR_SEARCHES[index]);
      }, 2800);
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    });
  }

  /** Pinned posts first, then the newest; updates as posts are published. */
  private watchBlog(): void {
    const stop = this.blog.watchPublished(
      { section: 'public', organizationId: null, basePath: '/blog' },
      BLOG_FEED_SIZE,
      (posts) => {
        this.latestPost.set(posts[0] ?? null);
        this.blogPosts.set([...posts.filter((post) => post.pinned), ...posts.filter((post) => !post.pinned)].slice(0, HOME_BLOG_POSTS));
        this.blogLoading.set(false);
      },
      () => {
        // The section stays hidden if the blog can't be reached.
        this.blogPosts.set([]);
        this.blogLoading.set(false);
      },
    );
    this.destroyRef.onDestroy(stop);
  }

  protected isNew(post: BlogPost): boolean {
    const published = post.publishedAt?.toMillis?.();
    return !!published && Date.now() - published < NEW_POST_DAYS * 24 * 60 * 60 * 1000;
  }

  protected photo(post: BlogPost): string | null {
    return isBlogImageSource(post.coverImage) ? post.coverImage : null;
  }

  protected cover(cover: BlogCover): string {
    return BLOG_COVERS[cover] ?? BLOG_COVERS.teal;
  }

  protected postDate(post: BlogPost): string {
    return blogDate(post.publishedAt, this.localization.language() === 'fr' ? 'fr-FR' : 'en-US');
  }

  // =========================================================
  // SEO METADATA
  // =========================================================

  private updateSeoMetadata(): void {
    const pageTitle = this.t().seoTitle;
    const description = this.t().seoDescription;
    const canonicalUrl = 'https://zebron.org/';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:site_name', content: 'Zebron' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    this.setCanonical(canonicalUrl);
  }

  private setCanonical(url: string): void {
    const existing = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (existing) {
      existing.setAttribute('href', url);
      return;
    }
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }
}
