/**
 * Distribute text across slides using a greedy word-boundary scoring algorithm.
 *
 * Rules:
 *  - Every slide gets text — no empty slides (unless fewer words than slides)
 *  - Target ~15-18 words per slide when possible, squeeze more if needed
 *  - Prefer breaking at sentence ends > clause punctuation > conjunctions > anywhere
 */
export function distributeText(fullText: string, imageCount: number): string[] {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();

  if (!cleaned || imageCount <= 0) {
    return Array(Math.max(0, imageCount)).fill('');
  }

  if (imageCount === 1) {
    return [cleaned];
  }

  const words = cleaned.split(/\s+/);
  const totalWords = words.length;

  // Fewer words than slides — give each slide 1 word, rest empty
  if (totalWords <= imageCount) {
    const result = [...words];
    while (result.length < imageCount) result.push('');
    return result;
  }

  // Score every word boundary and find optimal break points
  const boundaryScore = scoreBoundaries(words);
  const breakIndices = findBreakPoints(words, imageCount, boundaryScore);

  // Build chunks from break points
  const result: string[] = [];
  let start = 0;
  for (const bp of breakIndices) {
    result.push(words.slice(start, bp).join(' '));
    start = bp;
  }
  result.push(words.slice(start).join(' '));

  return result;
}

// ---- Helpers ----

const CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'so', 'yet', 'because', 'however', 'then',
  'which', 'where', 'while', 'when', 'although', 'though', 'since',
  'unless', 'until', 'after', 'before', 'if',
]);

/**
 * Score each word boundary. boundaryScore[i] represents the quality of
 * placing a slide break after words[i].
 *   3 = sentence end (. ! ?)
 *   2 = clause punctuation (, ; : —)
 *   1 = before a conjunction (and, but, because, …)
 *   0 = no natural break
 */
function scoreBoundaries(words: string[]): number[] {
  const scores: number[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    const nextLower = nextWord.toLowerCase().replace(/[^a-z]/g, '');

    if (/[.!?]["'\u201D\u2019)]*$/.test(word)) {
      scores.push(3); // Sentence end — best break
    } else if (/[,;:\u2014]$/.test(word)) {
      scores.push(2); // Clause boundary
    } else if (CONJUNCTIONS.has(nextLower)) {
      scores.push(1); // Before conjunction
    } else {
      scores.push(0);
    }
  }

  return scores;
}

/**
 * Greedily find (slideCount - 1) break points that divide words[] into
 * slideCount chunks. Each break point is the word index where the next
 * chunk starts. Every chunk is guaranteed at least 1 word.
 *
 * For each slide, we compute the ideal end position, then search nearby
 * for the highest-quality boundary. Ties go to the boundary closest to ideal.
 */
function findBreakPoints(
  words: string[],
  slideCount: number,
  boundaryScore: number[]
): number[] {
  const totalWords = words.length;
  const breaks: number[] = [];
  let pos = 0;

  for (let s = 0; s < slideCount - 1; s++) {
    const remainingSlides = slideCount - s;
    const wordsLeft = totalWords - pos;
    const target = wordsLeft / remainingSlides;
    const idealBreak = pos + target;

    // Each remaining chunk must have at least 1 word
    const earliest = pos + 1;
    const latest = totalWords - (remainingSlides - 1);

    if (earliest > latest) {
      break;
    }

    // Search window: ~40% of target on each side, at least 3 words
    const radius = Math.max(3, Math.ceil(target * 0.4));
    const searchFrom = Math.max(earliest, Math.floor(idealBreak - radius));
    const searchTo = Math.min(latest, Math.ceil(idealBreak + radius));

    let bestPos = Math.max(earliest, Math.min(latest, Math.round(idealBreak)));
    let bestScore = -1;
    let bestDist = Infinity;

    for (let i = searchFrom; i <= searchTo; i++) {
      const score = i > 0 && i - 1 < boundaryScore.length ? boundaryScore[i - 1] : 0;
      const dist = Math.abs(i - idealBreak);

      if (score > bestScore || (score === bestScore && dist < bestDist)) {
        bestScore = score;
        bestDist = dist;
        bestPos = i;
      }
    }

    breaks.push(bestPos);
    pos = bestPos;
  }

  return breaks;
}
