export function distributeText(fullText: string, imageCount: number): string[] {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();

  if (!cleaned || imageCount <= 0) {
    return Array(Math.max(0, imageCount)).fill('');
  }

  if (imageCount === 1) {
    return [cleaned];
  }

  // Split into sentences
  const sentences = splitSentences(cleaned);

  // If we got 0 or 1 sentence, or fewer sentences than images,
  // fall back to word-based splitting so every slide gets text
  if (sentences.length < imageCount) {
    return splitByWords(cleaned, imageCount);
  }

  // More sentences than images — distribute evenly, front-loading extras
  const base = Math.floor(sentences.length / imageCount);
  const extra = sentences.length % imageCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < imageCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    const chunk = sentences.slice(idx, idx + count).join(' ');
    result.push(chunk);
    idx += count;
  }

  return result;
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by a space or end of string
  const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
  const matches = text.match(regex);
  if (!matches || matches.length === 0) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

function splitByWords(text: string, imageCount: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return Array(imageCount).fill('');
  }

  // Always distribute words across all slides — never leave a slide empty
  // if there are words available
  const base = Math.floor(words.length / imageCount);
  const extra = words.length % imageCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < imageCount; i++) {
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
