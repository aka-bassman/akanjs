# Team Task Board Requirements

Create a full-stack Team Task Board app.

## Functional Requirements

- Use SQLite for persistence.
- Implement users, teams, and tasks.
- A task has title, description, status, assignee, team, and createdAt.
- Seed at least 3 users, 1 team, and 8 tasks.
- Show a task list at `/` or `/tasks`.
- Support a status filter.
- Allow creating a task.
- Allow changing task status.
- Allow assigning a task to a user.
- Show task detail in a page or panel.
- Data must persist after a page refresh.
- Keep styling minimal but usable.
- Provide accessible labels or matching `data-testid` attributes for the smoke test controls:
  `task-list`, `new-task-title`, `new-task-description`, `create-task`, `status-filter`, `task-status`,
  `assignee-select`, and `task-detail`.

## Task Statuses

Use these statuses unless the target framework makes a different label unavoidable:

- `todo`
- `in_progress`
- `done`

## Seed Data

Users:

- Mina Kim
- Joon Park
- Alex Lee

Team:

- Product Team

Tasks:

- Draft onboarding checklist
- Review pricing copy
- Prepare launch QA plan
- Design task detail panel
- Wire status filter
- Fix assignment dropdown
- Validate SQLite persistence
- Write smoke test notes

## Acceptance Criteria

- `/` or `/tasks` shows the task list.
- A task can be created.
- A task status can be changed.
- An assignee can be selected or changed.
- The status filter changes the visible task list.
- Task detail is visible in a detail page or panel.
- Refreshing the page keeps created or updated data.
- The build command succeeds.
- The smoke test command succeeds.
