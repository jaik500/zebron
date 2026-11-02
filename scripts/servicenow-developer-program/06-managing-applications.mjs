import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "servicenow-dev-managing",
  title: "Managing Applications",
  summary: "Course 6 of 6 in the Zebron ServiceNow Application Developer Program. Download and install applications, manage source code with the ServiceNow Git integration, use delegated development for code review and team access, and test with ATF before moving applications.",
  description: `
A finished application still has to be shared, versioned, reviewed and moved between instances. This course covers installing applications, publishing to the application repository, linking applications to Git, delegated development and code review, and testing with the Automated Test Framework before deployment.

Each lesson ends with a quick check. The final exam is drawn from the **Managing Applications** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Download and install applications from the Store and the application repository",
    "Link an application to Git and commit, branch, stash and import",
    "Give developers application-specific rights with delegated development",
    "Choose how to move an application between instances",
    "Test applications with the Automated Test Framework",
  ],
  skills: ["Application repository", "Git integration", "Delegated development", "Deployment", "ATF"],
  quiz: {
    name: "Managing Applications",
    slug: "servicenow-dev-managing",
    description: "Practice questions for Course 6 of the ServiceNow Application Developer Program: installing, source control, delegated development, deployment and ATF.",
    tags: ["servicenow", "cad", "source-control", "deployment"],
  },
  topics: [
    { key: "install", name: "Downloading and installing applications", description: "The Store, Application Manager and the application repository." },
    { key: "git", name: "The ServiceNow Git integration", description: "Linking to a repository, commits, branches, stashes and imports." },
    { key: "delegated-dev", name: "Delegated development and code review", description: "Application-specific developer and deployment rights." },
    { key: "deployment", name: "Moving applications between instances", description: "Repository, source control and update sets compared; versions." },
    { key: "atf", name: "Automated Test Framework", description: "Tests, steps, suites and running them outside production." },
  ],
  modules: [
    {
      id: "install-and-source",
      title: "Installing and source control",
      lessons: [
        {
          id: "install",
          title: "Downloading and installing applications",
          minutes: 10,
          blocks: [
            text(`
## Where applications come from

| Source | What it is |
| --- | --- |
| **ServiceNow Store** | Certified applications from ServiceNow and partners (store.servicenow.com) |
| **Application repository** | Your company's own published applications, shared between your instances |
| **Source control** | An application imported from a Git repository (for development) |
| **Update sets / XML** | Older or one-off ways to move configuration |

## Installing

1. Get or request the application (Store purchases and free apps are entitled to your instances).
2. On the instance, open **System Applications → All Available Applications → All** (Application Manager).
3. Find the application and choose **Install** (or **Update** for a newer version). Some installs offer **demo data**.
4. Check the installed version and any **dependencies** (plugins or other apps it needs).

## Publishing to the repository

From ServiceNow Studio, **Publish to Application Repository** with a **version** number (for example 1.2.0) and release notes. Your other instances (test, production) can then install that version from Application Manager. This is the recommended way to deliver a finished scoped application.
`),
            check(
              "Where does an administrator install an application published to the company's application repository?",
              ["Application Manager on the target instance", "Form Builder", "The Event Registry"],
              0,
              "Repository apps are installed from Application Manager.",
            ),
          ],
        },
        {
          id: "git",
          title: "Using the ServiceNow Git integration",
          minutes: 13,
          blocks: [
            text(`
## Why source control

Linking an application to **Git** (GitHub, GitLab, Bitbucket, Azure DevOps and other Git hosts) gives version history, branches for parallel work, and a backup of the application outside the instance.

## Linking

1. Create an empty repository and a **credential** (user name and personal access token) on the instance; reach internal Git servers through a **MID Server**.
2. In ServiceNow Studio, choose **Link to Source Control** (or **Import from Source Control** to bring an existing application in).
3. The application's files are written to the repository as XML.

## Everyday actions

| Action | What it does |
| --- | --- |
| **Commit changes** | Saves the application's current changes to the repository with a message |
| **Apply remote changes** | Pulls changes others committed into this instance |
| **Create branch / switch branch** | Work on a feature or fix separately |
| **Stash local changes** | Set aside uncommitted changes (for example before switching branch) and apply them later |
| **Create tag** | Mark a version (for example a release) |
| **Import from source control** | Install an application from a repository onto another development instance |

## Good practice

- Commit often with clear messages.
- One application per repository.
- Resolve conflicts when applying remote changes before continuing work.
`),
            tip("Stash before you switch branches if you have uncommitted changes, then apply the stash afterwards."),
            check(
              "Which Git action brings an existing application from a repository onto another development instance?",
              ["Import from Source Control", "Execute Now", "Preview Notification"],
              0,
              "Import from Source Control installs the application from the repository.",
            ),
          ],
        },
        {
          id: "delegated-dev",
          title: "Delegated development and code review",
          minutes: 10,
          blocks: [
            text(`
## What it is

**Delegated development** lets chosen users who do **not** have the admin role build and deploy a specific application. Permissions are set **per application**.

## Setting it up

1. Open the application's record (or ServiceNow Studio → Manage developers).
2. Add **developers** (users or groups).
3. Choose what each may do:

| Permission | Allows |
| --- | --- |
| **All application files** or chosen file types | Edit code and configuration (scripts, tables, UI…) |
| **Manage source control** | Commit, branch and apply changes in Git |
| **Publish / deploy** | Publish to the repository or install on other instances |
| **Security** files | Edit ACLs and roles (often kept for senior developers) |

## Code review and governance

- Developers work in their own branches; a reviewer checks changes before they are merged and applied.
- **Deployment requests** and pipelines (for example App Engine Management Center) add approval steps before production.
- Pair delegated development with **ATF** tests run on non-production instances so changes are checked before they move.
`),
            check(
              "What does delegated development allow?",
              ["Non-admin users to develop and deploy a specific application", "Every user to edit every application", "Bypassing ACLs in production"],
              0,
              "It grants application-specific developer and deployment rights without admin.",
            ),
          ],
        },
      ],
    },
    {
      id: "deploy-and-test",
      title: "Deploying and testing",
      lessons: [
        {
          id: "deployment",
          title: "Moving applications between instances",
          minutes: 10,
          blocks: [
            text(`
## Options compared

| Method | Best for | Notes |
| --- | --- | --- |
| **Application repository** | Delivering a scoped application to test and production | Versioned, installed from Application Manager, recommended |
| **Source control (Git)** | Moving work between **development** instances, team collaboration | Not a production deployment tool |
| **Update sets** | Global changes and small configuration moves | Must be completed, retrieved, previewed (resolve problems) and committed |
| **Export application to XML** | One-off copies | Not for regular delivery |

## Versions

Use semantic versions: **major.minor.patch** (2.0.0 for breaking changes, 1.3.0 for new features, 1.2.1 for fixes). The installed version shows in Application Manager, and upgrades install a newer version over the old one.

## Typical path

Develop (with Git) → test instance (install from repository, run ATF) → production (install the same version).

> Do not develop directly in production.
`),
            check(
              "What is the recommended way to deliver a finished scoped application to production?",
              ["Publish to the application repository and install the version", "Edit it directly in production", "Email the XML to users"],
              0,
              "The repository delivers versioned scoped applications.",
            ),
          ],
        },
        {
          id: "atf",
          title: "Testing with the Automated Test Framework",
          minutes: 11,
          blocks: [
            text(`
## What ATF does

The **Automated Test Framework (ATF)** creates and runs tests that check the instance still works after a change, an upgrade or an application install.

## Building tests

- A **test** is a list of **steps**: open a new form, set field values, submit, validate field values, impersonate, server-side validation (script), REST steps, Service Catalog steps.
- **Test suites** group tests and can run them together, on demand or on a schedule.
- Tests can be part of an application, so they move with it.

## Running tests

- Run a test or suite from its record; UI steps run in a **client test runner** browser tab.
- Results show each step with pass or fail and screenshots.
- ServiceNow says to run ATF **only on non-production instances**: tests create and change data. Test execution is disabled in production by a property by default.

## When to run

- Before publishing a new version.
- After upgrades and patches.
- After installing or updating an application on the test instance.
`),
            tip("Add an Impersonate step at the start of UI tests so they run as a realistic user, not as admin."),
            check(
              "Where does ServiceNow say ATF tests should run?",
              ["Only on non-production instances", "Only in production", "Only on the developer's laptop"],
              0,
              "Tests create and change data, so run them outside production.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Install ----------------
    mc("install", "easy", "Where do certified partner applications come from?", ["The ServiceNow Store", "An import set", "A transform map", "The email log"], 0, "Certified apps are on the ServiceNow Store."),
    mc("install", "medium", "Which list shows applications you can install and their versions on an instance?", ["Application Manager (All Available Applications)", "System Logs", "Event Registry", "Schema map"], 0, "Application Manager lists available and installed apps."),
    mc("install", "medium", "How do test and production instances get a version of your company's scoped application?", ["Install it from the application repository", "Copy the code by hand", "Run Scripts - Background", "Create a module"], 0, "Published versions are installed from the repository."),
    tf("install", "medium", "Some applications depend on plugins or other applications that must be present.", true, "Check dependencies before installing."),
    ms("install", "medium", "What should you provide when publishing to the application repository? Select all that apply.", ["A version number", "Release notes", "The application", "Users' passwords"], [0, 1, 2], "Passwords are never part of publishing."),

    // ---------------- Git ----------------
    mc("git", "easy", "Which Git action saves the application's current changes to the repository?", ["Commit changes", "Stash", "Apply remote changes", "Create tag"], 0, "Commit records changes in the repository."),
    mc("git", "medium", "You have uncommitted changes and need to switch branches. What should you do first?", ["Stash local changes", "Delete the application", "Publish to production", "Clear the cache"], 0, "Stash sets changes aside to apply later."),
    mc("git", "medium", "Which action pulls changes other developers committed into your instance?", ["Apply remote changes", "Create tag", "Commit changes", "Link to source control"], 0, "Apply remote changes brings in commits."),
    ms("git", "medium", "What do you need to link an application to a Git repository? Select all that apply.", ["A repository URL", "A credential such as a personal access token", "A MID Server for internal Git servers", "An inbound email action"], [0, 1, 2], "Email actions are unrelated."),
    tf("git", "medium", "Source control is the recommended tool for deploying to production.", false, "Git moves work between development instances; the repository delivers to production."),

    // ---------------- Delegated development ----------------
    mc("delegated-dev", "easy", "Delegated development grants permissions…", ["Per application", "To the whole instance", "Only to admins", "Only for reports"], 0, "Permissions are specific to each application."),
    mc("delegated-dev", "medium", "A department developer needs to edit one application without the admin role. What do you use?", ["Delegated development", "Impersonation", "A dictionary override", "A public page"], 0, "Delegated development grants app-specific rights."),
    ms("delegated-dev", "medium", "Which permissions can delegated developers be given? Select all that apply.", ["Edit chosen file types", "Manage source control", "Publish or deploy", "Change other companies' instances"], [0, 1, 2], "Rights are limited to the application on your instances."),
    tf("delegated-dev", "medium", "Security files such as ACLs can be kept out of a delegated developer's permissions.", true, "File-type permissions can exclude security files."),
    mc("delegated-dev", "medium", "What adds a safety check before delegated changes move to production?", ["ATF tests on non-production instances and code review", "Removing all ACLs", "Editing in production", "Disabling logs"], 0, "Review and testing outside production catch problems."),

    // ---------------- Deployment ----------------
    mc("deployment", "easy", "Which method is best for small global configuration changes between instances?", ["Update sets", "ATF", "REST API Explorer", "Record producer"], 0, "Update sets move global configuration."),
    mc("deployment", "medium", "A release adds new features without breaking changes to version 1.2.0. What is the next version?", ["1.3.0", "2.0.0", "1.2.0", "0.1.0"], 0, "New features raise the minor version."),
    mc("deployment", "medium", "What must happen to a retrieved update set before it is committed?", ["Preview it and resolve problems", "Publish it to the Store", "Convert it to a flow", "Nothing"], 0, "Previewing finds conflicts to resolve."),
    tf("deployment", "easy", "Developing directly in production is good practice.", false, "Develop and test on non-production instances."),
    mc("deployment", "medium", "What is the typical path for a scoped application?", ["Development → test (install, run ATF) → production", "Production → development", "Test only", "Email the XML"], 0, "Promote the same version through the instances."),

    // ---------------- ATF ----------------
    mc("atf", "easy", "What is a group of ATF tests that run together called?", ["A test suite", "A transform map", "A module", "A view"], 0, "Suites group tests."),
    ms("atf", "medium", "Which are ATF step types? Select all that apply.", ["Open a new form", "Set field values", "Impersonate", "Coalesce"], [0, 1, 2], "Coalesce belongs to transforms."),
    mc("atf", "medium", "Why does ServiceNow say to run ATF only on non-production instances?", ["Tests create and change data", "ATF is too slow", "ATF needs no roles", "It deletes the instance"], 0, "Tests change data, which should not happen in production."),
    mc("atf", "medium", "Where do UI steps of an ATF test run?", ["In a client test runner browser tab", "In the ECC Queue", "In an inbound email action", "In the schema map"], 0, "A client test runner executes UI steps."),
    tf("atf", "easy", "Running tests after an upgrade helps confirm the instance still works.", true, "ATF is a safety net for upgrades and changes."),
  ],
};
