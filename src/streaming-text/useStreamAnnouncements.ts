import { useEffect, useRef, useState } from 'react';
import type { Announcement } from '../live-region/LiveRegion';
import { takeAnnounceable } from './segment';

export type AnnounceMode = 'sentences' | 'final' | 'off';

const MAX_RETAINED = 5;
let nextId = 0;

export function useStreamAnnouncements(
  text: string,
  streaming: boolean,
  mode: AnnounceMode,
  onAnnounce?: (message: string) => void,
): Announcement[] {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
    setAnnouncements((current) => [
      ...current.slice(1 - MAX_RETAINED),
      { id: nextId++, text: chunk },
    ]);
  }, [text, streaming, mode]);

  return announcements;
}
