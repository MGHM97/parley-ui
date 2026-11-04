import { describe, expect, it } from 'vitest';
import { takeAnnounceable } from './segment';

describe('takeAnnounceable', () => {
  it('returns nothing until a sentence is complete', () => {
    expect(takeAnnounceable('The answer is', 0, false)).toEqual({ chunk: '', next: 0 });
  });

  it('takes every complete sentence and leaves the partial one', () => {
    const text = 'First point. Second point! Third';
    expect(takeAnnounceable(text, 0, false)).toEqual({
      chunk: 'First point. Second point!',
      next: text.indexOf('Third'),
    });
  });

  it('waits for whitespace so decimals are not split', () => {
    expect(takeAnnounceable('Pi is roughly 3.', 0, false).chunk).toBe('');
    expect(takeAnnounceable('Pi is roughly 3.14. Next', 0, false).chunk).toBe(
      'Pi is roughly 3.14.',
    );
  });

  it('treats closing quotes and brackets as part of the sentence', () => {
    expect(takeAnnounceable('She said "done." Then', 0, false).chunk).toBe('She said "done."');
  });

  it('treats paragraph breaks as boundaries', () => {
    expect(takeAnnounceable('Heading\n\nBody', 0, false).chunk).toBe('Heading');
  });

  it('continues from the given offset', () => {
    const text = 'One. Two. Three';
    const first = takeAnnounceable(text, 0, false);
    expect(takeAnnounceable(text + '. ', first.next, false).chunk).toBe('Three.');
  });

  it('flushes the remainder when final', () => {
    const text = 'Done. And the tail';
    expect(takeAnnounceable(text, 6, true)).toEqual({ chunk: 'And the tail', next: text.length });
  });
});
