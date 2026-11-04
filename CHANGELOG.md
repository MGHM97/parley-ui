# Changelog

## 0.2.0 — Unreleased

### Added

- `MessageList` and `Message`: a labelled `role="log"` conversation that follows new content only while the user is at the bottom, offers "Jump to latest" otherwise, and turns off the log's own announcements so replies aren't read twice.
- `ToolCall`: collapsible tool invocations whose status changes are announced once each; calls that mount already finished stay quiet.
- `useAnnouncements`: the announcement queue shared by every component.
- Package checks in CI (`publint`, `are-the-types-wrong`) and a 5 kB size budget.

## 0.1.0

### Added

- `StreamingText`: renders streamed text and announces it one complete sentence at a time.
- `PromptInput`: Enter to send, Shift+Enter for a new line, Escape to stop, safe with IME composition.
- `LiveRegion` and `useStreamAnnouncements`.
