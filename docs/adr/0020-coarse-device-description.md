# 0020 Sessions keep a coarse device description, not the user agent

- Status: accepted (journey 25, advance confirmation from `docs/prompts/25-see-and-end-other-sessions.md`)

## Context

Settings → Devices names each signed-in device so people can tell them apart and end one they don't recognise.
The browser's `User-Agent` header says which browser and system it is, but the full string is a fingerprint,
and an IP address or location says even more about the person (L2-038).

## Decision

- When a session starts, ingresso derives "<browser> on <system>" from the `User-Agent` header (for example
  "Chrome on macOS", "Safari on iPhone") and stores only that, at most 100 characters.
- Unrecognised browsers or systems read "Unknown browser" or "an unknown system"; a missing header reads
  "Unknown device".
- No IP address, location or full user-agent string is stored or logged.

## Consequences

- Two devices with the same browser and system look alike; their last activity and sign-in date tell them apart.
- Sessions started before journey 25 have no description and read "Unknown device".
