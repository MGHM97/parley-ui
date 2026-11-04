import { visuallyHidden } from '../utils/visuallyHidden';

export interface Announcement {
  id: number;
  text: string;
}

export interface LiveRegionProps {
  announcements: Announcement[];
  politeness?: 'polite' | 'assertive';
}

// Each announcement is a new node, so screen readers read only what was added
// instead of re-reading the whole region.
export function LiveRegion({ announcements, politeness = 'polite' }: LiveRegionProps) {
  return (
    <div
      data-parley-live-region=""
      aria-live={politeness}
      aria-atomic="false"
      aria-relevant="additions"
      style={visuallyHidden}
    >
      {announcements.map((item) => (
        <p key={item.id}>{item.text}</p>
      ))}
    </div>
  );
}
