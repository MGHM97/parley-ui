import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { LiveRegion } from '../live-region/LiveRegion';
import { type AnnounceMode, useStreamAnnouncements } from './useStreamAnnouncements';

export interface StreamingTextProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Full text received so far. Pass the accumulated string, not the latest token. */
  text: string;
  streaming?: boolean;
  /**
   * What screen readers hear while text arrives.
   * - `sentences`: each sentence once it's complete (default)
   * - `final`: the whole response once streaming ends
   * - `off`: nothing; handle announcements yourself
   */
  announce?: AnnounceMode;
  cursor?: boolean;
  onAnnounce?: (message: string) => void;
  /** Custom renderer, e.g. for Markdown. Receives the current text. */
  children?: (text: string) => ReactNode;
}

export function StreamingText({
  text,
  streaming = false,
  announce = 'sentences',
  cursor = true,
  onAnnounce,
  children,
  ...rest
}: StreamingTextProps) {
  const announcements = useStreamAnnouncements(text, streaming, announce, onAnnounce);

  // The live region sits outside the aria-busy element: some screen readers hold
  // back announcements from inside a busy subtree until it settles.
  return (
    <>
      <div
        data-parley-streaming-text=""
        data-streaming={streaming || undefined}
        aria-busy={streaming || undefined}
        {...rest}
      >
        {children ? children(text) : text}
        {streaming && cursor && <span data-parley-cursor="" aria-hidden="true" />}
      </div>
      <LiveRegion announcements={announcements} />
    </>
  );
}
