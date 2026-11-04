# parley-ui

Accessible React components for AI interfaces.

Most chat UIs stream model output into an `aria-live` region and call it done. Screen readers then either re-read the whole message on every token or announce fragments like "The build… failed because… the". parley-ui handles the hard parts of AI UX so they work for everyone, including keyboard and screen reader users.

**[Live demos →](https://mghm97.github.io/parley-ui/)**

## Install

```sh
npm install parley-ui
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

## Roadmap

- [x] `StreamingText`
- [x] `PromptInput`
- [ ] `ToolCall` — collapsible tool invocations with announced status
- [ ] `MessageList` — `role="log"` conversation with focus management
- [ ] `Citations` — accessible inline sources

## Development

```sh
yarn install
yarn dev     # Storybook on http://localhost:6006
yarn test    # Vitest + Testing Library + axe-core
yarn build   # ESM + type declarations via tsdown
```

## Credits

Built by [Mateus Vieira](https://github.com/MGHM97), with [Claude Code](https://claude.com/claude-code) as pair programmer.

MIT License.
