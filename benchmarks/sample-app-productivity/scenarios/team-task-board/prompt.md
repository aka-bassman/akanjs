Create a Team Task Board app in this repository using the target stack.

Target stack: {{stackLabel}}

Allowed packages and versions:
{{allowedPackages}}

Requirements:
- Use SQLite for persistence.
- Implement users, teams, and tasks.
- A task has title, description, status, assignee, team, and createdAt.
- Show a task list with status filter.
- Allow creating a task.
- Allow changing task status.
- Allow assigning a task to a user.
- Show task detail.
- Seed at least 3 users, 1 team, and 8 tasks.
- Keep styling minimal but usable.
- Provide accessible labels or matching `data-testid` attributes for the smoke test controls:
  `task-list`, `new-task-title`, `new-task-description`, `create-task`, `status-filter`, `task-status`,
  `assignee-select`, and `task-detail`.
- Add or maintain a smoke test or documented command that verifies the main flow.
- The app must build and run locally.

Acceptance criteria:
- `/` or `/tasks` shows the task list.
- A task can be created.
- A task status can be changed.
- An assignee can be selected or changed.
- The status filter changes the visible task list.
- Task detail is visible in a detail page or panel.
- Refreshing the page keeps created or updated data.
- The build command succeeds.
- The smoke test command succeeds.

Do not add features outside this scope.
Do not use a different database.
Do not replace the target stack with another framework.
