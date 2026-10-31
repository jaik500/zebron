import { Component, DOCUMENT, afterNextRender, computed, effect, inject, signal } from '@angular/core';
 
import { Meta, Title } from '@angular/platform-browser';
 
import { RouterLink } from '@angular/router';
 
import { MatIconModule } from '@angular/material/icon';

import { LocalizationService } from '../../../../core/services/localization.service';
import { AuthService } from '../../../../core/services/auth.service';

import { homeText } from './home.i18n';
import { BlogService } from '../../../blog/blog.service';
import { BLOG_COVERS, BlogCover, BlogPost, blogDate } from '../../../blog/blog.model';

/** How many blog posts the home page shows. */
const HOME_BLOG_POSTS = 3;
 
@Component({
  selector: 'app-home',
  standalone: true,
 
  imports: [RouterLink, MatIconModule],
 
  template: `
    <!-- =========================================================
         HERO
         ========================================================= -->
 
    <main>
      <section
        class="relative overflow-hidden
               bg-[#032D42]"
      >
        <!-- Decorative background -->
 
        <div
          aria-hidden="true"
          class="absolute -right-24 -top-24
                 h-72 w-72 rounded-full
                 border-[40px]
                 border-[#007979]/20"
        ></div>
 
        <div
          aria-hidden="true"
          class="absolute -bottom-32 -left-24
                 h-80 w-80 rounded-full
                 border-[50px]
                 border-[#007979]/10"
        ></div>
 
        <div
          class="relative mx-auto max-w-7xl
                 px-5 py-20
                 sm:px-6 sm:py-24
                 lg:px-8 lg:py-20"
        >
          <div class="max-w-3xl">
            <div class="max-w-5xl">
              <!-- =================================================
             ZEBRON WORDMARK
 
             The mirrored lowercase "e" is the visual brand
             treatment. aria-label preserves accessibility.
             ================================================= -->
 
              <div
                aria-label="Zebron"
                class="flex items-center
                 text-7xl
                 font-black
                 leading-none
                 text-white
                 sm:text-8xl
                 lg:text-[10rem]"
              >
                <span>Z</span>
 
                <span
                  aria-hidden="true"
                  class="mx-[-0.01em] inline-block
                   text-[#12BFC3]"
                  style="transform: scaleX(-1);"
                >
                  e
                </span>
 
                <span>bron</span>
              </div>
 
              <!-- =================================================
             HERO HEADLINE
             ================================================= -->
 
              <h1
                class="mt-5
                 max-w-4xl
                 text-3xl
                 font-extrabold
                 leading-[1.08]
                 tracking-tight
                 text-white
                 sm:text-4xl
                 lg:text-5xl"
              >
                {{ t().heroTitle }}
              </h1>
 
              <!-- =================================================
             HERO DESCRIPTION
             ================================================= -->
 
              <p
                class="mt-6
                 max-w-3xl
                 text-lg
                 leading-8
                 text-white/80
                 sm:text-xl"
              >
                {{ t().heroText }}
              </p>
 
              <!-- =================================================
             HERO ACTIONS
             ================================================= -->
            </div>
 
            <!-- Primary actions -->
 
            <div
              class="mt-9 flex flex-col gap-3
         sm:flex-row"
            >
              <a
                routerLink="/resources"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           bg-[#007979]
           px-4 py-1.5
           text-sm font-bold
           text-white
           shadow-lg shadow-black/10
           transition
           hover:bg-[#008989]"
              >
                {{ t().exploreResources }}
 
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">
                  arrow_forward
                </mat-icon>
              </a>
 
              @if (signedOut()) {
                <a
                  routerLink="/register"
                  class="inline-flex items-center
             justify-center gap-2
             rounded-lg
             bg-white
             px-4 py-1.5
             text-sm font-bold
             text-[#032D42]
             shadow-lg shadow-black/10
             transition
             hover:bg-[#E5F4F4]"
                >
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">person_add</mat-icon>
                  {{ t().register }}
                </a>

                <a
                  routerLink="/login"
                  class="inline-flex items-center
             justify-center gap-2
             rounded-lg
             border border-white/25
             bg-white/5
             px-4 py-1.5
             text-sm font-bold
             text-white
             transition
             hover:bg-white/10"
                >
                  <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">login</mat-icon>
                  {{ t().signIn }}
                </a>
              } @else {
              <a
                routerLink="/find"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           border border-white/25
           bg-white/5
           px-4 py-1.5
           text-sm font-bold
           text-white
           transition
           hover:bg-white/10"
              >
                {{ t().findOpportunities }}
              </a>
              }
 
              <a
                routerLink="/donate"
                class="inline-flex items-center
           justify-center gap-2
           rounded-lg
           border border-[#65CFCF]/50
           bg-[#65CFCF]/10
           px-4 py-1.5
           text-sm font-bold
           text-[#B9F0ED]
           transition
           hover:bg-[#65CFCF]/20"
              >
                {{ t().donate }}
              </a>
            </div>
          </div>
        </div>
      </section>
 
      <!-- =======================================================
           EXPLORE ZEBRON
           ======================================================= -->
 
      <section class="bg-white">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-20
                 lg:px-8"
        >
          <div class="max-w-2xl">
            <p
              class="text-sm font-bold uppercase
                     tracking-wider
                     text-[#007979]"
            >
              {{ t().exploreEyebrow }}
            </p>
 
            <h2
              class="mt-2 text-3xl font-bold
                     tracking-tight
                     text-[#032D42]"
            >
              {{ t().exploreTitle }}
            </h2>
 
            <p
              class="mt-4 text-sm leading-6
                     text-gray-600
                     sm:text-base"
            >
              {{ t().exploreText }}
            </p>
          </div>
 
          <div
            class="mt-10 grid gap-5
                   md:grid-cols-3"
          >
            <!-- Resources -->
 
            <a
              routerLink="/resources"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> explore </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().resourcesTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().resourcesText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().exploreResources }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Jobs -->
 
            <a
              routerLink="/find/job"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> work_outline </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().jobsTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().jobsText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().jobsLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Training -->
 
            <a
              routerLink="/find/training"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]">
                  school
                  </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().trainingTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().trainingText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().trainingLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Test Center -->
 
            <a
              routerLink="/test-center"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> quiz </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().testCenterTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().testCenterText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().testCenterLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Community -->
 
            <a
              routerLink="/community"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]">
                  diversity_3
                  </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().communityTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().communityText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().communityLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Tax & Pay Calculator -->
 
            <a
              routerLink="/tax-calculator"
              class="group rounded-2xl
                     border border-gray-200
                     bg-[#E5F4F4] p-6
                     shadow-sm
                     transition
                     hover:-translate-y-1
                     hover:border-[#007979]/40
                     hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]">
                  calculate
                  </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().taxTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
                       text-gray-600"
              >
                {{ t().taxText }}
              </p>
 
              <span
                class="mt-5 inline-flex
                       items-center gap-1
                       text-sm font-bold
                       text-[#007979]"
              >
                {{ t().taxLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
                         !text-[17px]
                         transition-transform
                         group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
 
            <!-- Organization Application -->
            <a
              routerLink="/organizations/apply"
              class="group rounded-2xl
         border border-gray-200
         bg-[#E5F4F4] p-6
         shadow-sm
         transition
         hover:-translate-y-1
         hover:border-[#007979]/40
         hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-12 w-12 shrink-0
                         items-center justify-center
                         rounded-xl
                         bg-white"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> business </mat-icon>
                </div>
 
                <h3
                  class="min-w-0 text-xl font-bold
                         text-[#032D42]"
                >
                  {{ t().organizationTitle }}
                </h3>
              </div>
 
              <p
                class="mt-4 text-sm leading-6
           text-gray-600"
              >
                {{ t().organizationText }}
              </p>
 
              <span
                class="mt-5 inline-flex
           items-center gap-1
           text-sm font-bold
           text-[#007979]"
              >
                {{ t().organizationLink }}
 
                <mat-icon
                  aria-hidden="true"
                  class="!m-0 !h-5 !w-5
             !text-[17px]
             transition-transform
             group-hover:translate-x-1"
                >
                  arrow_forward
                </mat-icon>
              </span>
            </a>
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
 
      <!-- =======================================================
           HOW IT WORKS
           ======================================================= -->
 
      <section class="bg-gray-50">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-10
                 lg:px-8"
        >
          <div class="text-center">
            <p
              class="text-sm font-bold uppercase
                     tracking-wider
                     text-[#007979]"
            >
              {{ t().howEyebrow }}
            </p>
 
            <h2
              class="mt-2 text-3xl font-bold
                     tracking-tight
                     text-[#032D42]"
            >
              {{ t().howTitle }}
            </h2>
          </div>
 
          <div
            class="mt-12 grid gap-8
                   md:grid-cols-3"
          >
            <!-- Step 1 -->
 
            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#032D42]
                       text-lg font-bold
                       text-white"
              >
                1
              </div>
 
              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                {{ t().discover }}
              </h3>
 
              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                {{ t().discoverText }}
              </p>
            </div>
 
            <!-- Step 2 -->
 
            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#032D42]
                       text-lg font-bold
                       text-white"
              >
                2
              </div>
 
              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                {{ t().explore }}
              </h3>
 
              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                {{ t().exploreStepText }}
              </p>
            </div>
 
            <!-- Step 3 -->
 
            <div class="text-center">
              <div
                class="mx-auto flex h-12 w-12
                       items-center justify-center
                       rounded-full
                       bg-[#007979]
                       text-lg font-bold
                       text-white"
              >
                3
              </div>
 
              <h3
                class="mt-5 text-lg font-bold
                       text-[#032D42]"
              >
                {{ t().connect }}
              </h3>
 
              <p
                class="mx-auto mt-2 max-w-xs
                       text-sm leading-6
                       text-gray-600"
              >
                {{ t().connectText }}
              </p>
            </div>
          </div>
        </div>
      </section>
 
      <!-- =======================================================
           FEATURED / VALUE SECTION
           ======================================================= -->
 
      <section class="bg-white">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-16
                 sm:px-6 sm:py-10
                 lg:px-8"
        >
          <div
            class="grid items-center gap-10
                   lg:grid-cols-2"
          >
            <div>
              <p
                class="text-sm font-bold uppercase
                       tracking-wider
                       text-[#007979]"
              >
                {{ t().valueEyebrow }}
              </p>
 
              <h2
                class="mt-2 text-3xl font-bold
                       tracking-tight
                       text-[#032D42]
                       sm:text-4xl"
              >
                {{ t().valueTitle }}
              </h2>
 
              <p
                class="mt-5 text-sm leading-7
                       text-gray-600
                       sm:text-base"
              >
                {{ t().valueText }}
              </p>
 
              <div class="mt-7">
                <a
                  routerLink="/resources"
                  class="inline-flex items-center
                         gap-2 text-sm font-bold
                         text-[#007979]
                         hover:underline"
                >
                  {{ t().startExploring }}
 
                  <mat-icon
                    aria-hidden="true"
                    class="!m-0 !h-5 !w-5
                           !text-[18px]"
                  >
                    arrow_forward
                  </mat-icon>
                </a>
              </div>
            </div>
 
            <!-- Visual -->
 
            <div
              class="relative min-h-[280px]
                     overflow-hidden rounded-2xl
                     bg-[#032D42] p-7"
            >
              <div
                aria-hidden="true"
                class="absolute -right-16 -top-16
                       h-48 w-48 rounded-full
                       border-[28px]
                       border-[#007979]/30"
              ></div>
 
              <div class="relative grid gap-3">
                <a
                  routerLink="/resources"
                  class="group block rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4 transition
                         hover:border-[#12BFC3]/60 hover:bg-white/15
                         focus:outline-none focus:ring-2 focus:ring-[#12BFC3]"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> explore </mat-icon>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        {{ t().discover }}
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        {{ t().resourcesServices }}
                      </p>
                    </div>

                    <mat-icon
                      aria-hidden="true"
                      class="!text-white/40 transition group-hover:translate-x-0.5 group-hover:!text-white"
                    >
                      arrow_forward
                    </mat-icon>
                  </div>
                </a>
 
                <a
                  routerLink="/find/training"
                  class="ml-8 group block rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4 transition
                         hover:border-[#12BFC3]/60 hover:bg-white/15
                         focus:outline-none focus:ring-2 focus:ring-[#12BFC3]"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> school </mat-icon>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        {{ t().explore }}
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        {{ t().trainingEducation }}
                      </p>
                    </div>

                    <mat-icon
                      aria-hidden="true"
                      class="!text-white/40 transition group-hover:translate-x-0.5 group-hover:!text-white"
                    >
                      arrow_forward
                    </mat-icon>
                  </div>
                </a>
 
                <a
                  routerLink="/find/job"
                  class="ml-16 group block rounded-xl
                         border border-white/10
                         bg-white/10
                         p-4 transition
                         hover:border-[#12BFC3]/60 hover:bg-white/15
                         focus:outline-none focus:ring-2 focus:ring-[#12BFC3]"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0
                             items-center justify-center
                             rounded-lg
                             bg-[#007979]"
                    >
                      <mat-icon aria-hidden="true" class="!text-white"> work_outline </mat-icon>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p
                        class="text-xs
                               text-white/50"
                      >
                        {{ t().connect }}
                      </p>

                      <p
                        class="text-sm font-semibold
                               text-white"
                      >
                        {{ t().jobsOpportunities }}
                      </p>
                    </div>

                    <mat-icon
                      aria-hidden="true"
                      class="!text-white/40 transition group-hover:translate-x-0.5 group-hover:!text-white"
                    >
                      arrow_forward
                    </mat-icon>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      <!-- =======================================================
           FROM THE BLOG (latest public posts, loaded in the browser)
           ======================================================= -->

      @if (blogLoading() || blogPosts().length) {
        <section class="bg-gray-50" aria-labelledby="home-blog-title">
          <div class="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-10 lg:px-8">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ t().blogEyebrow }}</p>
                <h2 id="home-blog-title" class="mt-2 text-3xl font-bold tracking-tight text-[#032D42]">{{ t().blogTitle }}</h2>
                <p class="mt-2 text-sm text-gray-600">{{ t().blogText }}</p>
              </div>
              <a routerLink="/blog" class="inline-flex items-center gap-2 text-sm font-bold text-[#007979] hover:underline">
                {{ t().blogViewAll }}
                <mat-icon aria-hidden="true" class="!m-0 !h-5 !w-5 !text-[18px]">arrow_forward</mat-icon>
              </a>
            </div>

            <div class="mt-8 grid gap-5 md:grid-cols-3">
              @if (blogLoading()) {
                @for (item of [1, 2, 3]; track item) {
                  <div class="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white"></div>
                }
              } @else {
                @for (post of blogPosts(); track post.id) {
                  <a
                    [routerLink]="['/blog', post.id]"
                    class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007979]/40"
                  >
                    <div class="relative h-32" [style.background]="cover(post.cover)" aria-hidden="true">
                      @if (post.pinned) {
                        <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#007979]">
                          {{ t().blogPinned }}
                        </span>
                      }
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

      <!-- =======================================================
           ORGANIZATION CTA
           ======================================================= -->
 
       <section class="bg-[#E5F4F4]">
        <div
          class="mx-auto max-w-7xl
                 px-5 py-10
                 sm:px-6
                 lg:px-8"
        >
          <div
            class="flex flex-col gap-6
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >
            <div class="max-w-2xl">
              <p
                class="text-sm font-bold uppercase
                       tracking-wider
                       text-[#007979]"
              >
                {{ t().forOrganizations }}
              </p>

              <h2
                class="mt-2 text-2xl font-bold
                       tracking-tight
                       text-[#032D42]"
              >
                {{ t().forOrganizationsTitle }}
              </h2>

              <p
                class="mt-3 text-sm leading-6
                       text-gray-600"
              >
                {{ t().forOrganizationsText }}
              </p>
            </div>

            <a
              routerLink="/submit"
              class="inline-flex shrink-0
                     items-center justify-center
                     gap-2 rounded-lg
                     bg-[#007979]
                     px-5 py-3
                     text-sm font-bold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]"
            >
              {{ t().addResource }}

              <mat-icon
                aria-hidden="true"
                class="!m-0 !h-5 !w-5
                       !text-[18px]"
              >
                arrow_forward
              </mat-icon>
            </a>

            <!-- =======================================================
     SUPPORT ZEBRON
     ======================================================= -->

            <section class="bg-[#032D42]">
              <div
                class="mx-auto max-w-7xl
           px-5 py-14
           sm:px-6 sm:py-10
           lg:px-8"
              >
                <div
                  class="flex flex-col gap-7
             md:flex-row
             md:items-center
             md:justify-between"
                >
                  <div class="max-w-2xl">
                    <p
                      class="text-sm font-bold uppercase
                 tracking-wider
                 text-[#65CFCF]"
                    >
                      {{ t().supportZebron }}
                    </p>

                    <h2
                      class="mt-2 text-2xl font-bold
                 tracking-tight
                 text-white
                 sm:text-3xl"
                    >
                      {{ t().supportTitle }}
                    </h2>

                    <p
                      class="mt-3 text-sm leading-6
                 text-white/70
                 sm:text-base"
                    >
                      {{ t().supportText }}
                    </p>
                  </div>

                  <a
                    routerLink="/donate"
                    class="inline-flex shrink-0
               items-center justify-center
               gap-2 rounded-lg
               bg-[#007979]
               px-6 py-3
               text-sm font-bold
               text-white
               shadow-sm
               transition
               hover:bg-[#008989]"
                  >
                    {{ t().supportZebron }}

                    <mat-icon
                      aria-hidden="true"
                      class="!m-0 !h-5 !w-5
                 !text-[18px]"
                    >
                      favorite
                    </mat-icon>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
 
 
    </main>
  `,
 
  styles: [],
})
export class HomeComponent {
  // =========================================================
  // SEO SERVICES
  // =========================================================
 
  private readonly title = inject(Title);
 
  private readonly meta = inject(Meta);
 
  private readonly document = inject(DOCUMENT);
 
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
  // FROM THE BLOG
  // =========================================================

  private readonly blog = inject(BlogService);

  protected readonly blogPosts = signal<BlogPost[]>([]);

  protected readonly blogLoading = signal(true);

  constructor() {
    // Re-applies the title and description when the language changes.
    effect(() => this.updateSeoMetadata());

    // Loaded in the browser only, so server rendering never waits on it.
    afterNextRender(() => void this.loadBlogPosts());
  }

  /** Pinned posts first, then the newest public posts. */
  private async loadBlogPosts(): Promise<void> {
    try {
      const posts = await this.blog.listPublished({ section: 'public', organizationId: null, basePath: '/blog' });

      this.blogPosts.set(
        [...posts.filter((post) => post.pinned), ...posts.filter((post) => !post.pinned)].slice(0, HOME_BLOG_POSTS),
      );
    } catch {
      // The section stays hidden if the blog can't be reached.
      this.blogPosts.set([]);
    } finally {
      this.blogLoading.set(false);
    }
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
 
    this.meta.updateTag({
      name: 'description',
      content: description,
    });
 
    // Open Graph
 
    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Zebron',
    });
 
    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
    });
 
    this.meta.updateTag({
      property: 'og:title',
      content: pageTitle,
    });
 
    this.meta.updateTag({
      property: 'og:description',
      content: description,
    });
 
    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });
 
    // Twitter
 
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary',
    });
 
    this.meta.updateTag({
      name: 'twitter:title',
      content: pageTitle,
    });
 
    this.meta.updateTag({
      name: 'twitter:description',
      content: description,
    });
 
    this.setCanonical(canonicalUrl);
  }
 
  // =========================================================
  // CANONICAL URL
  // =========================================================
 
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
 