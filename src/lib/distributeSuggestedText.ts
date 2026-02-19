import { distributeText } from './distributeText';

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

  // Not enough sentences for meaningful hook/closer structure — use the
  // smart distributeText which handles clause splitting and minimum chunk sizes,
  // then just add tips about the structure.
  if (sentences.length < 3 && imageCount > 2) {
    const chunks = distributeText(cleaned, imageCount);
    if (sentences.length === 0) {
      tips.push('Text has no clear sentences. Consider adding punctuation for better slide breaks.');
    }
    tips.push('Text distributed evenly across slides. Add more sentence breaks for finer control.');

    const overallAvg = Math.round(totalWords / imageCount);
    if (overallAvg >= 15 && overallAvg <= 25) {
      tips.push(`Averaging ~${overallAvg} words/slide — right in the viral sweet spot.`);
    }
    return { chunks, tips, idealSlideCount };
  }

  // Enough sentences for hook/body/closer structure

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

  // Gather the body text (everything except first and last sentences)
  const bodyText = sentences.length > 2
    ? sentences.slice(1, -1).join(' ')
    : '';

  // Use the smart distributeText for the middle portion
  let middleChunks: string[];
  if (bodyText) {
    middleChunks = distributeText(bodyText, middleSlotCount);
  } else {
    middleChunks = Array(middleSlotCount).fill('');
  }

  const overallAvg = Math.round(totalWords / imageCount);
  if (overallAvg >= 15 && overallAvg <= 25) {
    tips.push(`Averaging ~${overallAvg} words/slide — right in the viral sweet spot.`);
  }

  const chunks = [hookText, ...middleChunks, closerText];
  return { chunks, tips, idealSlideCount };
}

function splitSentences(text: string): string[] {
  const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
  const matches = text.match(regex);
  if (!matches || matches.length === 0) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}
