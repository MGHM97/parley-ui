# parley-ui

Accessible React components for AI interfaces.

Most chat UIs stream model output into an `aria-live` region and call it done. Screen readers then either re-read the whole message on every token or announce fragments like "The build… failed because… the". parley-ui handles the hard parts of AI UX so they work for everyone, including keyboard and screen reader users.

**[Live demos →](https://mghm97.github.io/parley-ui/)**

## Install

```sh
yarn add parley-ui
```

```tsx
import { StreamingText } from 'parley-ui';
import 'parley-ui/styles.css';
```

The stylesheet is optional and tiny: it adds `pre-wrap` text and a cursor that respects `prefers-reduced-motion`. Components expose `data-parley-*` attributes for your own styles.

## `StreamingText`

Renders text as it streams in and announces it to screen readers one complete sentence at a time.

```tsx
<StreamingText text={partialResponse} streaming={isStreaming} />
```

| Prop         | Type                              | Default       |                                                 |
| ------------ | --------------------------------- | ------------- | ----------------------------------------------- |
| `text`       | `string`                          | —             | Full text received so far, not the latest token |
| `streaming`  | `boolean`                         | `false`       | Shows the cursor and sets `aria-busy`           |
| `announce`   | `'sentences' \| 'final' \| 'off'` | `'sentences'` | What screen readers hear while text arrives     |
| `cursor`     | `boolean`                         | `true`        | Decorative cursor, hidden from assistive tech   |
| `onAnnounce` | `(message: string) => void`       | —             | Called with each announcement                   |
| `children`   | `(text: string) => ReactNode`     | —             | Custom renderer, e.g. Markdown                  |

How it works:

- Text is split at sentence boundaries, but only once whitespace follows the punctuation, so `3.14` is never announced as `3.`
- Text already on screen when the component mounts is not announced, so chat history stays quiet
- Whatever is left when streaming ends is flushed as a final announcement
- A shorter `text` means a new response, and announcements start over
- The live region lives outside the `aria-busy` element, because some screen readers hold back updates from busy subtrees

Need the announcements without the component? Use `useStreamAnnouncements(text, streaming, mode)` with `<LiveRegion />`.

## `PromptInput`

A chat composer that gets the keyboard details right.

```tsx
<PromptInput
  label="Message"
  placeholder="Ask anything…"
  streaming={isStreaming}
  onSubmit={send}
  onStop={abort}
/>
```

- **Enter** sends, **Shift+Enter** adds a new line, **Escape** stops generation
- Never sends mid-composition when typing Japanese, Chinese or Korean, including Safari's late `Enter` after `compositionend`
- Whitespace-only messages are ignored; the send button uses `aria-disabled` so it stays focusable and discoverable
- While streaming, the send button becomes a stop button and the field stays editable for the next message
- `label` is required, and keyboard shortcuts are exposed through `aria-describedby`
- Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`)
- Every string is replaceable through `labels` for i18n
- Grows with its content via `field-sizing: content`, falling back to a scrollable field in older browsers

| Prop                     | Type                            | Default  |
| ------------------------ | ------------------------------- | -------- |
| `label`                  | `string`                        | required |
| `onSubmit`               | `(value: string) => void`       | required |
| `showLabel`              | `boolean`                       | `false`  |
| `value` / `defaultValue` | `string`                        | —        |
| `onValueChange`          | `(value: string) => void`       | —        |
| `streaming`              | `boolean`                       | `false`  |
| `onStop`                 | `() => void`                    | —        |
| `labels`                 | `{ send?, stop?, hint? }`       | English  |
| `formProps`              | props for the wrapping `<form>` | —        |

Any other prop goes to the `<textarea>`.

## `ToolCall`

Shows what an agent is doing when it calls a tool, and tells screen reader users when that changes.

```tsx
<ToolCall
  name="search_docs"
  title="Searching the docs"
  status="running"
  input={{ query: 'aria-live' }}
/>
```

- A native `<button>` with `aria-expanded` and `aria-controls` toggles the details, so Enter and Space just work
- Status changes are announced once each ("Searching the docs: Done"); a call that mounts already finished is treated as history and stays quiet, while one that mounts queued or running is announced
- The trigger's accessible name joins title, status and duration with commas, so it never reads as "Searching the docsRunning"
- Input, output and error sit in a description list instead of landmarks, so a long agent run doesn't flood the landmark menu
- Values are pretty-printed JSON that wraps instead of scrolling, avoiding an unfocusable scroll region; pass `renderValue` for your own formatting
- The running spinner stops under `prefers-reduced-motion`

| Prop                   | Type                                                         | Default  |
| ---------------------- | ------------------------------------------------------------ | -------- |
| `name`                 | `string`                                                     | required |
| `status`               | `'pending' \| 'running' \| 'success' \| 'error'`             | required |
| `title`                | `string`                                                     | `name`   |
| `input` / `output`     | `unknown`                                                    | —        |
| `error`                | `ReactNode`                                                  | —        |
| `durationMs`           | `number`                                                     | —        |
| `open` / `defaultOpen` | `boolean`                                                    | `false`  |
| `onOpenChange`         | `(open: boolean) => void`                                    | —        |
| `labels`               | `{ status?, input?, output?, error?, announce?, duration? }` | English  |
| `renderValue`          | `(value, kind) => ReactNode`                                 | JSON     |

## `MessageList` and `Message`

The conversation container, built so it doesn't fight the other components.

```tsx
<MessageList label="Conversation" style={{ height: 480 }}>
  <Message author="user">How do live regions work?</Message>
  <Message author="assistant">
    <StreamingText text={reply} streaming={isStreaming} />
  </Message>
</MessageList>
```

- `role="log"` with an accessible name, so screen reader users know where the conversation is
- `role="log"` is a polite live region by default; parley-ui sets `aria-live="off"` because `StreamingText` and `ToolCall` already announce themselves, and leaving both on reads every reply twice. Use `live="polite"` if your messages don't announce on their own
- Follows new content only while the user is at the bottom. Scroll up to reread and it stays put, showing a "Jump to latest" button that returns to the end and moves focus to the log instead of dropping it on the page
- Watches content size, so streaming text keeps the view pinned without re-rendering the list
- The log is focusable, so keyboard users can scroll it (WCAG 2.1.1)
- Each message is an `<article>` named after its author ("You", "Assistant", or a custom `name`), so screen readers can jump between messages; author names are visually hidden unless `showAuthors` is set
- Smooth scrolling only when `prefers-reduced-motion` allows it

| Prop (`MessageList`) | Type                                                          | Default  |
| -------------------- | ------------------------------------------------------------- | -------- |
| `label`              | `string`                                                      | required |
| `live`               | `'off' \| 'polite'`                                           | `'off'`  |
| `showAuthors`        | `boolean`                                                     | `false`  |
| `labels`             | `{ authors?: { user?, assistant?, system? }, jumpToLatest? }` | English  |

| Prop (`Message`) | Type                                | Default            |
| ---------------- | ----------------------------------- | ------------------ |
| `author`         | `'user' \| 'assistant' \| 'system'` | required           |
| `name`           | `string`                            | label for `author` |

## Roadmap

- [x] `StreamingText`
- [x] `PromptInput`
- [x] `ToolCall`
- [x] `MessageList`
- [ ] `Citations` — accessible inline sources

## Development

```sh
yarn install
yarn dev     # Storybook on http://localhost:6006
yarn test    # Vitest + Testing Library + axe-core
yarn build   # ESM + type declarations via tsdown
yarn size    # size budget (5 kB, brotli)
```

## Releasing

1. Update `version` in `package.json` and move the "Unreleased" notes in [`CHANGELOG.md`](CHANGELOG.md) under that version.
2. Commit, then tag and push: `git tag v0.2.0 && git push --follow-tags`.
3. The [release workflow](.github/workflows/release.yml) checks that the tag matches `package.json`, runs every check again and publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements). It needs an `NPM_TOKEN` repository secret.

Locally, `yarn check:package` packs the library with `yarn pack` and lints the tarball with `publint` and `are-the-types-wrong`; `yarn size` enforces the size budget.

## Credits

Built by [Mateus Vieira](https://github.com/MGHM97), with [Claude Code](https://claude.com/claude-code) as pair programmer.

MIT License.
