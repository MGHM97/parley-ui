import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { visuallyHidden } from '../utils/visuallyHidden';

export type MessageAuthor = 'user' | 'assistant' | 'system';

export interface MessageListLabels {
  authors: Record<MessageAuthor, string>;
  jumpToLatest: string;
}

const defaultLabels: MessageListLabels = {
  authors: { user: 'You', assistant: 'Assistant', system: 'System' },
  jumpToLatest: 'Jump to latest',
};

interface MessageListContextValue {
  labels: MessageListLabels;
  showAuthors: boolean;
}

const MessageListContext = createContext<MessageListContextValue>({
  labels: defaultLabels,
  showAuthors: false,
});

// Distance from the bottom, in pixels, that still counts as "following" the conversation.
const FOLLOW_THRESHOLD = 32;

export interface MessageListProps extends ComponentPropsWithoutRef<'div'> {
  /** Accessible name of the conversation, e.g. "Conversation with Assistant". */
  label: string;
  /**
   * `role="log"` is a polite live region by default. Leave this `off` when messages
   * announce themselves (as `StreamingText` does), or every reply is read twice.
   */
  live?: 'off' | 'polite';
  /** Show author names visually. They are always available to screen readers. */
  showAuthors?: boolean;
  labels?: { authors?: Partial<MessageListLabels['authors']>; jumpToLatest?: string };
  children?: ReactNode;
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MessageList({
  label,
  live = 'off',
  showAuthors = false,
  labels: overrides,
  children,
  ...rest
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const labels: MessageListLabels = {
    authors: { ...defaultLabels.authors, ...overrides?.authors },
    jumpToLatest: overrides?.jumpToLatest ?? defaultLabels.jumpToLatest,
  };

  const scrollToBottom = useCallback((smooth: boolean) => {
    const element = scrollRef.current;
    if (!element) return;
    if (smooth && typeof element.scrollTo === 'function') {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    } else {
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    following.current = distance <= FOLLOW_THRESHOLD;
    setShowJump(!following.current);
  };

  useEffect(() => {
    scrollToBottom(false);
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;

    // Streaming text grows without re-rendering this component, so watch the size
    // of the content instead of relying on children changes.
    const observer = new ResizeObserver(() => {
      if (following.current) scrollToBottom(false);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    if (following.current) scrollToBottom(false);
  }, [children, scrollToBottom]);

  const jumpToLatest = () => {
    following.current = true;
    setShowJump(false);
    scrollToBottom(!prefersReducedMotion());
    // The button disappears, so hand focus to the conversation instead of the page body.
    scrollRef.current?.focus({ preventScroll: true });
  };

  return (
    <MessageListContext.Provider value={{ labels, showAuthors }}>
      <div data-parley-message-list="" {...rest}>
        {/* The log scrolls, so it must be reachable by keyboard (WCAG 2.1.1). */}
        <div
          ref={scrollRef}
          role="log"
          aria-label={label}
          aria-live={live}
          tabIndex={0}
          data-parley-message-list-scroll=""
          onScroll={handleScroll}
        >
          <div ref={contentRef} data-parley-message-list-content="">
            {children}
          </div>
        </div>
        {showJump && (
          <button type="button" data-parley-jump-to-latest="" onClick={jumpToLatest}>
            {labels.jumpToLatest}
          </button>
        )}
      </div>
    </MessageListContext.Provider>
  );
}

export interface MessageProps extends ComponentPropsWithoutRef<'article'> {
  author: MessageAuthor;
  /** Overrides the default author label, e.g. a model or person's name. */
  name?: string;
  children?: ReactNode;
}

export function Message({ author, name, children, ...rest }: MessageProps) {
  const { labels, showAuthors } = useContext(MessageListContext);
  const authorId = `${useId()}-author`;

  return (
    <article data-parley-message="" data-author={author} aria-labelledby={authorId} {...rest}>
      <span
        id={authorId}
        data-parley-message-author=""
        style={showAuthors ? undefined : visuallyHidden}
      >
        {name ?? labels.authors[author]}
      </span>
      <div data-parley-message-content="">{children}</div>
    </article>
  );
}
