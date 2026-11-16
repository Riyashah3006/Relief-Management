# Agile testing with Jira

The project already tracks requirements in the Jira `SCRUM` project; `Jira.csv`
is the exported backlog. Use this plan to turn each story's acceptance criteria
into repeatable test work and record actual results in Jira. Jira credentials are
not part of this repository, so no Jira issues or execution results are claimed
as created here.

## Sprint workflow

Use the team's configured Jira workflow (map equivalent status names if needed):

1. Keep each story's acceptance criteria in Given/When/Then form.
2. Before implementation, create linked test subtasks for the acceptance
   criteria and identify the automation/manual owner.
3. During the sprint, move the story to **In Progress** and test tasks to
   **To Do**; attach code commits and pull requests to the story.
4. After the CI checks pass, move test tasks to **In Testing**. Execute the
   manual checks in the sprint test environment and attach evidence.
5. Record each failed case as a linked Bug with steps to reproduce, expected
   result, actual result, environment, severity, and screenshot/log evidence.
   Re-test the fix and record the result on the test task.
6. Move the story to **Done** only when acceptance criteria pass, required bugs
   are resolved, and the test evidence is linked.

## Sprint test coverage

Create test subtasks under the existing stories. Jira keys below refer to the
backlog in `Jira.csv`; add the cases as subtasks rather than inventing new keys.

| Story | Priority | Test activity | Expected result |
|---|---|---|---|
| SCRUM-33 Registration | High | Register with valid details; retry with the same email; omit a required field | Account is created with Citizen role; duplicate and invalid submissions are rejected |
| SCRUM-34 Login | High | Sign in with valid/invalid credentials; repeat failed attempts through the lockout threshold | Valid user receives a session; invalid/locked user is rejected |
| SCRUM-36 RBAC | High | Call an Admin-only endpoint as a Citizen and as an Admin | Citizen receives 403; Admin receives the authorized response |
| SCRUM-37/38 Disasters | High | Create an incident with valid and missing fields; load and filter active incidents | Valid incident is stored and listed; invalid input is rejected |
| SCRUM-39/40 Relief requests | High | Submit a complete request and one missing required data; view/filter the citizen's requests | Valid request has a unique ID and Submitted state; invalid request is rejected |
| SCRUM-41/42 Coordinator review | High | Prioritize a submitted request; approve a reviewed request; reject without and with a reason | Priority/state changes persist; approval/rejection rules and notifications are honored |
| SCRUM-19/20 Test & bug-fix work | High | Run the automated CI checks and execute regression cases for each changed story | Build/tests pass and results/linked defects are recorded in Jira |

## Automated and manual checks

Run the automated checks from the repository root:

```sh
npm ci --prefix server
npm ci --prefix client
npm test --prefix server
npm run build --prefix client
```

The Node test runner exercises the `/api/health` HTTP endpoint against a
temporary SQLite database. Jenkins runs these checks for each branch build.
For each Jira story, perform the role-specific browser/API checks from its
acceptance criteria in addition to this smoke test; the smoke test is not a
substitute for functional acceptance testing.

## Jira test execution record

For each test subtask, record:

- **Story / acceptance criterion:** Jira key and criterion being verified.
- **Build / commit:** Jenkins build URL and commit SHA.
- **Environment:** test URL, browser/device where relevant, and test-data setup.
- **Steps and expected result:** concise reproducible steps.
- **Actual result:** pass/fail, with timestamp and tester.
- **Evidence:** Jenkins test output, screenshots, or relevant sanitized logs.
- **Defects:** linked Jira Bug keys and retest result.

Never attach passwords, JWTs, personal data, or production database contents to
Jira evidence.
