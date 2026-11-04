// Punctuation only counts as a boundary once whitespace follows it, so "3." isn't
// announced before the stream turns it into "3.14".
const SENTENCE_END = /[.!?…]+["'”’)\]]*\s+|\n{2,}/g;

export interface Segment {
  chunk: string;
  next: number;
}

export function takeAnnounceable(text: string, from: number, final: boolean): Segment {
  if (final) {
    return { chunk: text.slice(from).trim(), next: text.length };
  }

  let end = from;
  SENTENCE_END.lastIndex = from;
  for (let match = SENTENCE_END.exec(text); match; match = SENTENCE_END.exec(text)) {
    end = match.index + match[0].length;
  }

  return { chunk: text.slice(from, end).trim(), next: end };
}
