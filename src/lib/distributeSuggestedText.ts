export interface SuggestedResult {
  chunks: string[];
  tips: string[];
  idealSlideCount: number;
}

export function distributeSuggestedText(
  fullText: string,
  imageCount: number
): SuggestedResult {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();
  const tips: string[] = [];

  if (!cleaned || imageCount <= 0) {
    return { chunks: Array(Math.max(0, imageCount)).fill(''), tips, idealSlideCount: imageCount };
  }

  const totalWords = cleaned.split(/\s+/).length;
  const idealSlideCount = Math.max(imageCount, Math.ceil(totalWords / 20));

  if (imageCount >= 2 && totalWords / imageCount > 30) {
    const recommended = Math.min(10, Math.ceil(totalWords / 20));
    if (recommended > imageCount) {
      tips.push(`Text is dense at ~${Math.round(totalWords / imageCount)} words/slide. Upload ${recommended} images for the ideal 15-20 words/slide.`);
    }
  }

  if (imageCount === 1) {
    return { chunks: [cleaned], tips, idealSlideCount };
  }

  const sentences = splitSentences(cleaned);

  // If we have very few sentences relative to images, use word-based splitting
  // with viral structure (short hook on slide 1, short closer on last)
  if (sentences.length < 2) {
    return buildFromWords(cleaned, imageCount, tips, idealSlideCount);
  }

  // --- Slide 1: Hook ---
  const firstSentence = sentences[0];
  const firstWords = firstSentence.split(/\s+/).length;
  let hookText = firstSentence;

  const isQuestion = /\?/.test(firstSentence);
  const isBoldClaim = firstWords <= 12;

  if (!isQuestion && !isBoldClaim && firstWords > 20) {
    const clauseMatch = firstSentence.match(/^([^,;:\u2014]+[,;:\u2014])/);
    if (clauseMatch && clauseMatch[1].split(/\s+/).length >= 4) {
      hookText = clauseMatch[1].replace(/[,;:\u2014]+$/, '');
      tips.push('Slide 1 trimmed to an attention-grabbing opening clause. A short hook stops the scroll.');
    } else {
      const words = firstSentence.split(/\s+/);
      hookText = words.slice(0, 15).join(' ') + '...';
      tips.push('Slide 1 shortened to ~15 words. Short hooks stop the scroll — consider rephrasing as a question.');
    }
  } else if (isQuestion) {
    tips.push('Slide 1 opens with a question — great hook for engagement.');
  } else if (isBoldClaim) {
    tips.push('Slide 1 is a bold, short statement — strong scroll-stopper.');
  }

  // --- Last slide: CTA / Closer ---
  const lastSentence = sentences.length > 1 ? sentences[sentences.length - 1] : '';
  const lastWords = lastSentence ? lastSentence.split(/\s+/).length : 0;
  let closerText = lastSentence;

  if (lastSentence && lastWords > 15) {
    const words = lastSentence.split(/\s+/);
    closerText = words.slice(0, 12).join(' ') + '.';
    tips.push('Last slide trimmed for a punchy closer. Keep it short — this is your call to action.');
  } else if (lastSentence) {
    tips.push('Last slide is short and punchy — perfect for a call to action.');
  }

  // --- Middle slides ---
  const middleSlotCount = imageCount - 2;

  if (middleSlotCount <= 0) {
    // 2 images: hook + closer
    const chunks = [hookText, closerText || sentences.slice(1).join(' ') || hookText];
    return { chunks, tips, idealSlideCount };
  }

  // Collect remaining sentences for middle slots
  const remainingSentences = sentences.length > 2
    ? sentences.slice(1, -1)
    : [];

  // If no remaining sentences for middle, use word splitting on the body text
  if (remainingSentences.length === 0) {
    // Reconstruct body from everything except hook and closer sentences
    const bodyText = sentences.slice(1, -1).join(' ') || '';
    if (bodyText) {
      const middleChunks = splitWordsIntoSlots(bodyText, middleSlotCount);
      const chunks = [hookText, ...middleChunks, closerText];
      return { chunks, tips, idealSlideCount };
    }
    // Very few sentences — fill middle with empty
    const chunks = [hookText, ...Array(middleSlotCount).fill(''), closerText];
    return { chunks, tips, idealSlideCount };
  }

  const middleChunks = distributeMiddle(remainingSentences, middleSlotCount);

  const avgMiddle = middleChunks.reduce((sum, c) => sum + (c ? c.split(/\s+/).length : 0), 0) / Math.max(1, middleSlotCount);
  if (avgMiddle > 25 && avgMiddle <= 40) {
    tips.push(`Middle slides average ~${Math.round(avgMiddle)} words each. Consider trimming for easier reading.`);
  }

  const overallAvg = Math.round(totalWords / imageCount);
  if (overallAvg >= 15 && overallAvg <= 25) {
    tips.push(`Averaging ~${overallAvg} words/slide — right in the viral sweet spot.`);
  }

  const chunks = [hookText, ...middleChunks, closerText];
  return { chunks, tips, idealSlideCount };
}

/**
 * For text without sentence breaks — split by words with viral structure.
 */
function buildFromWords(
  text: string,
  imageCount: number,
  tips: string[],
  idealSlideCount: number
): SuggestedResult {
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length <= imageCount) {
    // Very little text — spread words evenly
    const chunks: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      chunks.push(i < words.length ? words[i] : '');
    }
    tips.push('Very short text — consider adding more content for impact.');
    return { chunks, tips, idealSlideCount };
  }

  // Short hook (first ~20% of words, min 3), body in middle, short closer
  const hookWordCount = Math.max(3, Math.min(12, Math.floor(words.length * 0.2)));
  const closerWordCount = Math.max(3, Math.min(10, Math.floor(words.length * 0.15)));
  const hookWords = words.slice(0, hookWordCount);
  const closerWords = words.slice(words.length - closerWordCount);
  const bodyWords = words.slice(hookWordCount, words.length - closerWordCount);

  const hookText = hookWords.join(' ') + '...';
  const closerText = closerWords.join(' ');
  tips.push('Text has no clear sentences. Slide 1 uses a short hook, last slide uses a short closer.');

  const middleSlotCount = imageCount - 2;
  if (middleSlotCount <= 0) {
    return { chunks: [hookText, closerText], tips, idealSlideCount };
  }

  const middleChunks = splitWordsIntoSlots(bodyWords.join(' '), middleSlotCount);
  return { chunks: [hookText, ...middleChunks, closerText], tips, idealSlideCount };
}

function splitSentences(text: string): string[] {
  const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
  const matches = text.match(regex);
  if (!matches || matches.length === 0) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

function splitWordsIntoSlots(text: string, slotCount: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return Array(slotCount).fill('');

  const base = Math.floor(words.length / slotCount);
  const extra = words.length % slotCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < slotCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    if (count === 0) {
      result.push('');
    } else {
      result.push(words.slice(idx, idx + count).join(' '));
      idx += count;
    }
  }

  return result;
}

function distributeMiddle(sentences: string[], slotCount: number): string[] {
  if (slotCount <= 0) return [];
  if (sentences.length === 0) return Array(slotCount).fill('');

  if (sentences.length <= slotCount) {
    const result: string[] = [];
    for (let i = 0; i < slotCount; i++) {
      result.push(i < sentences.length ? sentences[i] : '');
    }
    return result;
  }

  const base = Math.floor(sentences.length / slotCount);
  const extra = sentences.length % slotCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < slotCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    const chunk = sentences.slice(idx, idx + count).join(' ');
    result.push(chunk);
    idx += count;
  }

  return result;
}
