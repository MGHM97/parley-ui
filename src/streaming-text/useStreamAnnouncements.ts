import { useEffect, useRef } from 'react';
import type { Announcement } from '../live-region/LiveRegion';
import { useAnnouncements } from '../live-region/useAnnouncements';
import { takeAnnounceable } from './segment';

export type AnnounceMode = 'sentences' | 'final' | 'off';

export function useStreamAnnouncements(
  text: string,
  streaming: boolean,
  mode: AnnounceMode,
  onAnnounce?: (message: string) => void,
): Announcement[] {
  const { announcements, announce } = useAnnouncements();
  const offset = useRef(streaming ? 0 : text.length);
  const wasStreaming = useRef(streaming);
  const onAnnounceRef = useRef(onAnnounce);

  useEffect(() => {
    onAnnounceRef.current = onAnnounce;
  });

  useEffect(() => {
    const finished = wasStreaming.current && !streaming;
    wasStreaming.current = streaming;

    if (text.length < offset.current) offset.current = 0;
    if (mode === 'off') return;
    if (!streaming && !finished) {
      offset.current = text.length;
      return;
    }
    if (mode === 'final' && !finished) return;

    const { chunk, next } = takeAnnounceable(text, offset.current, finished);
    offset.current = next;
    if (!chunk) return;

    onAnnounceRef.current?.(chunk);
    announce(chunk);
  }, [text, streaming, mode, announce]);

  return announcements;
}
