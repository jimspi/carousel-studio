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

  const sentences = splitSentences(cleaned);
  const totalWords = cleaned.split(/\s+/).length;
  const idealSlideCount = Math.max(imageCount, Math.ceil(totalWords / 20));

  // Tip: suggest more slides if text is dense
  if (imageCount >= 2 && totalWords / imageCount > 30) {
    const recommended = Math.min(10, Math.ceil(totalWords / 20));
    if (recommended > imageCount) {
      tips.push(`Text is dense at ~${Math.round(totalWords / imageCount)} words/slide. Upload ${recommended} images for the ideal 15-20 words/slide.`);
    }
  }

  if (imageCount === 1) {
    return { chunks: [cleaned], tips, idealSlideCount };
  }

  // --- Slide 1: Hook ---
  // Pull the first sentence as a short, punchy hook
  const firstSentence = sentences[0] || cleaned;
  const firstWords = firstSentence.split(/\s+/).length;
  let hookText = firstSentence;

  const isQuestion = /\?/.test(firstSentence);
  const isBoldClaim = firstWords <= 12;

  if (!isQuestion && !isBoldClaim && firstWords > 20) {
    // Trim to first clause or first 15 words for a punchier hook
    const clauseMatch = firstSentence.match(/^([^,;:—]+[,;:—])/);
    if (clauseMatch && clauseMatch[1].split(/\s+/).length >= 4) {
      hookText = clauseMatch[1].replace(/[,;:—]+$/, '');
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
  const lastWords = lastSentence.split(/\s+/).length;
  let closerText = lastSentence;

  if (lastSentence && lastWords > 15) {
    // Shorten the closer
    const words = lastSentence.split(/\s+/);
    closerText = words.slice(0, 12).join(' ') + '.';
    tips.push('Last slide trimmed for a punchy closer. Keep it short — this is your call to action.');
  } else if (lastSentence) {
    tips.push('Last slide is short and punchy — perfect for a call to action.');
  }

  // --- Middle slides: body content ---
  // Collect remaining sentences (skip first and last that we already used)
  const remainingSentences = sentences.length > 2
    ? sentences.slice(1, -1)
    : sentences.length === 2
      ? [] // first is hook, second is closer, nothing in between
      : sentences.slice(1);

  const middleSlotCount = imageCount - 2; // first + last reserved

  if (middleSlotCount <= 0) {
    // Only 2 images: hook + closer
    const chunks = [hookText, closerText || hookText];
    if (!closerText) {
      chunks[1] = sentences.length > 1 ? sentences.slice(1).join(' ') : '';
    }
    return { chunks, tips, idealSlideCount };
  }

  // Distribute remaining sentences across middle slides targeting 15-25 words each
  const middleChunks = distributeMiddle(remainingSentences, middleSlotCount);

  // Check middle slide density
  const avgMiddle = middleChunks.reduce((sum, c) => sum + (c ? c.split(/\s+/).length : 0), 0) / Math.max(1, middleSlotCount);
  if (avgMiddle > 25 && avgMiddle <= 40) {
    tips.push(`Middle slides average ~${Math.round(avgMiddle)} words each. Consider trimming for easier reading.`);
  }

  if (!tips.some(t => t.includes('Optimal'))) {
    const overallAvg = Math.round(totalWords / imageCount);
    if (overallAvg >= 15 && overallAvg <= 25) {
      tips.push(`Averaging ~${overallAvg} words/slide — right in the viral sweet spot.`);
    }
  }

  const chunks = [hookText, ...middleChunks, closerText];
  return { chunks, tips, idealSlideCount };
}

function splitSentences(text: string): string[] {
  const regex = /[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g;
  const matches = text.match(regex);
  if (!matches) return [text];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
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

  // More sentences than slots — distribute evenly
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
