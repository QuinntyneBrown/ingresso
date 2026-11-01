# 0022 Security activity is its own event store, not the audit entries

- Status: accepted (journey 27, advance confirmation from `docs/prompts/27-review-sign-in-activity.md`)

## Context

Journey 27 shows each person their security events (sign-ins, approvals, revocations, ended sessions) and shows
administrators app and key changes. The codebase already has `AuditEntry` and `IAuditLog` (who changed which
record, kept two years), but nothing writes to them, and an audit entry has no subject a person would recognise
(an app's name, a device) and no owner whose activity it belongs to.

## Decision

- A new `ActivityEvent` entity holds security events: whose activity it is (`UserId`, empty for app and key
  changes), who made an administrative change (`ActorId`, empty from the CLI or the schedule), a type, a short
  subject (an app name or a device description) and the time.
- Handlers record events through `IActivityLog`, which adds the event to the same `AppDbContext` unit of work, so
  an event is saved exactly when the change it records is.
- Events are kept for `Activity:RetentionPeriod` (90 days by default), then the daily pruning deletes them.
- `AuditEntry` stays as it is.

## Consequences

- Activity and audit can have different retention and shapes.
- Events hold no tokens, secrets, codes, tile addresses or IP addresses (L2-038).
