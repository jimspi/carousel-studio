export function distributeText(fullText: string, imageCount: number): string[] {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();

  if (!cleaned || imageCount <= 0) {
    return Array(Math.max(0, imageCount)).fill('');
  }

  if (imageCount === 1) {
    return [cleaned];
  }

  // Step 1: Split into sentences
  const sentences = splitSentences(cleaned);

  // Step 2: If enough sentences, distribute evenly
  if (sentences.length >= imageCount) {
    return groupChunks(sentences, imageCount);
  }

  // Step 3: Not enough sentences. Break sentences into clauses at
  // commas, semicolons, colons, dashes, and conjunctions.
  let chunks: string[] = [];
  if (sentences.length > 0) {
    for (const sentence of sentences) {
      chunks.push(...splitIntoClauses(sentence));
    }
  } else {
    // No sentence punctuation at all — split whole text into clauses
    chunks.push(...splitIntoClauses(cleaned));
  }

  // Merge any tiny clauses (< 4 words) back into their neighbor
  chunks = mergeSmallChunks(chunks, 4);

  if (chunks.length >= imageCount) {
    return groupChunks(chunks, imageCount);
  }

  // Step 4: Still not enough chunks. Subdivide the largest chunks by
  // words until we have enough, respecting a minimum of 3 words per chunk.
  chunks = subdivideToFit(chunks, imageCount, 3);

  // Step 5: Final merge pass — never allow a chunk with fewer than 3 words
  chunks = mergeSmallChunks(chunks, 3);

  // Pad or trim to match imageCount.
  // Any remaining empty slides go at the end — better than orphan words.
  if (chunks.length > imageCount) {
    return groupChunks(chunks, imageCount);
  }
  while (chunks.length < imageCount) {
    chunks.push('');
  }

  return chunks;
}

// ---- Helpers ----

function splitSentences(text: string): string[] {
  const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
  const matches = text.match(regex);
  if (!matches || matches.length === 0) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Split a piece of text at natural pause points: commas, semicolons,
 * colons, em-dashes, and before coordinating conjunctions.
 * Conjunctions stay with the text that follows them.
 */
function splitIntoClauses(text: string): string[] {
  // Split after punctuation marks, or right before conjunctions so the
  // conjunction starts the next chunk (e.g. "and then runs...")
  const parts = text.split(/(?<=[,;:\u2014])\s+|\s+(?=(?:and|but|or|so|yet|because|however|then|which|where|while)\s)/i);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/**
 * Merge any chunk with fewer than `minWords` words into its neighbor.
 * Prefers merging forward (append to previous); if it's the first chunk,
 * merges with the next one.
 */
function mergeSmallChunks(chunks: string[], minWords: number): string[] {
  if (chunks.length <= 1) return chunks;

  const result: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const wordCount = chunks[i].split(/\s+/).filter(Boolean).length;
    if (wordCount < minWords && result.length > 0) {
      // Merge into previous
      result[result.length - 1] += ' ' + chunks[i];
    } else if (wordCount < minWords && i < chunks.length - 1) {
      // First chunk is tiny — prepend to next
      chunks[i + 1] = chunks[i] + ' ' + chunks[i + 1];
    } else {
      result.push(chunks[i]);
    }
  }

  return result;
}

/**
 * Group an array of text chunks into exactly `groupCount` groups by
 * joining adjacent chunks. Distributes as evenly as possible.
 */
function groupChunks(chunks: string[], groupCount: number): string[] {
  if (chunks.length <= groupCount) {
    const result = [...chunks];
    while (result.length < groupCount) result.push('');
    return result;
  }

  const base = Math.floor(chunks.length / groupCount);
  const extra = chunks.length % groupCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < groupCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    result.push(chunks.slice(idx, idx + count).join(' '));
    idx += count;
  }

  return result;
}

/**
 * Subdivide the longest chunks until we reach the target count.
 * Prefers splitting before conjunctions/prepositions near the midpoint
 * so text reads naturally. Falls back to midpoint if no good break found.
 */
function subdivideToFit(
  chunks: string[],
  targetCount: number,
  minWords: number
): string[] {
  const breakWords = new Set([
    'and', 'but', 'or', 'so', 'yet', 'because', 'however', 'then',
    'which', 'where', 'while', 'when', 'that', 'to', 'for', 'with',
    'into', 'from', 'about', 'through',
  ]);

  const result = [...chunks];

  while (result.length < targetCount) {
    let longestIdx = -1;
    let longestWordCount = 0;

    for (let i = 0; i < result.length; i++) {
      const wc = result[i].split(/\s+/).filter(Boolean).length;
      if (wc >= minWords * 2 && wc > longestWordCount) {
        longestWordCount = wc;
        longestIdx = i;
      }
    }

    if (longestIdx === -1) break;

    const words = result[longestIdx].split(/\s+/).filter(Boolean);
    const mid = Math.ceil(words.length / 2);

    // Look for a natural break word near the midpoint (within 3 words)
    let splitAt = mid;
    for (let offset = 0; offset <= 3; offset++) {
      // Check after midpoint first, then before
      if (mid + offset < words.length - minWords + 1 && breakWords.has(words[mid + offset].toLowerCase())) {
        splitAt = mid + offset;
        break;
      }
      if (mid - offset >= minWords && breakWords.has(words[mid - offset].toLowerCase())) {
        splitAt = mid - offset;
        break;
      }
    }

    // Ensure both halves meet minimum
    if (splitAt < minWords) splitAt = minWords;
    if (words.length - splitAt < minWords) splitAt = words.length - minWords;

    const firstHalf = words.slice(0, splitAt).join(' ');
    const secondHalf = words.slice(splitAt).join(' ');

    result.splice(longestIdx, 1, firstHalf, secondHalf);
  }

  return result;
}
