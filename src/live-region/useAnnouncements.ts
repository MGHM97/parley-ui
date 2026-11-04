import { useCallback, useState } from 'react';
import type { Announcement } from './LiveRegion';

const MAX_RETAINED = 5;
let nextId = 0;

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback((text: string) => {
    setAnnouncements((current) => [...current.slice(1 - MAX_RETAINED), { id: nextId++, text }]);
  }, []);

  return { announcements, announce };
}
