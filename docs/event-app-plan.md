# AWS Project-Scoped Event App Plan

## Overview

Build a production-minded MVP as a React single-page application backed by managed AWS services. Amazon Cognito authenticates users, and API Gateway rejects missing or invalid JWTs. Lambda performs resource-level authorization by loading the caller's project membership before every project or event operation.

DynamoDB stores projects, memberships, invitations, and scheduled events. AWS CDK defines the infrastructure. Keep the first release synchronous; introduce EventBridge only when notifications or downstream integrations become requirements.

## Architecture

- React and Vite SPA hosted through private Amazon S3 and CloudFront
- Amazon Cognito hosted sign-in using authorization-code flow with PKCE
- Amazon API Gateway HTTP API with a JWT authorizer
- TypeScript AWS Lambda handlers
- Amazon DynamoDB for application data
- Amazon CloudWatch for structured logs, metrics, and alarms
- AWS CDK in TypeScript for infrastructure as code

Authentication and authorization remain separate:

- Cognito establishes the user's identity.
- API Gateway validates the token issuer, audience, and expiry.
- Lambda loads the user's project membership from DynamoDB and authorizes the requested action.

Do not put dynamic project memberships in Cognito groups or custom claims. A user can belong to many projects, memberships can change at any time, and database membership checks avoid stale authorization data.

## Roles

| Capability                | Owner | Editor | Viewer |
| ------------------------- | ----- | ------ | ------ |
| Read project and events   | Yes   | Yes    | Yes    |
| Create and update events  | Yes   | Yes    | No     |
| Cancel or archive events  | Yes   | Yes    | No     |
| Invite and remove members | Yes   | No     | No     |
| Change member roles       | Yes   | No     | No     |
| Update project settings   | Yes   | No     | No     |

Every project must retain at least one owner. Removing or demoting the final owner must be rejected.

## Domain Model

### Project

- `projectId`
- `name`
- `timezone` as an IANA timezone
- `createdBy`
- `createdAt`
- `updatedAt`

Example: `2026 New England Football Season`.

### Project Membership

- `projectId`
- `userSub`, using the immutable Cognito subject identifier
- `role`: `owner`, `editor`, or `viewer`
- `createdAt`
- `updatedAt`

### Project Invitation

- `invitationId`
- `projectId`
- `email`
- `role`
- `tokenHash`
- `expiresAt`
- `createdBy`
- `createdAt`

Invitation tokens are random, single-use, expire automatically, and are stored only as hashes. The MVP should require the authenticated user's verified email to match the invitation email exactly.

### Event

- `eventId`
- `projectId`
- `title`
- `description`, optional
- `location`, optional
- `startAt`, stored as an ISO-8601 UTC instant
- `endAt`, stored as an ISO-8601 UTC instant
- `status`: `scheduled`, `cancelled`, or `archived`
- `version`, used for optimistic concurrency control
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

Validate that `endAt` is later than `startAt`. Display dates in the project's timezone while keeping UTC as the API and persistence format.

## API Contract

Publish an OpenAPI contract before implementing handlers. Nest project-owned resources under `/projects/{projectId}`.

### Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/{projectId}`
- `PATCH /projects/{projectId}`

Creating a project atomically creates an owner membership for the authenticated user.

### Memberships and Invitations

- `GET /projects/{projectId}/members`
- `PATCH /projects/{projectId}/members/{userSub}`
- `DELETE /projects/{projectId}/members/{userSub}`
- `POST /projects/{projectId}/invitations`
- `GET /projects/{projectId}/invitations`
- `DELETE /projects/{projectId}/invitations/{invitationId}`
- `POST /invitations/{token}/accept`

### Events

- `POST /projects/{projectId}/events`
- `GET /projects/{projectId}/events`
- `GET /projects/{projectId}/events/{eventId}`
- `PATCH /projects/{projectId}/events/{eventId}`
- `DELETE /projects/{projectId}/events/{eventId}`

Event lists use cursor pagination and optional `startsAfter` and `startsBefore` filters. The initial delete behavior archives an event rather than physically deleting it.

Return consistent `400`, `401`, `403`, `404`, and `409` responses. Return `404` instead of revealing the existence of a resource when the caller does not belong to its project.

## DynamoDB Design

Use one application table based on the known access patterns.

| Record     | Partition key         | Sort key                |
| ---------- | --------------------- | ----------------------- |
| Project    | `PROJECT#{projectId}` | `PROJECT`               |
| Membership | `PROJECT#{projectId}` | `MEMBER#{userSub}`      |
| Event      | `PROJECT#{projectId}` | `EVENT#{eventId}`       |
| Invitation | `PROJECT#{projectId}` | `INVITE#{invitationId}` |

Add sparse indexes for:

- Projects belonging to a user
- Events within a project ordered by start time
- Invitations found by hashed token

Use strongly consistent membership reads during authorization. Use transactions for project creation, invitation acceptance, and membership changes involving the final-owner invariant. Use conditional writes with the event `version` to prevent lost updates.

Enable point-in-time recovery in production. Use DynamoDB TTL only to expire invitation records, not as an immediate authorization mechanism; always check `expiresAt` in application code.

## Implementation Phases

### Phase 1: Contracts

1. Create shared TypeScript entities, validation schemas, and role capabilities.
2. Define the OpenAPI contract and standard error format.
3. Add unit tests for permissions, validation, invitation expiry, and final-owner rules.

### Phase 2: AWS Foundation

1. Create separate development and production CDK configuration.
2. Provision Cognito, API Gateway, Lambda, DynamoDB, S3, CloudFront, IAM, and CloudWatch resources.
3. Configure Cognito hosted sign-in, verified email, PKCE, and exact callback and logout URLs.
4. Apply least-privilege IAM and restrict CORS to the deployed frontend origin.

### Phase 3: API

1. Implement shared middleware that reads the Cognito `sub` from API Gateway's verified JWT context.
2. Validate all path, query, and body values at the API boundary.
3. Implement project creation and project listing.
4. Implement owner-managed invitations and membership administration.
5. Implement project-scoped event CRUD with role checks and optimistic concurrency.
6. Add structured logs containing request ID, subject, project ID, operation, outcome, and latency without logging tokens or sensitive request data.

### Phase 4: Web App

1. Add Cognito hosted login and logout to the React SPA.
2. Build project selection and project creation flows.
3. Build invitation acceptance and member management views.
4. Build event list or calendar, detail, creation, and editing views.
5. Hide unavailable controls according to the loaded membership role while keeping the backend authoritative.
6. Handle loading, empty, validation, expired invitation, conflict, unauthorized, and forbidden states.
7. Verify keyboard navigation, focus management, mobile layout, and timezone display.

### Phase 5: Delivery and Operations

1. Add CI for install, lint, typecheck, unit tests, integration tests, SPA build, and `cdk synth`.
2. Deploy to development before production.
3. Add API throttling, bounded Lambda timeouts, and alarms for API errors, Lambda errors and throttles, and DynamoDB throttles.
4. Document deployment, rollback, Cognito access troubleshooting, invitation failures, and DynamoDB restoration.
5. Add a demo data workflow for a professional football team's season.

## Proposed Application Structure

The application should live in its own repository or workspace rather than inside this Astro portfolio.

```text
event-app/
├── apps/
│   └── web/
│       └── src/
├── infra/
│   └── lib/
│       ├── api-stack.ts
│       └── auth-stack.ts
├── packages/
│   └── contracts/
│       ├── openapi.yaml
│       └── src/index.ts
└── services/
    └── api/
        └── src/
            ├── auth/authorizeProject.ts
            └── handlers/
```

## Verification

1. Unit-test role capabilities, data validation, date conversion, invitation expiry and email matching, and final-owner protection.
2. Integration-test every API route against an isolated test environment, including absent or expired JWTs, non-members, each role, cross-project access attempts, pagination, invitation replay, and stale event versions.
3. Run end-to-end tests for sign-up, sign-in, project creation, inviting another user, invitation acceptance, role restrictions, event CRUD, cross-project denial, and logout.
4. Add CDK assertions for least-privilege IAM, private S3 access, backup configuration, and API authorization.
5. Test JWT issuer and audience rejection, CORS restrictions, substituted project and user IDs, and malicious request payloads.
6. Manually test desktop and mobile layouts, keyboard navigation, invitation expiry, stale update conflicts, and daylight-saving boundaries.

## MVP Decisions

- This is a separate real application, not a feature of the existing Astro portfolio.
- Users may belong to multiple projects.
- Any authenticated user may create a project and becomes its owner.
- Owners invite members by verified email and assign a role.
- Events are scheduled calendar items.
- The first deployment uses one AWS region and targets a modest workload.
- Recurrence, attachments, notifications, EventBridge fan-out, permanent deletion, and immutable audit history are outside the first release.
- WAF, multi-region failover, and expanded compliance controls should be added when requirements justify them.

## Open Decisions Before Coding

1. Choose the AWS region, domain name, and development and production callback URLs.
2. Confirm whether archived events can be restored and who may restore them.
3. Decide whether owners can transfer ownership directly or must promote another member first.
4. Define the expected project, user, and request volume for capacity and cost estimates.
5. Decide whether MFA is optional or mandatory for production users.
