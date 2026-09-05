import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-test-center-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `
    <section class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">

        <!-- Header -->
        <div class="mb-8">
          <div class="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <a
              routerLink="/admin"
              class="transition hover:text-teal-600"
            >
              Admin
            </a>

            <span>/</span>

            <span class="text-gray-700">
              Test Center
            </span>
          </div>

          <h1
            class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
          >
            Test Center
          </h1>

          <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
            Manage courses, topics, and question banks for the Zebron Test Center.
          </p>
        </div>

        <!-- Management cards -->
        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >

          <!-- Courses -->
          <a
            routerLink="/admin/test-center/courses"
            class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
          >
            <div
              class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="h-6 w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 5.25h15m-15 0A2.25 2.25 0 0 0 2.25 7.5v10.125A2.25 2.25 0 0 0 4.5 19.875h15a2.25 2.25 0 0 0 2.25-2.25V7.5A2.25 2.25 0 0 0 19.5 5.25m-15 0V4.125A1.875 1.875 0 0 1 6.375 2.25h11.25A1.875 1.875 0 0 1 19.5 4.125V5.25"
                />
              </svg>
            </div>

            <h2
              class="text-lg font-semibold text-gray-900 group-hover:text-teal-700"
            >
              Courses
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Create and manage Test Center courses and certification programs.
            </p>

            <div
              class="mt-5 inline-flex items-center text-sm font-semibold text-teal-700"
            >
              Manage Courses
              <span
                class="ml-2 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </a>

          <!-- Topics -->
          <a
            routerLink="/admin/test-center/topics"
            class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
          >
            <div
              class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="h-6 w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.75v10.5m-5.25-7.5h10.5M5.25 4.5h13.5A1.75 1.75 0 0 1 20.5 6.25v11.5a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 17.75V6.25A1.75 1.75 0 0 1 5.25 4.5Z"
                />
              </svg>
            </div>

            <h2
              class="text-lg font-semibold text-gray-900 group-hover:text-teal-700"
            >
              Topics
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Organize each course into topics and manage topic settings.
            </p>

            <div
              class="mt-5 inline-flex items-center text-sm font-semibold text-teal-700"
            >
              Manage Topics
              <span
                class="ml-2 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </a>

          <!-- Questions -->
          <a
            routerLink="/admin/test-center/questions"
            class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
          >
            <div
              class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="h-6 w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.75 9a2.25 2.25 0 1 1 4.5 0c0 1.5-2.25 1.875-2.25 3.375m0 3.375h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>

            <h2
              class="text-lg font-semibold text-gray-900 group-hover:text-teal-700"
            >
              Questions
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-600">
              Create, edit, publish, and import questions into course question banks.
            </p>

            <div
              class="mt-5 inline-flex items-center text-sm font-semibold text-teal-700"
            >
              Manage Questions
              <span
                class="ml-2 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </a>

        </div>

        <!-- Information panel -->
        <div
          class="mt-8 rounded-2xl border border-teal-100 bg-teal-50 p-5 sm:p-6"
        >
          <div class="flex gap-4">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.8"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11.25 11.25h1.5v5.25h-1.5zm.75-3.75h.008v.008H12V7.5ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>

            <div>
              <h3 class="font-semibold text-gray-900">
                Test Center structure
              </h3>

              <p class="mt-1 text-sm leading-6 text-gray-600">
                Courses contain topics, and topics contain published questions.
                Question availability and counts are calculated from the active
                question bank.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  `,
})
export class TestCenterAdminComponent {}