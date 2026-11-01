# 0017 The profile is shown in Settings and edited in a dialog

- Status: accepted (journey 22, advance confirmation from `docs/prompts/22-share-profile-details-with-apps.md`)

## Context

The original Settings mock put Display name and Email inputs straight on the page, with one Save changes and
Cancel for the whole form. `AGENTS.md` rules out inline forms on pages: editing opens a CDK Dialog or a screen.
Appearance already applies at once with no Save (ADR 0013), so a page-wide Save would only ever save the name.

## Decision

- The Profile card lists the display name and the email as values, with an Edit profile button.
- Edit profile opens "Edit your profile", a dialog with one optional Display name field. The email is text in
  the dialog, because changing it is out of scope.
- Saving closes the dialog, confirms with a "Profile saved" toast, and refreshes the card and the header.
- The Settings `invalid` state moves to the dialog; Settings gains `profile-unset` for an account with no name.

## Consequences

- Settings has no form and no page-level Save; each card changes on its own.
- The dialog follows the same pattern as the other editing dialogs (error summary, busy button, failed alert).
